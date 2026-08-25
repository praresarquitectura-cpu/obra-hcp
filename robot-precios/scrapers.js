// scrapers.js — Lectura de precios desde sitios de ferreterias/corralones.
//
// Estrategia: primero intenta un metodo GENERICO (JSON-LD "schema.org/Product",
// que la mayoria de las plataformas de e-commerce modernas incluyen para SEO,
// incluyendo WooCommerce, Tiendanube y Magento 2). Si no lo encuentra, cae a un
// metodo ESPECIFICO por plataforma (atributos/clases tipicas de cada una).
//
// Si ningun metodo encuentra un precio confiable, la funcion devuelve
// { ok:false, motivo:'...' } en vez de inventar un numero.

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 OBRAERP-RobotDePrecios/1.0 (+contacto: praresarquitectura@gmail.com)';

async function fetchHtml(url) {
    const res = await fetch(url, {
          headers: { 'User-Agent': UA, 'Accept-Language': 'es-AR,es;q=0.9' },
          timeout: 20000
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' al pedir ' + url);
    return res.text();
}

// Convierte "$ 12.345,67" / "12345.67" / "12.345" (formato AR) a numero.
function parsePrecioAR(raw) {
    if (raw == null) return null;
    if (typeof raw === 'number') return raw;
    let s = String(raw).trim().replace(/[^\d.,]/g, '');
    if (!s) return null;
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > -1 && lastDot > -1) {
          if (lastComma > lastDot) { s = s.replace(/\./g, '').replace(',', '.'); }
          else { s = s.replace(/,/g, ''); }
    } else if (lastComma > -1) {
          s = s.replace(/\./g, '').replace(',', '.');
    } else {
          const parts = s.split('.');
          if (parts.length > 1 && parts[parts.length - 1].length === 3 && parts.length > 1 && s.replace(/\./g, '').length > 3) {
                  s = s.replace(/\./g, '');
          }
    }
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
}

// Metodo generico: busca <script type="application/ld+json"> con @type Product y offers.price
function extraerPrecioJsonLd($) {
    let precio = null, nombre = null;
    $('script[type="application/ld+json"]').each((_, el) => {
          if (precio != null) return;
          let data;
          try { data = JSON.parse($(el).contents().text()); } catch (e) { return; }
          const candidatos = Array.isArray(data) ? data : [data, ...(data['@graph'] || [])];
          for (const item of candidatos) {
                  if (!item || typeof item !== 'object') continue;
                  const tipo = item['@type'];
                  const esProducto = tipo === 'Product' || (Array.isArray(tipo) && tipo.includes('Product'));
                  if (!esProducto) continue;
                  let offers = item.offers;
                  if (Array.isArray(offers)) offers = offers[0];
                  if (offers && offers.price != null) {
                            const p = parsePrecioAR(offers.price);
                            if (p != null && p > 0) { precio = p; nombre = item.name || null; break; }
                  }
          }
    });
    return precio != null ? { precio, nombre } : null;
}

// Magento (Imcofue): data-price-amount="12345.6700" en [data-price-type="finalPrice"]
function extraerPrecioMagento($) {
    let el = $('[data-price-type="finalPrice"] .price[data-price-amount]').first();
    if (!el.length) el = $('.price-box .price[data-price-amount]').first();
    if (!el.length) el = $('[data-price-amount]').first();
    if (el.length) {
          const amt = el.attr('data-price-amount');
          const p = parsePrecioAR(amt);
          if (p != null && p > 0) return { precio: p, nombre: ($('h1.page-title span').first().text() || '').trim() || null };
    }
    return null;
}

// WooCommerce (Casa Fuegia): <p class="price"> ... <ins> precio con descuento si hay oferta,
// si no el <bdi> directo. Preferimos el precio "actual" (con descuento si existe).
function extraerPrecioWooCommerce($) {
    let scope = $('.summary .price').first();
    if (!scope.length) scope = $('p.price').first();
    if (!scope.length) return null;
    let texto = null;
    const ins = scope.find('ins .woocommerce-Price-amount, ins bdi').first();
    if (ins.length) texto = ins.text();
    else {
          const amt = scope.find('.woocommerce-Price-amount, bdi').last().text();
          texto = amt;
    }
    const p = parsePrecioAR(texto);
    if (p != null && p > 0) {
          const nombre = ($('h1.product_title').first().text() || '').trim() || null;
          return { precio: p, nombre };
    }
    return null;
}

// Tiendanube (Casa Zeila): meta[property="tiendanube:price"] es el metodo principal;
// si no esta, se prueban microdata/data-price como respaldo.
function extraerPrecioTiendanube($) {
    let el = $('meta[property="tiendanube:price"]').first();
    if (el.length) {
          const p = parsePrecioAR(el.attr('content'));
          if (p != null && p > 0) {
                  const nombreEl = $('meta[property="og:title"]').first();
                  return { precio: p, nombre: (nombreEl.attr('content') || '').trim() || null };
          }
    }
    el = $('[itemprop="price"]').first();
    if (el.length) {
          const p = parsePrecioAR(el.attr('content') || el.text());
          if (p != null && p > 0) return { precio: p, nombre: null };
    }
    el = $('[data-price]').first();
    if (el.length) {
          const p = parsePrecioAR(el.attr('data-price'));
          if (p != null && p > 0) return { precio: p, nombre: null };
    }
    return null;
}

const EXTRACTORES_POR_PLATAFORMA = {
    imcofue: extraerPrecioMagento,
    casafuegia: extraerPrecioWooCommerce,
    casazeila: extraerPrecioTiendanube
};

// sitio: 'imcofue' | 'casafuegia' | 'casazeila'
async function leerPrecio(url, sitio) {
    let html;
    try {
          html = await fetchHtml(url);
    } catch (e) {
          return { ok: false, motivo: 'No se pudo acceder a la pagina (' + e.message + ')' };
    }
    const $ = cheerio.load(html);

  let r = extraerPrecioJsonLd($);
    if (!r && EXTRACTORES_POR_PLATAFORMA[sitio]) {
          r = EXTRACTORES_POR_PLATAFORMA[sitio]($);
    }
    if (!r) {
          return { ok: false, motivo: 'No se encontro un precio reconocible en la pagina (puede que el sitio haya cambiado de diseno)' };
    }
    return { ok: true, precio: Math.round(r.precio * 100) / 100, nombreDetectado: r.nombre || null };
}

module.exports = {
    leerPrecio, parsePrecioAR,
    _internal: { extraerPrecioJsonLd, extraerPrecioMagento, extraerPrecioWooCommerce, extraerPrecioTiendanube }
};
