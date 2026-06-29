// ════════════════════════════════════════════
// MOOZIK — Service Worker
// Gère : cache offline, push notifications, bg sync
// ════════════════════════════════════════════

const CACHE_NAME       = 'moozik-audio-offline';
const STATIC_CACHE     = 'moozik-static-v3';
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Installation ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activation ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ════════════════════════════════════════════
// FETCH INTERCEPT
// Stratégie :
//   - Fichiers audio Cloudinary (.mp3) → Cache first (offline audio)
//   - Assets statiques → Cache first, Network fallback
//   - API calls → Network only (pas de cache)
// ════════════════════════════════════════════
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // ── 1. Ignorer les requêtes non-GET ──────────
  if (request.method !== 'GET') return;

  // ── 2. Ignorer les requêtes API backend ──────
  if (
    url.hostname.includes('onrender.com') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/songs/') ||
    url.pathname.startsWith('/admin/') ||
    url.pathname.startsWith('/users/')
  ) return;

  // ── 3. Fichiers audio Cloudinary → Cache first ──
  // FIX: Quand offline, servir depuis le cache audio
  const isAudio = (
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('res.cloudinary.com') ||
    request.url.match(/\.(mp3|ogg|wav|aac|m4a|flac)(\?.*)?$/)
  );

  if (isAudio) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request.url) || await cache.match(url.pathname);
        if (cached) {
          // Servir depuis le cache
          return cached;
        }
        // En ligne → fetch normal (ne pas mettre en cache automatiquement,
        // cacheAudio() le fait explicitement à la demande de l'utilisateur)
        try {
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch {
          return new Response('Audio not available offline', { status: 503 });
        }
      })
    );
    return;
  }

  // ── 4. Images Cloudinary → Cache with network fallback ──
  const isImage = (
    url.hostname.includes('cloudinary.com') ||
    request.destination === 'image'
  );

  if (isImage) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            // Cache les images pour usage offline
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch {
          return cached || new Response('Image not available offline', { status: 503 });
        }
      })
    );
    return;
  }

  // ── 5. App shell (HTML, JS, CSS) ───────────────────────────────
  if (url.hostname === self.location.hostname) {
    const isHTML = request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('.html');
    const isAsset = request.destination === 'script' || request.destination === 'style' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

    if (isHTML) {
      // HTML → Network first, fallback cache (toujours la version fraîche)
      event.respondWith(
        fetch(request)
          .then(res => {
            if (res.ok) caches.open(STATIC_CACHE).then(c => c.put(request, res.clone())).catch(() => {});
            return res;
          })
          .catch(() => caches.match(request).then(c => c || caches.match('/index.html')))
      );
      return;
    }

    if (isAsset) {
      // JS/CSS avec hash → Cache first (immutables), puis mise à jour silencieuse en fond
      event.respondWith(
        caches.open(STATIC_CACHE).then(async cache => {
          const cached = await cache.match(request);
          // Fetch en arrière-plan pour mettre à jour le cache
          const fetchPromise = fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone()).catch(() => {});
            return res;
          }).catch(() => null);
          // Servir immédiatement depuis le cache si dispo (stale-while-revalidate)
          return cached || fetchPromise || caches.match('/index.html');
        })
      );
      return;
    }
  }
});

// ════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ════════════════════════════════════════════
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}

  const title   = data.title  || 'MOOZIK';
  const body    = data.body   || '';
  const icon    = data.icon   || '/icon-192.png';
  const badge   = '/icon-192.png';
  const url     = data.url    || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [200, 100, 200],
      tag: 'moozik-notification',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Chercher un onglet déjà ouvert
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'navigate', url: targetUrl });
          return;
        }
      }
      // Sinon ouvrir un nouvel onglet
      if (clients.openWindow) clients.openWindow(targetUrl);
    })
  );
});

// ════════════════════════════════════════════
// BACKGROUND SYNC (optionnel)
// Pour envoyer les écoutes en attente quand la connexion revient
// ════════════════════════════════════════════
self.addEventListener('sync', event => {
  if (event.tag === 'sync-plays') {
    event.waitUntil(syncPendingPlays());
  }
});

async function syncPendingPlays() {
  try {
    // Récupérer les plays en attente depuis IndexedDB ou localStorage
    // (implémentation simple via messages au client)
    const allClients = await clients.matchAll();
    allClients.forEach(client => {
      client.postMessage({ type: 'sync-plays' });
    });
  } catch {}
}

// ── Message handler (communication avec l'app) ──
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});