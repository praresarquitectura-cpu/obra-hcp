const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('/tmp/work/obra-hcp/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'https://example.com/' });
const win = dom.window;

setTimeout(() => {
  try {
    win.HTMLElement.prototype.scrollIntoView = function(){};

    var it = { id:'iEM', nom:'Estructura Metálica', un:'m²', unidades_permitidas:['m²','kg'],
      dims:[{id:'d',desc:'',l:10,a:5,h:0,q:1,sust:false}],
      mats:[], mo:[] };
    win.CP_RUBROS = [{id:'r1', nom:'ESTRUCTURA METÁLICA', items:[it]}];
    win.CP_RUBRO_TAB='r1';

    var htmlOut0 = win.cpRenderItem('r1', it);
    var showsToggle = htmlOut0.indexOf('Estructura Met') !== -1 && htmlOut0.indexOf('cpMetToggle') !== -1;
    console.log('showsToggle:', showsToggle);

    win.cpMetToggle('iEM');
    console.log('metModo tras toggle:', it.metModo);
    var modoDetalladoOk = it.metModo === 'detallado';

    win.cpMetAgregarFila('iEM');
    win.cpMetUFila('iEM', 0, 'elemento', 'COLUMNAS METALICAS');
    win.cpMetUFila('iEM', 0, 'cant', '5');
    win.cpMetElegirPerfil('iEM', 0, '435');
    win.cpMetUFila('iEM', 0, 'numPerf', '2');
    win.cpMetUFila('iEM', 0, 'long', '2.5');

    var g = win.cpMetGrupos(it);
    var mlSinDesp = g.grupos['435'].ml;
    var mlConDesp = Math.round(mlSinDesp * g.desp * 100) / 100;
    var parcialOk = mlSinDesp === 25;
    var despDefaultOk = it.metDesp === 30;
    var despOk = mlConDesp === 32.5;

    var matOk = it.mats.length === 1 && it.mats[0].id === '435' && it.mats[0].rend === 32.5 && it.mats[0].un === 'm';

    // 5) El item pasa a computarse GLOBAL (lump-sum): un='gl', qty=1 (no mas m2).
    // Fijado a proposito en v57 (pedido de Diego): 'gl' consistente con el resto de
    // items lump-sum de la app (Cartel de Obra, Demolicion Gl, Retiro Gl, etc.), no 'un'.
    var unOk = it.un === 'gl';
    var qty = win.cpQty(it.dims, it.un);
    var qtyOk = qty === 1;

    win.cpMetAgregarFila('iEM');
    win.cpMetUFila('iEM', 1, 'elemento', 'COLUMNAS PORTICO X2');
    win.cpMetUFila('iEM', 1, 'cant', '2');
    win.cpMetElegirPerfil('iEM', 1, '435');
    win.cpMetUFila('iEM', 1, 'numPerf', '2');
    win.cpMetUFila('iEM', 1, 'long', '2.5');

    var g2 = win.cpMetGrupos(it);
    var mlTotalEsperado = 25 + 10;
    var acumOk = g2.grupos['435'].ml === mlTotalEsperado && it.mats.length === 1;

    win.cpMetAgregarFila('iEM');
    win.cpMetUFila('iEM', 2, 'elemento', 'VM 1');
    win.cpMetUFila('iEM', 2, 'cant', '2');
    win.cpMetElegirPerfil('iEM', 2, '445');
    win.cpMetUFila('iEM', 2, 'numPerf', '2');
    win.cpMetUFila('iEM', 2, 'long', '1.63');
    var dosGruposOk = it.mats.length === 2;

    win.cpMetToggle('iEM');
    var vuelveGlobalOk = it.metModo === 'global';
    var htmlOutGlobal = win.cpRenderItem('r1', it);

    var ok = showsToggle && modoDetalladoOk && parcialOk && despDefaultOk && despOk && matOk && unOk && qtyOk && acumOk && dosGruposOk && vuelveGlobalOk;
    console.log(ok ? 'PASS_TOTAL' : 'FAIL_TOTAL');
    process.exit(ok ? 0 : 1);
  } catch(e) {
    console.error('ERROR', e);
    process.exit(2);
  }
}, 500);
