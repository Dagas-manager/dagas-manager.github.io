// Daga's Manager - hors ligne. A chaque mise a jour : changer le numero (v5, v6...)
const CACHE='dagas-manager-v5';
const FICHIERS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png','./apple-touch-icon.png','./favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FICHIERS.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
e.respondWith(r.mode==='navigate'?caches.match('./index.html').then(x=>x||fetch(r)):caches.match(r).then(x=>x||fetch(r)));});
