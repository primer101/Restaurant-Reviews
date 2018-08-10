const cacheName = 'restaurant_reviews_v1';

const assetsToCache = [
  '/',
  './index.html',
  './restaurant.html',
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
  '/img/noimage.png',
  '/css/styles.css',
  '/css/responsive.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  // '/css/styles.min.css',
  // '/css/responsive.min.css',
  // '/js/dbhelper.min.js',
  // '/js/main.min.js',
  // '/js/restaurant_info.min.js',
];

/**
 * Create cache when SW installs
 */
self.addEventListener('install', event => {
  console.log('Service Worker: Installed');
  event.waitUntil(
    caches.open(cacheName)
    .then(cache => {
      console.log('Assets in cashe');
      return cache.addAll(assetsToCache);
    })
    // .then(() => self.skipWaiting())
    .catch(error => {
      console.log('Caches failed: ' + error);
    })
  );
});

//remove unwanted old cashes
self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    // Get the Cache storage names
    caches.keys().then(cacheNames =>
      Promise.all(
        // map() the array to delete the old caches,
        // return a array the promises resove to true
        // for each cache deleted
        cacheNames.map(name => {
          if (name.startsWith('restaurant_reviews') && name !== cacheName) {
            return caches.delete(name);
          }
        })
      )
      //TODO: Do it with map() b/s the array is traveled once
      // Promise.resolve(
      //   cacheNames
      //   .filter(name => name !== cacheName)
      //   .forEach(cache => caches.delete(cache))
      // )

    ));
});

self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching');
  event.respondWith(
    // Check if the request has previously been cached. If so, return the
    // response from the cache. If not, fetch the request, cache it, and then return
    // it.
    caches.match(event.request).then(res => {
      return (res || fetch(event.request).then(fetchResponse => {
          return caches
            // open cache
            .open(cacheName).then(cache => {
              // Filter odd requests
              if (event.request.method === 'GET' &&
                !event.request.url.startsWith('chrome-extension') &&
                !event.request.url.startsWith('browser-sync')) {
                // Put the response in cache
                cache.put(event.request, fetchResponse.clone());
              }
              // Return the cache fetched and just cached
              return fetchResponse;
            });
        })
        // If fetch fail the request is not cached, so it handles the error
        .catch(() => {
          if (event.request.url.indexOf('.jpg') > -1) {
            return caches.match('/img/noimage.png');
          }
          return new Response('Sorry the Application cannot connected to the internet', {
            status: 404,
            statusText: 'Sorry the Application cannot connected to the internet'
          });
        }));
    })
  );
});
