// Daga's Manager - hors ligne. A chaque mise a jour : changer le numero (v5, v6...)
const CACHE='dagas-manager-v55';
const FICHIERS=['./','./index.html','./confidentialite.html','./conditions.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png','./apple-touch-icon.png','./favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FICHIERS.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
if(r.mode==='navigate'){const p=new URL(r.url).pathname;
if(p.endsWith('/')||p.endsWith('/index.html')){e.respondWith(caches.match('./index.html').then(x=>x||fetch(r)));return;}
// Autres pages (politique de confidentialite...) : la vraie page, en ligne d'abord, sinon la copie hors ligne
e.respondWith(fetch(r).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match('./index.html'))));return;}
// Lecteur PDF (pdf.min.js, pdf.worker.min.js) : garde une copie apres la 1re ouverture du manuel
if(/\/pdf(\.worker)?\.min\.js$/.test(new URL(r.url).pathname)){e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(x=>x||fetch(r).then(y=>{if(y.ok)c.put(r,y.clone());return y;}))));return;}
// Le manuel (manuel.pdf) est lu morceau par morceau : on le laisse passer directement
if(r.headers.has('range'))return;
e.respondWith(caches.match(r).then(x=>x||fetch(r)));});
