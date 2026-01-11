// Tên của kho lưu trữ cache (Thay đổi version mỗi khi bạn cập nhật code game)
const CACHE_NAME = 'bomb-explorer-v2';

// Danh sách các tài nguyên cần cache để chạy Offline
// Lưu ý: Sử dụng đường dẫn tương đối './' để chạy được trên GitHub Pages
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Nếu bạn có file CSS/JS riêng thì liệt kê ở đây, ví dụ:
  // './style.css',
  // './script.js',
  // Icon để hiển thị khi cài đặt PWA
  './Assets/tiles/logo.png'
];

// 1. Sự kiện INSTALL: Lưu các file vào bộ nhớ cache
self.addEventListener('install', (event) => {
  // Buộc Service Worker mới thay thế bản cũ ngay lập tức
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Đang lưu tài nguyên vào Cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Sự kiện ACTIVATE: Dọn dẹp cache cũ khi có version mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Đang xóa Cache cũ:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Giúp SW chiếm quyền điều khiển trang ngay lập tức mà không cần load lại
  return self.clients.claim();
});

// 3. Sự kiện FETCH: Xử lý yêu cầu mạng
// Chiến lược: Network First (Thử lấy từ mạng trước, nếu không có mạng thì lấy từ Cache)
// Điều này giúp người chơi luôn nhận được bản cập nhật mới nhất nếu có Wi-Fi
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các yêu cầu GET (không cache các yêu cầu POST hoặc từ extension)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Nếu lấy được từ mạng, lưu bản mới vào cache và trả về kết quả
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Nếu mất mạng (Network fail), tìm trong kho lưu trữ Cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Nếu trang chủ không có mạng và không có cache (vừa cài xong đã tắt mạng)
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
