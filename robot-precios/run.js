// run.js — Robot de precios de OBRAERP, version "solo web".
//
// Por que corre aca y no en Firebase Functions: Firebase Functions exige el
// plan Blaze (pago por uso) para poder desplegarse. Diego pidio explicitamente
// no pagar nada. La solucion: este script es un programa de Node comun y
// corriente, y lo que lo ejecuta gratis, con un horario fijo, es GitHub Actions.
// Escribe los resultados directo en Firestore usando el SDK de administrador
// (firebase-admin), que es una forma de acceso autenticado y gratuita — no pasa
// por Cloud Functions ni por Cloud Scheduler, asi que nunca pide un plan pago.
//
// Que hace, para cada usuario que tenga materiales en seguimiento
// (users/{uid}/config/preciosTracking):
//   1. Visita la URL de cada material en Imcofue / Casa Fuegia / Casa Zeila
//      y lee el precio publicado (usando scrapers.js, ya probado).
//   2. Compara contra el ultimo precio conocido (users/{uid}/config/precios).
//   3. Si cambio lo suficiente, crea una sugerencia en
//      users/{uid}/preciosSugeridos/{autoId} con estado 'pendiente'.
//   4. NUNCA toca un presupuesto ni el catalogo de precios directamente —
//      la decision de aceptar cada sugerencia la toma cada usuario desde la app.

const admin = require('firebase-admin');
const { leerPrecio } = require('./scrapers');

const UMBRAL_VARIACION_PCT = 1; // no crear sugerencia si el cambio es menor al 1%

function initFirebase() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
          throw new Error('Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT (ver README-ROBOT-DE-PRECIOS.md).');
    }
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return admin.firestore();
}

async function ejecutarRobot(db) {
    const resumen = { usuariosProcesados: 0, materialesConsultados: 0, sugerenciasCreadas: 0, errores: 0 };

  const configSnap = await db.collectionGroup('config').get();
    const trackingDocs = configSnap.docs.filter(d => d.id === 'preciosTracking');

  console.log('Usuarios con materiales en seguimiento: ' + trackingDocs.length);

  const cacheUrl = new Map();

  for (const trackDoc of trackingDocs) {
        const uid = trackDoc.ref.parent.parent.id;
        const data = trackDoc.data() || {};
        const items = Array.isArray(data.items) ? data.items : [];
        if (!items.length) continue;

      resumen.usuariosProcesados++;

      let preciosActuales = {};
        try {
                const preciosDoc = await db.collection('users').doc(uid).collection('config').doc('precios').get();
                if (preciosDoc.exists) {
                          const pd = preciosDoc.data();
                          (pd.items || []).forEach(p => { if (p.cod) preciosActuales[p.cod] = p.pu; });
                }
        } catch (e) {
                console.warn('No se pudo leer precios actuales de ' + uid, e.message);
        }

      for (const item of items) {
              if (!item || !item.cod || !item.url || !item.sitio) continue;
              resumen.materialesConsultados++;

          let lectura;
              const cacheKey = item.sitio + '|' + item.url;
              if (cacheUrl.has(cacheKey)) {
                        lectura = cacheUrl.get(cacheKey);
              } else {
                        try {
                                    lectura = await leerPrecio(item.url, item.sitio);
                        } catch (e) {
                                    lectura = { ok: false, motivo: 'Error inesperado: ' + e.message };
                        }
                        cacheUrl.set(cacheKey, lectura);
              }

          const sugerenciasRef = db.collection('users').doc(uid).collection('preciosSugeridos');

          if (!lectura.ok) {
                    resumen.errores++;
                    await sugerenciasRef.add({
                                cod: item.cod, nombre: item.nom || null, sitio: item.sitio, url: item.url,
                                estado: 'error', motivo: lectura.motivo,
                                fecha: admin.firestore.FieldValue.serverTimestamp()
                    });
                    continue;
          }

          const puAnterior = preciosActuales[item.cod];
              const puNuevo = lectura.precio;
              let variacionPct = null;
              if (puAnterior != null && puAnterior > 0) {
                        variacionPct = Math.round(((puNuevo - puAnterior) / puAnterior) * 1000) / 10;
                        if (Math.abs(variacionPct) < UMBRAL_VARIACION_PCT) continue;
              }

          const yaExiste = await sugerenciasRef
                .where('cod', '==', item.cod).where('sitio', '==', item.sitio)
                .where('estado', '==', 'pendiente').limit(1).get();
              if (!yaExiste.empty) {
                        const existente = yaExiste.docs[0];
                        if (existente.data().puNuevo === puNuevo) continue;
                        await existente.ref.update({ estado: 'reemplazada' });
              }

          await sugerenciasRef.add({
                    cod: item.cod,
                    nombre: item.nom || lectura.nombreDetectado || null,
                    sitio: item.sitio,
                    url: item.url,
                    puAnterior: puAnterior != null ? puAnterior : null,
                    puNuevo: puNuevo,
                    variacionPct: variacionPct,
                    estado: 'pendiente',
                    fecha: admin.firestore.FieldValue.serverTimestamp()
          });
              resumen.sugerenciasCreadas++;
      }
  }

  return resumen;
}

(async () => {
    try {
          const db = initFirebase();
          const resumen = await ejecutarRobot(db);
          console.log('Robot de precios — resumen de esta corrida:', JSON.stringify(resumen, null, 2));
          process.exit(0);
    } catch (e) {
          console.error('Robot de precios — error fatal:', e);
          process.exit(1);
    }
})();
