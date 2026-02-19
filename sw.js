// Service Worker for PWA offline support
const CACHE_NAME = 'financas-v2';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/firebase-config.js',
    './js/db.js',
    './js/data.js',
    './js/app.js',
    './manifest.json'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate - limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch - Network first para Firebase, cache first para assets locais
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Sempre buscar da rede: Firebase SDK, Firebase Realtime Database, e APIs externas
    if (url.hostname.includes('gstatic.com') ||
        url.hostname.includes('firebaseio.com') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('firebase')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Para assets locais: network first, fallback to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
