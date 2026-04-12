var CACHE = "limebay-v1";
var PRECACHE = ["/", "/index.html", "/leaflet.css", "/leaflet.js", "/manifest.json"];
self.addEventListener("install", function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(PRECACHE); }));
});
self.addEventListener("fetch", function(e) {
  if (e.request.url.includes("/api/")) return;
  e.respondWith(caches.match(e.request).then(function(r) { return r || fetch(e.request); }));
});
