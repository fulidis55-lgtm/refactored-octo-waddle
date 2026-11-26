// Greek. IF: работа без интернета. Новая версия страницы подхватывается сама, когда есть сеть.
const V = "polyglot-v1";
const CORE = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  if (r.mode === "navigate") {
    // страница: сначала сеть (чтобы приходили обновления), без сети берём сохранённую
    e.respondWith(
      fetch(r)
        .then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })
        .catch(() => caches.match(r).then(m => m || caches.match("./")))
    );
    return;
  }
  // иконки и манифест: из памяти, а в фоне обновляем
  e.respondWith(
    caches.match(r).then(m => {
      const net = fetch(r)
        .then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })
        .catch(() => m);
      return m || net;
    })
  );
});
