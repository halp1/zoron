import { version } from "$service-worker";

/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference path="../node_modules/typescript/lib/lib.webworker.d.ts" />

// prettier-ignore
const assets = ["/web-app-manifest-192x192.png","/screenshots/desktop.png","/screenshots/mobile.png","/apple-touch-icon.png","/web-app-manifest-512x512.png","/favicon-48x48.png","/fonts/suse/regular.ttf","/fonts/suse/bold.ttf","/favicon.png","/apple-touch-icon-precomposed.png","/robots.txt","/favicon.ico","/site.webmanifest","/icons/icon-152x152.png","/icons/icon-384x384.png","/icons/icon-192x192.png","/icons/icon-96x96.png","/icons/icon-144x144.png","/icons/icon-72x72.png","/icons/icon-512x512.png","/icons/icon-128x128.png"];

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

  sw.addEventListener("push", (event) => {
    event.waitUntil(
      new Promise(async (resolve, reject) => {
        try {
          /** @type {import('./lib/types/sw').PushEvent} */
          const data = event.data ? event.data.json() : {};

          if (data.type === "auth-request") {
            await Promise.all(
              data.data.map(async (item) => {
                let title = "";
                let body = "";

                switch (item.type) {
                  case "grade":
                    title = `Grade posted: ${item.class}`;
                    body = `Assignment: ${item.assignment}\nGrade: ${item.scoring ? (item.grade === item.scoring.scored.toString() ? `${item.scoring.scored} / ${item.scoring.total}` : `${item.grade} (${item.scoring.scored} / ${item.scoring.total})`) : `${item.grade}`}`;
                    break;
                  case "posted-grade":
                    title = `Term grade posted for ${item.classname}`;
                    break;
                  case "period-attendance":
                    title = `Attendance for ${item.class} period ${item.period}`;
                    body = `Code: ${item.code}\nDate: ${item.date}`;
                    break;
                  case "attendance":
                    title = `Attendance for ${item.date}`;
                    body = `Code: ${item.code}`;
                    break;
                }

                await sw.registration.showNotification(title, {
                  body,
                  icon: "/favicon.png"
                });
              })
            );
          }
          resolve();
        } catch (e) {
          console.error("[SW] Error handling push event", e);
          reject(e);
        }
      })
    );
  });

  sw.addEventListener("notificationclick", (e) => {
    // Close the notification popout
    e.notification.close();
    e.waitUntil(
      clients.matchAll({ type: "window" }).then(() => {
        clients
          .openWindow("/home/activity")
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
      })
    );
  });
}
