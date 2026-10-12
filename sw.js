const VERSION='v1.0.2';
// Prefix includes the deployment scope so unrelated GitHub Pages apps keep their caches.
const PREFIX='bangladesh-affairs:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const CORE=['./','./index.html','./assets/style.css','./assets/app.js','./assets/content.js','./assets/vendor/d3.min.js','./assets/vendor/d3-LICENSE.txt','./assets/data/districts.geojson','./assets/data/rivers.geojson','./assets/data/district-info.json','./assets/data/gi.json','./assets/data/communities.json','./assets/data/places.json','./assets/data/metadata.json','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/fonts/bangla.woff2','./assets/fonts/OFL.txt','./manifest.webmanifest','./sources/bangladesh-affairs-syllabus.png','./sources/geography-environment-syllabus.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();for(const client of await self.clients.matchAll())client.postMessage({type:'OFFLINE_READY'});})());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(event.request.mode==='navigate')event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok)return response;}catch{}return (await caches.open(CACHE)).match(new URL('./index.html',self.registration.scope).href);})());
  else event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(event.request,{ignoreSearch:true});if(saved)return saved;return fetch(event.request);})());
});
