const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('/tmp/work/obra-hcp/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'https://example.com/' });
const win = dom.window;

setTimeout(() => {
  try {
    function get(cod) { return win.PR_DATA.find(function(p){return p.cod===cod;}); }

    var esperados = {
      '454': 4920.78,
      '455': 8845.89,
      '456': 7800.20,
      '457': 13646.59,
      '459': 10374.41,
      '460': 14009.33,
      '461': 4380.42,
      '462': 3064.54,
      '463': 4702.43,
      '465': 1742.84,
      '467': 6081.24
    };

    var allOk = true;
    Object.keys(esperados).forEach(function(cod) {
      var item = get(cod);
      var ok = item && Math.abs(item.pu - esperados[cod]) < 0.01;
      console.log('cod', cod, ':', item && item.pu, '(esperado', esperados[cod] + ')', ok ? 'OK' : 'FAIL');
      if (!ok) allOk = false;
    });

    var it458 = get('458');
    var flag458 = it458 && it458.pu === 0 && /No encontrado/.test(it458.fuente);
    console.log('458 en pu:0 con nota "No encontrado" (no inventado):', flag458);
    if (!flag458) allOk = false;

    var cerco = win.CP_APU_DATA.find(function(a){return a.descrip==='Cerco de plaza';});
    var mat454 = cerco.mats.find(function(m){return m.cod==='454';});
    var puResuelto = win.apuGetPU('454', mat454.pu);
    var apuOk = puResuelto === get('454').pu;
    console.log('APU Cerco de plaza resuelve 454 en vivo:', puResuelto, '=== PR_DATA:', get('454').pu, apuOk);
    if (!apuOk) allOk = false;

    console.log(allOk ? 'PASS_TOTAL' : 'FAIL_TOTAL');
    process.exit(allOk ? 0 : 1);
  } catch(e) {
    console.error('ERROR', e);
    process.exit(2);
  }
}, 500);
