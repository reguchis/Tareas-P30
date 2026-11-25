/* Tareas y Calificaciones (versión general, Tareas-G): copia sin internet. Vive en el mismo sitio que la app de Asistencia: solo borra SUS copias viejas (tareasg-app-…)
   y, si otra app le borrara la suya, la vuelve a guardar sola la siguiente vez que se abre con internet (heal).
   beta.7: lo que la app pide «sin copia» (revisar si hay versión nueva) va directo a internet. */
const C='tareasg-app-1.2.2',F=['index.html','manifest.webmanifest','icon-192-v3.png','icon-512-v3.png','icon-maskable-512-v3.png','apple-touch-icon-v3.png','favicon-32-v3.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>fetch(new Request(u,{cache:'reload'})).then(r=>{if(!r.ok)throw new Error(u);return c.put(u,r)})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C&&x.startsWith('tareasg-app-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
function heal(){return caches.open(C).then(c=>Promise.all(F.map(f=>c.match(f).then(r=>r||fetch(new Request(f,{cache:'reload'})).then(x=>x.ok?c.put(f,x):0)).catch(()=>0))))}
/* 1.2.1: el manifiesto y los íconos se piden primero a internet (3 s); sin conexión se usa la copia. Así el teléfono ve el ícono nuevo. */
const ICO=/(manifest\.webmanifest|\.png)$/;
async function netFirst(q){const c=await caches.open(C),u=new URL(q.url);u.search='';const k=u.href;
try{const r=await Promise.race([fetch(k,{cache:'no-cache'}),new Promise((_,j)=>setTimeout(()=>j(0),3000))]);if(r&&r.ok){await c.put(k,r.clone());return r}}catch(x){}
return (await c.match(k))||(await caches.match(q,{ignoreSearch:true}))||Response.error()}
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!='GET'||new URL(q.url).origin!=location.origin)return;if(q.cache=='no-store')return;
if(q.mode!='navigate'&&ICO.test(new URL(q.url).pathname)){e.respondWith(netFirst(q));return}
if(q.mode=='navigate'){const p=new URL(q.url).pathname,b=new URL('./',self.registration.scope).pathname;if(p!=b&&p!=b+'index.html')return;e.respondWith((async()=>{const c=await caches.open(C),old=await c.match('index.html');
const net=fetch(q.url,{cache:'no-cache'}).then(r=>r.ok&&/text\/html/.test(r.headers.get('content-type')||'')?c.put('index.html',r.clone()).then(()=>r):r);e.waitUntil(net.then(r=>r.ok?heal():0).catch(()=>{}));
if(old)return old;
return net.catch(()=>new Response('Sin conexion',{status:503}))})());return}
e.respondWith(caches.match(q,{ignoreSearch:true}).then(r=>r||fetch(q).then(x=>{const u=new URL(q.url);u.search='';if(x.ok&&F.some(f=>new URL(f,location.href).href==u.href)){const y=x.clone();e.waitUntil(caches.open(C).then(c=>c.put(u.href,y)))}return x})))});
