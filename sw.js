const CACHE_NAME = "qr-generator-cache-v2"; // يجب تغيير الإصدار عند التحديث
const urlsToCache = [
  "/", // الصفحة الرئيسية
  "index.html", // ملف HTML نفسه
  "style.css", // ملف التنسيق
  "script.js", // ملف السكربت
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap", // CSS الخطوط
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css", // CSS الأيقونات
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js", // مكتبة QR
  // يجب إضافة ملفات الخطوط الفعلية (woff2/ttf) من fonts.gstatic.com في بيئة الإنتاج لضمان عمل الخطوط offline
];

self.addEventListener("install", (event) => {
  // تثبيت العامل وتخزين الأصول الأساسية مؤقتاً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching App Shell");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  // حذف الكاش القديم عند التحديث
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName.startsWith("qr-generator-cache-") &&
              cacheName !== CACHE_NAME
            );
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // استراتيجية Cache First: محاولة العثور على الملف في الكاش أولاً
  event.respondWith(
    caches.match(event.request).then((response) => {
      // إذا كان الملف موجوداً في الكاش، قم بإعادته
      if (response) {
        return response;
      }
      // وإلا، قم بطلب الملف من الشبكة
      return fetch(event.request);
    })
  );
});
