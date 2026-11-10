const CACHE="diario-v2";
const BASE=["./","index.html","manifest.json","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const r=e.request, u=new URL(r.url);
  if(r.method!=="GET") return;
  const local=u.origin===location.origin, fonte=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!local&&!fonte) return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const salvo=await c.match(r,{ignoreSearch:local}) || (r.mode==="navigate"?await c.match("index.html"):undefined);
    const rede=fetch(r).then(x=>{ if(x&&(x.ok||x.type==="opaque")) c.put(r,x.clone()); return x; });
    if(salvo){ e.waitUntil(rede.catch(()=>{})); return salvo; }
    return rede;
  }));
});
