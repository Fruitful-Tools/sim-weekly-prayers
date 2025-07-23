const CACHE_NAME = 'sim-prayers-v2';
const PRAYER_CACHE_NAME = 'sim-prayers-data-v1';
const IMAGE_CACHE_NAME = 'sim-prayer-images-v1';
const SUPABASE_URL = 'https://qunrljxtjzdrxkzbbkbx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bnJsanh0anpkcnhremJia2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODc3ODUsImV4cCI6MjA2ODY2Mzc4NX0.hb2_zFdhemVFGkj0HerpghcKefMpnK8AU7Q-3bSHkHo';

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/sim_logo.png',
  '/manifest.json'
];

// Fetch prayers for both languages
async function fetchPrayers(language = 'en') {
  const url = `${SUPABASE_URL}/rest/v1/prayers?select=id%2Cweek_date%2Cimage_url%2Cprayer_translations%21inner%28title%2Ccontent%29&prayer_translations.language=eq.${language}&order=week_date.desc&limit=6`;
  
  const response = await fetch(url, {
    headers: {
      'authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'accept-profile': 'public'
    }
  });
  
  return response.json();
}

// Cache prayer images
async function cachePrayerImages(prayers) {
  const imageCache = await caches.open(IMAGE_CACHE_NAME);
  const imagePromises = prayers
    .filter(prayer => prayer.image_url)
    .map(prayer => {
      return imageCache.add(prayer.image_url).catch(err => {
        console.log('Failed to cache image:', prayer.image_url, err);
      });
    });
  
  await Promise.allSettled(imagePromises);
}

// Cache prayer data
async function cachePrayerData() {
  try {
    const prayerCache = await caches.open(PRAYER_CACHE_NAME);
    
    // Fetch both English and Chinese prayers
    const [enPrayers, zhPrayers] = await Promise.all([
      fetchPrayers('en'),
      fetchPrayers('zh-TW')
    ]);
    
    // Cache prayer data
    await Promise.all([
      prayerCache.put('/prayers/en', new Response(JSON.stringify(enPrayers))),
      prayerCache.put('/prayers/zh-TW', new Response(JSON.stringify(zhPrayers)))
    ]);
    
    // Cache images from both language sets
    const allPrayers = [...enPrayers, ...zhPrayers];
    await cachePrayerImages(allPrayers);
    
    console.log('Cached prayers and images successfully');
  } catch (error) {
    console.error('Error caching prayer data:', error);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
      cachePrayerData()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle prayer API requests
  if (url.origin === SUPABASE_URL && url.pathname === '/rest/v1/prayers') {
    event.respondWith(handlePrayerRequest(event.request));
    return;
  }
  
  // Handle prayer images
  if (url.origin === SUPABASE_URL && url.pathname.includes('/storage/v1/object/public/prayer-images/')) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Handle prayer API requests with cache-first strategy
async function handlePrayerRequest(request) {
  const url = new URL(request.url);
  const language = url.searchParams.get('prayer_translations.language') || 'en';
  const langParam = language.replace('eq.', '');
  
  try {
    const prayerCache = await caches.open(PRAYER_CACHE_NAME);
    const cachedResponse = await prayerCache.match(`/prayers/${langParam}`);
    
    if (cachedResponse) {
      // Return cached data immediately
      const cachedData = await cachedResponse.json();
      
      // Update cache in background
      updatePrayerCacheInBackground(langParam);
      
      return new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If no cache, fetch from network
    return fetch(request);
  } catch (error) {
    console.error('Error handling prayer request:', error);
    return fetch(request);
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  try {
    const imageCache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await imageCache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not cached, fetch and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      imageCache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Error handling image request:', error);
    return fetch(request);
  }
}

// Update prayer cache in background
function updatePrayerCacheInBackground(language) {
  // Use setTimeout to make this truly background
  setTimeout(async () => {
    try {
      const prayers = await fetchPrayers(language);
      const prayerCache = await caches.open(PRAYER_CACHE_NAME);
      await prayerCache.put(`/prayers/${language}`, new Response(JSON.stringify(prayers)));
      
      // Update image cache too
      await cachePrayerImages(prayers);
      
      console.log(`Updated ${language} prayers cache in background`);
    } catch (error) {
      console.error('Error updating prayer cache:', error);
    }
  }, 100);
}

// Handle background sync and periodic updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-prayers') {
    event.waitUntil(cachePrayerData());
  }
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== PRAYER_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});