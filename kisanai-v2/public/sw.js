// Keeps the app shell available offline. API calls always go to the network;
// the page itself remembers the last result.
const CACHE = 'kisanai-v2-1';
const SHELL = ['./', 'index.html', 'style.css', 'i18n.js', 'app.js', 'manifest.json', 'icon.svg'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
    // Network first so updates show up; cache when offline.
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const copy = response.clone();
                caches.open(CACHE).then(cache => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
