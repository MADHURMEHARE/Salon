/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope & typeof globalThis;

precacheAndRoute(self.__WB_MANIFEST);

// Basic offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || new Response('Offline', { status: 503 });
      })
    );
  }
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: data.notification.icon || '/pwa-192x192.png',
      badge: data.notification.badge || '/pwa-192x192.png',
      data: data.notification.data
    };

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
