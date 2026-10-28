// Daga's Manager - hors ligne. A chaque mise a jour : changer v1 en v2, v3...
const CACHE='dagas-manager-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./manifest.json'])).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
e.respondWith(r.mode==='navigate'?caches.match('./index.html').then(x=>x||fetch(r)):caches.match(r).then(x=>x||fetch(r)));});
