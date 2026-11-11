// Daga's Manager - OFFLINE-FIRST. A chaque mise a jour : changer le numero (v60, v61...).
// Robustesse : l'ancien cache (qui fonctionne) n'est JAMAIS supprime tant que le nouveau n'a pas
// la coquille de l'app (index.html). Une mise a jour sur connexion faible ne peut donc pas casser le hors-ligne.
const CACHE='dagas-manager-v61';
// Coquille indispensable au fonctionnement hors ligne (mise en cache stricte, tout-ou-rien)
const ESSENTIELS=['./','./index.html'];
// Secondaires : au mieux (une icone ou une page legale manquante ne doit pas bloquer la mise a jour)
const EXTRAS=['./confidentialite.html','./conditions.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png','./apple-touch-icon.png','./favicon-32.png'];

self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  // 1) Coquille : si elle ne peut PAS etre telechargee (connexion faible), addAll rejette =>
  //    l'installation echoue, l'ancien service worker reste actif avec son cache => l'app marche toujours hors ligne.
  await c.addAll(ESSENTIELS.map(u=>new Request(u,{cache:'reload'})));
  // 2) Secondaires : au mieux, sans bloquer.
  await Promise.all(EXTRAS.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})));
  await self.skipWaiting();
})());});

self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  // On ne supprime les anciens caches QUE si le nouveau contient bien index.html (sinon on garde l'ancien, qui fonctionne).
  const c=await caches.open(CACHE);
  const shellOk=await c.match('./index.html');
  if(shellOk){
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  }
  await self.clients.claim();
})());});

self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  if(r.mode==='navigate'){const p=new URL(r.url).pathname;
    if(p.endsWith('/')||p.endsWith('/index.html')){
      // Ouverture de l'app : index.html depuis N'IMPORTE QUEL cache -> reseau -> (dernier recours) erreur.
      // Garantit l'ouverture hors ligne des que l'app a ete chargee au moins une fois.
      e.respondWith((async()=>{
        return (await caches.match('./index.html')) || (await fetch(r).catch(()=>null)) || Response.error();
      })());
      return;
    }
    // Autres pages (confidentialite...) : en ligne d'abord, sinon la copie hors ligne, sinon l'app.
    e.respondWith(fetch(r).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match('./index.html'))));
    return;
  }
  // Lecteur PDF (pdf.min.js, pdf.worker.min.js) : garde une copie apres la 1re ouverture du manuel.
  if(/\/pdf(\.worker)?\.min\.js$/.test(new URL(r.url).pathname)){e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(x=>x||fetch(r).then(y=>{if(y.ok)c.put(r,y.clone());return y;}))));return;}
  // Le manuel (manuel.pdf) est lu morceau par morceau : on le laisse passer directement.
  if(r.headers.has('range'))return;
  // Par defaut : cache d'abord ; sinon reseau, et on met en cache une reponse reussie (auto-reparation du cache).
  e.respondWith(caches.match(r).then(x=>x||fetch(r).then(y=>{try{if(y&&y.ok&&y.type==='basic')caches.open(CACHE).then(c=>c.put(r,y.clone()));}catch(_){}return y;}).catch(()=>x)));
});
