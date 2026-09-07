const CACHE_NAME = 'rutinas-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Nunca cachear la API ni el WebSocket — solo el "shell" estático de la app
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Muestra la notificación del sistema cuando llega un push, aunque la app esté cerrada
self.addEventListener('push', (event) => {
  let data = { title: 'Kyntra', body: 'Tienes una notificación nueva.', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* si no viene como JSON, usamos los valores por defecto */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
    })
  );
});

// Al tocar la notificación, abre la app (o enfoca la pestaña si ya está abierta)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
