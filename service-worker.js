const CACHE_NAME = "fitness-rpg-v2";

const APP_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.webmanifest",
  "/assets/icons/favicon-32.png",
  "/assets/icons/app-icon-192.png",
  "/assets/icons/app-icon-512.png",
  "/js/config.js",
  "/js/date-utils.js",
  "/js/storage.js",
  "/js/stats.js",
  "/js/recommendation-plans.js",
  "/js/recommendation-engine.js",
  "/js/rpg.js",
  "/js/ai-client.js",
  "/js/pwa.js",
  "/js/ui.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
