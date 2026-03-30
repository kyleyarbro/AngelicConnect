const CACHE_NAME = "angelic-connect-shell-v1";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/login.html",
  "/admin.html",
  "/defendant.html",
  "/manifest.json",
  "/icons/current/favicon-16.png",
  "/icons/current/favicon-32.png",
  "/icons/current/apple-touch-icon.png",
  "/icons/current/icon-192.png",
  "/icons/current/icon-512.png",
  "/icons/current/icon-512-maskable.png",
  "/icons/current/app-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const shouldCache = response.ok && (
          event.request.destination === "script" ||
          event.request.destination === "style" ||
          event.request.destination === "image" ||
          requestUrl.pathname.endsWith(".html") ||
          requestUrl.pathname.endsWith(".json")
        );
        if (shouldCache) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
