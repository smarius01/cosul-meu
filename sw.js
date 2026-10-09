const CACHE='cosul-meu-v4';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['./','./index.html','./src/app.mjs','./src/model.mjs','./src/style.css','./manifest.webmanifest'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cosul-meu-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location.href).pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE); const cached=await cache.match(event.request);
  if(url.pathname.includes('/vendor/')||url.pathname.includes('/icons/')) {if(cached)return cached;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}
  try {const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;} catch {return cached||new Response('Nu există încă o copie offline.',{status:503});}
 })());
});
