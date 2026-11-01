// sw.js — "Service worker" : garde une copie de l'appli sur le téléphone
// pour qu'elle s'ouvre même sans internet.
// ⚠️ Change le numéro de VERSION à chaque mise à jour de l'appli.
const VERSION = 'uppercut-v1';
const FICHIERS = [
  './', 'index.html', 'style.css', 'data.js', 'app.js', 'manifest.json',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(cles =>
    Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Réseau d'abord (pour avoir les mises à jour), copie locale si pas d'internet.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(rep => {
        const copie = rep.clone();
        caches.open(VERSION).then(c => c.put(e.request, copie));
        return rep;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
