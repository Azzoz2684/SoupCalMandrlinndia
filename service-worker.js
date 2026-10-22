/*
 * Service Worker لحاسبة الصابون.
 *
 * - عند تحديث الملفات: ارفع CACHE_VERSION. عند التثبيت تُحمَّل الملفات الجديدة،
 *   وعند التفعيل تُحذف الكاشات القديمة لهذا التطبيق فقط.
 * - بيانات المستخدم (الوصفات والمكونات اليدوية) محفوظة في localStorage، ولا يلمسها هذا الملف.
 * - الاستراتيجية: stale-while-revalidate للملفات الثابتة، أي تُعرض النسخة المخزنة فورًا
 *   ويُحدَّث التخزين في الخلفية، فتظهر التحديثات في الفتحة التالية.
 */

const CACHE_PREFIX = 'soapcalc-';
const CACHE_VERSION = 'soapcalc-v2.0.0';
const CACHE_NAME = CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./styles.css",
  "./app.js",
  "./src/constants.js",
  "./src/oils.js",
  "./src/engine.js",
  "./src/recipe-model.js",
  "./src/storage.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // إن فشل أي ملف، يفشل التثبيت كله، فلا يُفعَّل إصدار ناقص.
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
        .map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

async function networkWithCacheUpdate(request, cache) {
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return network;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    if (request.mode === 'navigate') {
      const cached = (await cache.match(request)) || (await cache.match('./index.html'));
      if (cached) {
        event.waitUntil(networkWithCacheUpdate(request, cache));
        return cached;
      }
      const fresh = await networkWithCacheUpdate(request, cache);
      if (fresh) return fresh;
      return (await cache.match('./offline.html')) || new Response('غير متصل بالإنترنت', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const cached = await cache.match(request);
    if (cached) {
      event.waitUntil(networkWithCacheUpdate(request, cache));
      return cached;
    }
    const fresh = await networkWithCacheUpdate(request, cache);
    if (fresh) return fresh;
    return new Response('', { status: 504, statusText: 'Offline' });
  })());
});
