const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('/tmp/work/obra-hcp/index.html', 'utf-8');

// Escenario real de Diego: en una sesión anterior (antes del fix de v53) el navegador guardó
// un snapshot COMPLETO de PR_DATA en localStorage (vía prGuardar, disparado por ej. al cargar
// un ítem nuevo desde el picker de catálogo). Ese snapshot trae los precios VIEJOS y erróneos
// de 3202/3203, con modif:0 porque el usuario nunca los editó a mano — son solo catálogo base
// arrastrado. El código ya tiene el precio corregido. Al recargar, prCargar() NO debe dejar que
// el snapshot viejo pise el precio corregido del código.
var snapshotViejo = {
  items: [
    {cod:'3202',nom:'Camion volcador 6m3 -camion c/semi',cat:'EQUIPOS',un:'hh',pu:198200,medida:'hh',fuente:'MASCIOTRA',modif:0,fecha:'2026-06'},
    {cod:'3203',nom:'Motocompresor',cat:'EQUIPOS',un:'hh',pu:312300,medida:'hh',fuente:'MASCIOTRA',modif:0,fecha:'2026-06'},
    // Un ítem que Diego SÍ editó a mano en su sesión anterior (modif>0) -> esa edición debe respetarse
    {cod:'3201',nom:'Retroexcavadora c/oruga E80HP editada a mano por Diego',cat:'EQUIPOS',un:'hh',pu:150000,medida:'hh',fuente:'Diego',modif:1700000000000},
    // Un ítem nuevo que Diego cargó (no existe en el catálogo base) -> debe conservarse siempre
    {cod:'CTEST123',nom:'Item custom de Diego',cat:'OTROS',un:'un',pu:5555,medida:'un',fuente:'Diego',modif:0}
  ],
  historial: [],
  ts: Date.now()
};

var dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'https://example.com/',
  beforeParse(window) {
    window.localStorage.setItem('obraerp_precios', JSON.stringify(snapshotViejo));
  }
});
const win = dom.window;

setTimeout(() => {
  try {
    var p3202 = win.PR_DATA.find(function(p){return p.cod==='3202';});
    var p3203 = win.PR_DATA.find(function(p){return p.cod==='3203';});
    var p3201 = win.PR_DATA.find(function(p){return p.cod==='3201';});
    var custom = win.PR_DATA.find(function(p){return p.cod==='CTEST123';});

    console.log('3202 pu:', p3202 && p3202.pu, '(esperado 112500, NO el viejo 198200)');
    console.log('3203 pu:', p3203 && p3203.pu, '(esperado 39141, NO el viejo 312300)');
    console.log('3201 pu:', p3201 && p3201.pu, '(esperado 150000, edición real del usuario respetada)');
    console.log('custom pu:', custom && custom.pu, '(esperado 5555, item nuevo conservado)');

    var ok1 = p3202 && p3202.pu === 112500;
    var ok2 = p3203 && p3203.pu === 39141 && p3203.nom === 'Motocompresor con martillo';
    var ok3 = p3201 && p3201.pu === 150000;
    var ok4 = custom && custom.pu === 5555;

    var allOk = ok1 && ok2 && ok3 && ok4;
    console.log('ok1(3202 no pisado por snapshot viejo):', ok1);
    console.log('ok2(3203 no pisado por snapshot viejo):', ok2);
    console.log('ok3(edicion real de usuario respetada):', ok3);
    console.log('ok4(item custom conservado):', ok4);
    console.log(allOk ? 'PASS_TOTAL' : 'FAIL_TOTAL');
    process.exit(allOk ? 0 : 1);
  } catch(e) {
    console.error('ERROR', e);
    process.exit(2);
  }
}, 800);
