const VERSION='v1.2.1';
// Prefix includes the deployment scope so unrelated GitHub Pages apps keep their caches.
const PREFIX='bangladesh-affairs:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const CORE=["./","./index.html","./assets/offline.js","./assets/style.css","./assets/glass.css","./assets/fonts/bangla.woff2","./assets/fonts/OFL.txt","./assets/icons/icon-192.png","./assets/icons/icon-512.png","./assets/vendor/d3-LICENSE.txt","./manifest.webmanifest","./sources/bangladesh-affairs-syllabus.png","./sources/geography-environment-syllabus.png"];
self.addEventListener('install',event=>{event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // Bypass the HTTP cache when assembling a release, then activate only a complete shell.
  await cache.addAll(CORE.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})));
  await self.skipWaiting();
})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();for(const client of await self.clients.matchAll())client.postMessage({type:'OFFLINE_READY'});})());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(event.request.mode==='navigate')event.respondWith((async()=>{
    // A repair link must reach the recovery code even if an old shell is cached.
    if(url.searchParams.get('repair')==='1')return fetch(new Request(event.request,{cache:'reload'}));
    const saved=await (await caches.open(CACHE)).match(new URL('./index.html',self.registration.scope).href);
    return saved||fetch(event.request);
  })());
  else event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(event.request,{ignoreSearch:true});if(saved)return saved;return fetch(event.request);})());
});
