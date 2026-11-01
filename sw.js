// Service worker do WorldMan: guarda todos os arquivos para jogar offline.
// Ao mudar qualquer arquivo do jogo, aumente a versão abaixo.

const VERSION = 'worldman-v1.0.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/main.js',
  './js/config.js',
  './js/utils.js',
  './js/sprites.js',
  './js/world.js',
  './js/enemies.js',
  './js/game.js',
  './js/post.js',
  './js/input.js',
  './js/audio.js',
  './js/storage.js',
  './assets/fonts/cinzel-latin.woff2',
  './assets/fonts/cinzel-decorative-700-latin.woff2',
  './assets/fonts/cinzel-decorative-900-latin.woff2',
  './assets/fonts/crimson-text-400-latin.woff2',
  './assets/fonts/crimson-text-600-latin.woff2',
  './assets/fonts/crimson-text-700-latin.woff2',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Páginas: tenta a rede primeiro (para pegar atualizações), cai para o cache offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true })),
    );
    return;
  }

  // Arquivos estáticos: cache primeiro, rede como reserva.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
