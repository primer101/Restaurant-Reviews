const cacheName = 'restaurant_reviews_v1';

const assetsToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/data/restaurants.json',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  '/public/css/styles.min.css',
  '/public/css/responsive.min.css',
  '/public/js/dbhelper.min.js',
  '/public/js/main.min.js',
  '/public/js/restaurant_info.min.js',
];

/**
 * Create cache when SW installs
 */
self.addEventListener('install', event => {
  console.log('ServiceWorker Installed');
  event.waitUntil(
    caches.open(cacheName)
    .then(cache => {
      console.log('Assets in cashe');
      cache.addAll(assetsToCache);
    })
    .then(() => self.skipWaiting())
  );
});
