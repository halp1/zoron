/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
/// <reference types="../.svelte-kit/ambient.d.ts" />
import { version } from "$service-worker";

import type { PushEvent } from "../../common/lib/types";

import { assets } from "../../common/lib/sw";

const CACHE_NAME = `app-cache-${version}`;
declare var self: ServiceWorkerGlobalScope;
declare var clients: Clients;

if (!import.meta.env.DEV) {
  self.addEventListener("install", (event: ExtendableEvent) => {
    console.log(`[SW] Installed (${version})`);
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache: Cache) => cache.addAll(assets))
        .then(() => self.skipWaiting())
    );
  });

  self.addEventListener("fetch", (event) => {
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

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
          )
        )
        .then(() => self.clients.claim())
    );
  });

  self.addEventListener("push", (event) => {
    event.waitUntil(
      new Promise<void>(async (resolve, reject) => {
        try {
          const data: PushEvent = event.data ? event.data.json() : {};

          if (data.type === "auth-request") {
            await Promise.all(
              data.data.map(async (item) => {
                let title = "";
                let body = "";

                switch (item.type) {
                  case "grade":
                    title = `Grade posted: ${item.class}`;
                    body = `Assignment: ${item.assignment}\nGrade: ${
                      typeof item.scoring === "object" && item.scoring
                        ? item.grade === item.scoring.scored.toString()
                          ? `${item.scoring.scored} / ${item.scoring.total}`
                          : `${item.grade} (${item.scoring.scored} / ${item.scoring.total})`
                        : `${item.grade}`
                    }`;
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

                await self.registration.showNotification(title, {
                  body,
                  icon: "/favicon.png",
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

  self.addEventListener("notificationclick", (e) => {
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
