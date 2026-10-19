/* Котик Штрих — офлайн-кэш (файл создаёт tools/build.py) */
const VERSION='shtrih-0c9d4db839';
const CORE=["./", "config.js", "fonts/fonts.css", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-32.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "index.html", "js/app.js", "js/course.js", "js/geometry-pro.js", "js/geometry.js", "js/lessons-1-4.js", "js/lessons-more.js", "js/lessons-pro-a.js", "js/lessons-pro-b.js", "js/speech-text.js", "manifest.webmanifest", "privacy.html"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('shtrih-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(caches.open(VERSION).then(async c=>{
    const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r;}).catch(()=>hit||Response.error());
    return hit||net;   /* сначала из кэша (работает без интернета), обновление — в фоне */
  }));
});
