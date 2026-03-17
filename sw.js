// اسم الكاش
const CACHE_NAME = 'dokan-cache-v2';
const APP_URL = '/Dokan/';

// الملفات المهمة للتخزين
const urlsToCache = [
  APP_URL,
  APP_URL + 'index.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// التثبيت
self.addEventListener('install', event => {
  console.log('✅ Service Worker: تثبيت');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Service Worker: تخزين الملفات');
      return cache.addAll(urlsToCache).catch(error => {
        console.warn('⚠️ بعض الملفات ما تخزنتش:', error);
      });
    })
  );
  self.skipWaiting();
});

// التفعيل ومسح الكاش القديم
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: تفعيل');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('🗑️ مسح كاش قديم:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// الرد على الطلبات
self.addEventListener('fetch', event => {
  // تجاهل طلبات extension
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  // للصفحات (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('📦 Service Worker: جلب الصفحة من الكاش');
        return caches.match(APP_URL + 'index.html');
      })
    );
    return;
  }
  
  // للملفات الثابتة
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
