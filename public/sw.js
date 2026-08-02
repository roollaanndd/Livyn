// Livyn service worker — push notifications + offline support.
//
// Caching rules of thumb used here:
//
//  - HTML navigations are NEVER written to the cache. They are personalised
//    (the signed-in user's name, streaks, circles) and they embed hashed asset
//    URLs, so caching them served a stale app after every deploy and could
//    surface one account's pages to the next person on a shared device. The
//    network answers navigations; the precached /offline page is the fallback.
//  - Only genuinely immutable, non-personalised things get cached: the
//    content-hashed /_next/static/ bundles, images, fonts, and the /bible/
//    JSON that powers offline reading.
//  - The landing page's scene art is the exception that proves the rule. It
//    lives at fixed URLs that get rewritten in place whenever the art is
//    regenerated, so cache-first pinned the old pictures on every device that
//    had ever loaded the page — a redesign that shipped and nobody could see.
//    Those get stale-while-revalidate instead: paint from cache, refresh in
//    the background, so new art lands on the next load by itself.
//
// Bumping CACHE_NAME purges every older cache in `activate`, which is how
// existing installs shed the stale entries written by earlier versions.

const CACHE_NAME = "livyn-v3";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Individual puts: one bad URL must not fail the whole installation,
      // which would leave the old service worker in control indefinitely.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          } catch {
            /* offline at install time — fetched again on demand */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// A React Server Component payload is versioned against the running build and
// is often personalised — caching it causes hydration mismatches after deploy.
function isRscRequest(request, url) {
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    url.searchParams.has("_rsc")
  );
}

function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/bible/") ||
    /\.(png|jpg|jpeg|webp|avif|gif|svg|ico|woff2?)$/.test(url.pathname)
  );
}

/** Assets that keep their URL but change their content. */
function isRevalidatingAsset(url) {
  return url.pathname.startsWith("/scroll-world/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept other origins or the API — auth cookies, streaming AI
  // responses and push endpoints must always hit the network untouched.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (isRscRequest(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(navigateOrOffline(request));
    return;
  }

  // Order matters: the scene art is also an .svg, so this has to win over
  // the immutable rule below.
  if (isRevalidatingAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, event));
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Anything else (RSC-adjacent JSON, unknown routes) goes straight to the
  // network rather than risking a stale or personalised cache entry.
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.type !== "opaque") {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

/** Answer from cache if we have it, and refresh the entry either way. The
 *  first load after new art ships still shows the old frame; the one after it
 *  is current, and no CACHE_NAME bump is needed to get there. */
async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetching = fetch(request)
    .then(async (response) => {
      if (response.ok && response.type !== "opaque") await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Keep the worker alive until the refresh finishes, or it can be killed
    // mid-flight and the cache never updates.
    event.waitUntil(fetching);
    return cached;
  }

  return (await fetching) || Response.error();
}

async function navigateOrOffline(request) {
  try {
    return await fetch(request);
  } catch {
    // Genuinely offline — show the shell instead of the browser error page.
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response(
      "<!doctype html><meta charset=utf-8><title>Offline</title><p>Kamu sedang offline.",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

// --- Push notifications ---

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Livyn", body: event.data.text() };
  }

  const title = payload.title || "Livyn";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "livyn-notification",
    data: { url: payload.url || "/app" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/app";
  const targetUrl = new URL(target, self.location.origin);

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (new URL(client.url).pathname === targetUrl.pathname && "focus" in client) {
          return client.focus();
        }
      }

      // Nothing already on that page — focus an existing window and navigate
      // it, falling back to opening a new one.
      const existing = clientList[0];
      if (existing && "navigate" in existing) {
        const focused = await existing.focus();
        return focused.navigate(targetUrl.href).catch(() => focused);
      }

      if (self.clients.openWindow) return self.clients.openWindow(targetUrl.href);
    })()
  );
});
