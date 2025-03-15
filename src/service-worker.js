import { version } from "$service-worker";

/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// prettier-ignore
const assets = ["/web-app-manifest-192x192.png","/apple-touch-icon.png","/web-app-manifest-512x512.png","/favicon-48x48.png","/fonts/suse/regular.ttf","/fonts/suse/bold.ttf","/favicon.png","/apple-touch-icon-precomposed.png","/favicon.ico","/site.webmanifest","/icons/icon-152x152.png","/icons/icon-384x384.png","/icons/icon-192x192.png","/icons/icon-96x96.png","/icons/icon-144x144.png","/icons/icon-72x72.png","/icons/icon-512x512.png","/icons/icon-128x128.png"];

const sw = /** @type {ServiceWorkerGlobalScope} */ (
  /** @type {unknown} */ (self)
);

const CACHE_NAME = `app-cache-${version}`;

if (!import.meta.env.DEV) {
  sw.addEventListener("install", (event) => {
    console.log(`[SW] Installed (${version})`);
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.addAll(assets))
        .then(() => sw.skipWaiting())
    );
  });

  sw.addEventListener("fetch", (event) => {
    event.respondWith(
      caches.match(event.request).then(
        (response) =>
          response ||
          fetch(event.request).catch((e) => {
            console.error("[SW]: Failed to fetch", event.request);
            throw e;
          })
      )
    );
  });

  sw.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== CACHE_NAME)
              .map((key) => caches.delete(key))
          )
        )
        .then(() => sw.clients.claim())
    );
  });

  const generateRandomID = () =>
    Math.floor(Math.random() * 10 ** 9).toString(16);

  sw.addEventListener("push", (event) => {
    /** @type {{title: string, options: Parameters<typeof sw.registration.showNotification>[1], url?:string}} */
    const data = event.data ? event.data.json() : {};
    const actions = {};
    const notifActions = [];
    if (data.options.actions) {
      data.options.actions.forEach((action) => {
        let id;
        while (!id || id in actions) id = generateRandomID();
        actions[id] = action.action;
        notifActions.push({
          title: action.title,
          icon: action.icon,
          action: id
        });
      });
    }
    const options = {
      ...data.options,
      actions: notifActions,
      data: { url: data.url, actions }
    };

    console.log(options);

    event.waitUntil(sw.registration.showNotification(data.title, options));
  });

  sw.addEventListener("notificationclick", (e) => {
    // Close the notification popout
    e.notification.close();
    console.log("action", e.action, e.notification.data.actions);
    let url = e.notification?.data?.url;
    if (e.action) url = e.notification.data.actions[e.action];
    if (!url) return false;
    // Get all the Window clients
    e.waitUntil(
      clients.matchAll({ type: "window" }).then(() => {
        clients
          .openWindow(url)
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
      })
    );
  });
}
