const cacheName = 'restaurant_reviews_v2';

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

  let cacheRequest = event.request;
  if (cacheRequest.url.indexOf("restaurant.html") > -1) {
    const cacheURL = "restaurant.html";
    cacheRequest = new Request(cacheURL);
  }

  event.respondWith(
    // Check if the request has previously been cached. If so, return the
    // response from the cache. If not, fetch the request, cache it, and then return
    // it.
    caches.match(cacheRequest).then(res => {
      return (res || fetch(cacheRequest).then(fetchResponse => {
          return caches
            // open cache
            .open(cacheName).then(cache => {
              // Filter odd requests
              if (cacheRequest.method === 'GET' &&
                !cacheRequest.url.startsWith('chrome-extension') &&
                !cacheRequest.url.startsWith('browser-sync')) {
                // Put the response in cache
                cache.put(cacheRequest, fetchResponse.clone());
              }
              // Return the cache fetched and just cached
              return fetchResponse;
            });
        })
        // If fetch fail the request is not cached, so it handles the error
        .catch(() => {
          if (cacheRequest.url.indexOf('.jpg') > -1) {
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

// Listen for the "message" event, and call
// skipWaiting if you get the appropriate message
self.addEventListener('message', (event) => {
  console.log('Service Worker: Skip Waiting');
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
