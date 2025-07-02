// Service Worker v11
const CACHE_NAME = 'hub-deputado-jadyel-v11';
const OFFLINE_URL = '/offline.html';

// Função para verificar se a requisição é para um arquivo estático
const isStaticAsset = (url) => {
  const staticExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
  return staticExtensions.some(ext => url.endsWith(ext));
};

const STATIC_ASSETS = [
  '/',
  '/?pwa=true',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/logo.png',
  '/avatar-banner.png',
  OFFLINE_URL
];

// Instalação: cache dos recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache todos os recursos estáticos
      await cache.addAll(STATIC_ASSETS);
      // Força o SW a se tornar ativo
      await self.skipWaiting();
    })()
  );
});

// Ativação: limpeza de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    (async () => {
      // Limpa caches antigos
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
      // Toma controle de todas as abas abertas
      await self.clients.claim();
    })()
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  // Ignora requisições não GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições de API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Tenta buscar da rede primeiro
        const networkResponse = await fetch(event.request);
        
        // Se for uma requisição de navegação, cache o resultado
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Se falhar, tenta buscar do cache
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }

        // Se não houver cache e for uma navegação, retorna página offline
        if (event.request.mode === 'navigate') {
          return cache.match(OFFLINE_URL);
        }

        // Se tudo falhar, propaga o erro
        throw error;
      }
    })()
  );
}); 