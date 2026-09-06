// Service Worker untuk Web Push Notification Rajawali ERP
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload = {};
    try {
        payload = event.data.json();
    } catch (e) {
        payload = {
            title: 'Notifikasi Rajawali',
            body: event.data.text(),
            url: '/logistik/approval'
        };
    }

    const title = payload.title || 'Notifikasi Baru - Rajawali ERP';
    const options = {
        body: payload.body || 'Ada pembaruan status sistem.',
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag || ('rajawali-notification-' + Date.now()),
        renotify: true,
        data: {
            url: payload.url || '/logistik/approval',
            timestamp: Date.now()
        },
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/logistik/approval';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
