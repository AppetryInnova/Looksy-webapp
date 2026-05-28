// Looksy Service Worker — Push Notifications
const CACHE_VERSION = 'looksy-v2';

// ── Push event: show native notification ──
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload = { title: 'Looksy', body: 'Tienes una nueva notificación', icon: '/icon-192x192.png', url: '/' };
    try {
        payload = { ...payload, ...event.data.json() };
    } catch {
        payload.body = event.data.text();
    }

    const options = {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: { url: payload.url || '/' },
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'close', title: 'Cerrar' }
        ],
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
});

// ── Notification click: navigate to URL ──
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if a window is already open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Open new window if none exists
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});

// ── Fetch event: serve from cache when offline ──
self.addEventListener('fetch', (event) => {
    // Only cache GET requests to same origin
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Skip API routes for cache (always fresh)
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        caches.open(CACHE_VERSION).then(async (cache) => {
            const cached = await cache.match(event.request);
            const fetchPromise = fetch(event.request).then((response) => {
                if (response.ok) cache.put(event.request, response.clone());
                return response;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});

// ── Activate: clean old caches ──
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
        )
    );
});
