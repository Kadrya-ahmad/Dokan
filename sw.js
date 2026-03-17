// service-worker.js - نسخة محسنة مع دعم كامل للعربية
const CACHE_NAME = 'dokan-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('📦 Service Worker: جاري التثبيت...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: فتح الكاش');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('❌ Service Worker: فشل تخزين بعض الملفات:', error);
          // نستمر حتى لو فشل بعض الملفات
        });
      })
      .then(() => {
        console.log('✅ Service Worker: تم التثبيت بنجاح');
        return self.skipWaiting();
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: جاري التفعيل...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // حذف الكاش القديم
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: حذف كاش قديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: تم التفعيل بنجاح');
      return self.clients.claim();
    })
  );
});

// استراتيجية: Cache First ثم Network
self.addEventListener('fetch', event => {
  // تجاهل طلبات chrome-extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // تجاهل طلبات التحميل المختلفة
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجد في الكاش - أعد من الكاش
        if (response) {
          console.log('📦 Service Worker: من الكاش:', event.request.url);
          return response;
        }
        
        // إذا لم يوجد - حاول من الشبكة
        console.log('🌐 Service Worker: من الشبكة:', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // التحقق من صحة الاستجابة
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // تخزين نسخة في الكاش للاستخدام المستقبلي
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('📦 Service Worker: تم تخزين:', event.request.url);
              })
              .catch(err => console.warn('⚠️ Service Worker: فشل تخزين:', event.request.url));
            
            return networkResponse;
          })
          .catch(error => {
            console.warn('⚠️ Service Worker: فشل تحميل:', event.request.url, error);
            
            // صفحة بسيطة للخطأ
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html').then(response => {
                return response || new Response('⚠️ لا يوجد اتصال بالإنترنت', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'text/html; charset=utf-8'
                  })
                });
              });
            }
            
            return new Response('⚠️ لا يوجد اتصال بالإنترنت', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});

// الاستماع لأحداث الدفع (للإشعارات - اختياري)
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'192\' height=\'192\' viewBox=\'0 0 192 192\'%3E%3Crect width=\'192\' height=\'192\' fill=\'%23667eea\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'120\' text-anchor=\'middle\' dy=\'.3em\' fill=\'white\' font-family=\'Arial\'%3E🏪%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'192\' height=\'192\' viewBox=\'0 0 192 192\'%3E%3Crect width=\'192\' height=\'192\' fill=\'%23667eea\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'120\' text-anchor=\'middle\' dy=\'.3em\' fill=\'white\' font-family=\'Arial\'%3E🏪%3C/text%3E%3C/svg%3E',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'close', title: 'إغلاق' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// الاستماع لتفاعل المستخدم مع الإشعارات
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('✅ Service Worker: تم التحميل بنجاح');