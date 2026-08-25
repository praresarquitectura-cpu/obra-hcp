# Robot de precios de OBRAERP — version solo web (100% gratis)

Como decidiste dejar OBRAERP solo en la web (sin programa de escritorio), el robot que consulta Imcofue, Casa Fuegia y Casa Zeila ya no corre en tu computadora — corre gratis en GitHub, una vez por semana (o cuando vos quieras dispararlo a mano), y dan resultado directo en Firestore para que los veas en la pestana **Precios** de OBRAERP, exactamente igual que antes.

No hace falta activar el plan Blaze de Firebase ni pagar nada — esto no usa Firebase Functions.

## Paso 1 — Copiar esta carpeta a tu repositorio

Copia la carpeta `robot-precios/` (con todo adentro, incluida la subcarpeta oculta `.github/workflows/`) a la raiz de tu repositorio de GitHub (`praresarquitectura-cpu/obra-hcp`, o donde publiques OBRAERP).

## Paso 2 — Crear una "cuenta de servicio" de Firebase (una sola vez, gratis)

Esto es lo que le da permiso al robot para escribir en tu base de datos sin que sea un usuario logueado:

1. Anda a la [consola de Firebase](https://console.firebase.google.com) → tu proyecto → icono de configuracion → **Configuracion del proyecto** → pestana **Cuentas de servicio**.
2. 2. Boton **"Generar nueva clave privada"**. Se descarga un archivo `.json` — guardalo, es sensible (da acceso completo a tu base de datos), no lo compartas ni lo subas a ningun repositorio publico.
  
   3. ## Paso 3 — Cargar esa clave como "secreto" en GitHub
  
   4. 1. En tu repositorio de GitHub, anda a **Settings** → **Secrets and variables** → **Actions**.
      2. 2. Boton **"New repository secret"**.
         3. 3. Nombre: `FIREBASE_SERVICE_ACCOUNT`
            4. 4. Valor: pega el contenido COMPLETO del archivo `.json` que descargaste en el Paso 2 (abrilo con el Bloc de notas y copia todo).
               5. 5. Guardar.
                 
                  6. ## Paso 4 — Listo, ya esta funcionando
                 
                  7. El robot va a correr automaticamente todos los lunes a las 8:00 (hora Ushuaia). Si en algun momento queres que corra en el momento (por ejemplo, para probar que quedo bien configurado), anda a la pestana **Actions** de tu repositorio → **"Robot de precios OBRAERP"** → boton **"Run workflow"**.
                 
                  8. ## Como se usa desde la app
                 
                  9. Nada cambia respecto a como ya lo tenias pensado:
                 
                  10. 1. En la pestana **Precios** de OBRAERP, cada usuario agrega los materiales que quiere seguir (codigo, sitio, URL del producto).
                      2. 2. El robot, corriendo en GitHub, los revisa una vez por semana.
                         3. 3. Las sugerencias aparecen en "Sugerencias pendientes" — cada usuario las revisa y decide Aceptar o Rechazar. Nada se actualiza solo sin que la persona lo confirme.
                           
                            4. ## Por que esto y no que corra en el navegador de cada usuario
                           
                            5. Un navegador no puede pedirle HTML a otro sitio (Imcofue, Casa Fuegia, Casa Zeila) directamente por una restriccion de seguridad llamada CORS — ningun sitio puede evitar esa restriccion, es parte de como funcionan todos los navegadores. Por eso el robot necesita correr en un lugar que no sea un navegador: antes iba a ser el programa de escritorio (Node, sin esa restriccion); ahora, al quedarnos solo con la web, el lugar gratuito que cumple esa funcion es GitHub Actions.
                           
                            6. ## Costo
                           
                            7. Firestore (leer/escribir en tu base de datos) es gratis en el plan Spark hasta un volumen de uso muy por encima de lo que este robot necesita. GitHub Actions tambien da minutos gratis de sobra para una corrida semanal de pocos minutos. No hace falta ninguna tarjeta ni plan pago en ningun lado.
                            8. 
