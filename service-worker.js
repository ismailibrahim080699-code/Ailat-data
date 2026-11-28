const CACHE_NAME="ailat-data-sub-shell-v5";
const APP_SHELL=["/","/index.html","/login.html","/register.html","/dashboard.html","/manifest.webmanifest","/assets/ailat-mark.svg?v=20261129","/assets/ailat-logo.svg?v=20261129","/assets/ailat-theme.css?v=6"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 const request=event.request;if(request.method!=="GET")return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 if(request.mode==="navigate"){
  const appPages=["/","/index.html","/login.html","/register.html","/dashboard.html"];
  if(appPages.includes(url.pathname)){
   event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request);
    const update=fetch(request).then(response=>{
     if(response.ok)cache.put(request,response.clone());
     return response;
    }).catch(()=>null);
    if(cached){event.waitUntil(update);return cached;}
    const fresh=await update;
    return fresh||await cache.match("/login.html")||Response.error();
   })());
  }else{
   event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;}).catch(()=>caches.match(request).then(cached=>cached||caches.match("/login.html"))));
  }
  return;
 }
 event.respondWith(caches.match(request).then(cached=>{const network=fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;}).catch(()=>cached);return cached||network;}));
});