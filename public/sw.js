// Nombre de la caché (actualiza la versión al hacer cambios)
const CACHE_NAME = 'pijamas-v1';
const STATIC_CACHE_NAME = 'pijamas-static-v1';

// Archivos que se cachean al instalar (solo recursos locales estáticos)
const urlsToCache = [
  '/',
  '/index.html',
  '/pijamas.png',
  '/logoih.png',
  '/hoja.png',
  '/pijama.jpg',
  '/pantuflas.jpeg',
  '/accesorios.png',
  '/manifest.json'
];

// Instalación: cachear recursos estáticos
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  self.skipWaiting(); // Activar inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando recursos iniciales');
      return cache.addAll(urlsToCache).catch(err => {
        console.error('[SW] Error cacheando:', err);
      });
    })
  );
});

// Activación: limpiar cachés antiguos y tomar control
self.addEventListener('activate', event => {
  console.log('[SW] Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== STATIC_CACHE_NAME) {
            console.log('[SW] Eliminando caché antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim()); // Tomar control de todas las páginas
});

// Fetch: estrategias por tipo de recurso
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // **IMPORTANTE: NO interceptar peticiones a Firebase ni Google APIs**
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('firestore') ||
      url.hostname === 'securetoken.googleapis.com' ||
      url.hostname === 'identitytoolkit.googleapis.com') {
    return; // Dejar que el navegador maneje directamente
  }

  // NO interceptar peticiones POST (solo GET)
  if (request.method !== 'GET') {
    return;
  }

  // Para navegación (HTML) -> Network First (carga la última versión)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cachear la respuesta para offline
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          // Fallback a caché o página de inicio
          return caches.match(request).then(res => res || caches.match('/'));
        })
    );
    return;
  }

  // Para archivos estáticos (JS, CSS, imágenes locales) -> Cache First
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image' ||
      url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const copy = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  // Para el resto (API propias, etc.) -> Network Only (no cachear)
  // (pero como ya filtramos Firebase, aquí no afecta)
  return;
});

// Mensaje para saltar waiting y actualizar
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
