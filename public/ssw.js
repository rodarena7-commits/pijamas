const CACHE_NAME = 'roma-showroom-v2';
const API_CACHE_NAME = 'roma-api-v1';
const STATIC_CACHE_NAME = 'roma-static-v1';

// Archivos que se cachean al instalar
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.png',
  '/manifest.json',
  '/outlet.png',
  '/showroom.png',
  '/hoja.png',
  '/corpino.png',
  '/masroma.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  
  // Forzar la activación inmediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos cacheados');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Error cacheando archivos:', error);
      })
  );
});

// Activación - limpiar caches antiguos
self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  
  // Tomar control de todas las páginas abiertas
  event.waitUntil(clients.claim());
  
  // Eliminar caches antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de fetch CORREGIDA
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // 🚫 IGNORAR TODAS las peticiones POST (Firebase, etc.)
  if (event.request.method !== 'GET') {
    return; // No interceptar peticiones POST
  }
  
  // 🚫 Ignorar peticiones a Firebase y Google APIs
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('identitytoolkit.googleapis.com') ||
      event.request.url.includes('securetoken.googleapis.com')) {
    return; // Dejar que el navegador maneje estas peticiones
  }
  
  // Ignorar peticiones a dominios externos (excepto Unsplash para imágenes)
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('unsplash.com')) {
    return;
  }
  
  // Estrategia para imágenes de Unsplash (cache first)
  if (event.request.url.includes('unsplash.com')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // Estrategia para archivos estáticos (HTML, CSS, JS) - Cache First
  if (event.request.url.includes('/assets/') || 
      event.request.url.endsWith('.js') || 
      event.request.url.endsWith('.css') ||
      event.request.url.includes('/static/')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // Para navegación (HTML) - Network First con fallback a cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }
  
  // Para imágenes locales - Cache First
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
});

// Sincronización en segundo plano (para cuando vuelva la conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-questions') {
    event.waitUntil(syncQuestions());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'Nueva notificación de +Roma',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('+Roma', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Función para sincronizar preguntas pendientes
async function syncQuestions() {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const pendingQuestions = await cache.match('/pending-questions');
    
    if (pendingQuestions) {
      const questions = await pendingQuestions.json();
      console.log('Sincronizando preguntas:', questions);
      await cache.delete('/pending-questions');
    }
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
}

// Actualización automática
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
