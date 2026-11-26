const CACHE="diario-v4";
const BASE=["./","index.html","manifest.json","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BASE.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const r=e.request, u=new URL(r.url);
  if(r.method!=="GET") return;
  const local=u.origin===location.origin, fonte=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!local&&!fonte) return;
  const pagina = r.mode==="navigate" || (local && /(\/|index\.html)$/.test(u.pathname));
  if(pagina){
    // página: tenta a internet primeiro (pega a versão nova); sem sinal, usa a guardada
    e.respondWith(caches.open(CACHE).then(async c=>{
      try{
        const x=await Promise.race([fetch(r,{cache:"no-store"}), new Promise((_,no)=>setTimeout(()=>no(new Error("lento")),5000))]);
        if(x&&x.ok){ c.put("index.html",x.clone()); return x; }
        throw new Error("falhou");
      }catch(err){ return (await c.match(r,{ignoreSearch:true})) || (await c.match("index.html")) || fetch(r); }
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c=>{
    const salvo=await c.match(r,{ignoreSearch:local});
    const rede=fetch(r).then(x=>{ if(x&&(x.ok||x.type==="opaque")) c.put(r,x.clone()); return x; });
    if(salvo){ e.waitUntil(rede.catch(()=>{})); return salvo; }
    return rede;
  }));
});
