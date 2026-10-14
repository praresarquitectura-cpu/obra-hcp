/* OBRAERP — Service Worker
   Agregado 2026-10-14 (3ra vuelta) a pedido de Diego: que la app instalada en el
   celular se actualice sola al entrar, igual que en la PC.

   Antes el Service Worker se generaba como un Blob dentro del propio index.html,
   lo cual tiene un problema: una URL blob: es nueva en cada carga de página y el
   navegador no la puede "revisar" después para ver si cambió (no es un archivo
   real en el servidor), así que en el celular la app instalada podía quedarse
   mostrando una versión vieja sin darse cuenta de que había una nueva.

   Ahora el Service Worker es este archivo real (sw.js), publicado junto al
   index.html en el mismo repositorio. Así el navegador SÍ puede comparar esta
   versión contra la que tiene instalada cada vez que se abre la app, y bajar
   la nueva automáticamente — en el celular y en la PC por igual. */
var CACHE='obraerp-v3';

self.addEventListener('install',function(e){
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var isNav = e.request.mode==='navigate' || e.request.destination==='document';
  if(isNav){
    // El documento principal (index.html): siempre se pide a la red ignorando
    // cualquier caché HTTP intermedia, para que abrir la app — en el celular o
    // en la PC — siempre dispare el chequeo de si hay una versión nueva publicada.
    e.respondWith(
      fetch(e.request,{cache:'reload'}).then(function(r){
        var copy=r.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,copy);});
        return r;
      }).catch(function(){return caches.match(e.request);})
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(r){
      var copy=r.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,copy);});
      return r;
    }).catch(function(){return caches.match(e.request);})
  );
});
