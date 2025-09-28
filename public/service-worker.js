/**
 * Service Worker for Smart CRM
 * 提供离线缓存和资源管理
 */

const CACHE_NAME = 'smart-crm-v2.1.0';
const STATIC_CACHE = 'static-v2.1.0';
const DYNAMIC_CACHE = 'dynamic-v2.1.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 需要网络优先的 API 路由
const API_ROUTES = [
  '/api/',
  'supabase.co',
  '/auth/'
];

// 缓存策略
const CACHE_STRATEGIES = {
  // 缓存优先策略 - 用于静态资源
  cacheFirst: async (request) => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.error('Cache first strategy failed:', error);
      throw error;
    }
  },

  // 网络优先策略 - 用于 API 请求
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
      throw error;
    }
  },

  // 仅缓存策略 - 用于离线页面
  cacheOnly: async (request) => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline content not available', { status: 404 });
  },

  // 仅网络策略 - 用于实时数据
  networkOnly: async (request) => {
    return fetch(request);
  }
};

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      // 尝试缓存每个静态资源
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
          console.log(`Cached: ${asset}`);
        } catch (error) {
          console.error(`Failed to cache ${asset}:`, error);
        }
      }

      // 立即激活新的 Service Worker
      await self.skipWaiting();
    })()
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    (async () => {
      // 清理旧版本缓存
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name =>
        name !== CACHE_NAME &&
        name !== STATIC_CACHE &&
        name !== DYNAMIC_CACHE
      );

      await Promise.all(
        oldCaches.map(cache => {
          console.log(`Deleting old cache: ${cache}`);
          return caches.delete(cache);
        })
      );

      // 立即接管所有客户端
      await self.clients.claim();
    })()
  );
});

// 获取事件 - 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 忽略 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 忽略非 GET 请求
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // 判断是否为 API 请求
  const isAPI = API_ROUTES.some(route => request.url.includes(route));

  if (isAPI) {
    // API 请求使用网络优先策略
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
  } else if (request.destination === 'image') {
    // 图片使用缓存优先策略
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
  } else if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    // 静态资源使用缓存优先策略
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
  } else {
    // 其他请求使用网络优先策略
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
  }
});

// 消息事件 - 处理客户端消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cache => caches.delete(cache))
        );
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      })()
    );
  }
});

// 后台同步事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      (async () => {
        console.log('Background sync: Syncing data...');
        // 这里可以添加数据同步逻辑
      })()
    );
  }
});

// 推送通知事件
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

console.log('Service Worker loaded successfully');