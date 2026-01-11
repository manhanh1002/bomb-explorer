const CACHE_NAME = 'bomb-explorer-v1';
const ASSETS = [
  'index.html',
  // Thêm các file CSS, JS hoặc hình ảnh khác của bạn vào đây nếu có file riêng
];

// Cài đặt Service Worker và lưu trữ tài nguyên vào cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Kích hoạt và xóa cache cũ
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Chiến lược: Ưu tiên mạng, nếu không có mạng thì lấy từ cache
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});