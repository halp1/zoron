/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

import { version } from "$service-worker";

sw.addEventListener("install", (event) => {
  console.log(`[SW] Installed (${version})`);
});

const generateRandomID = () => Math.floor(Math.random() * 10 ** 9).toString(16);

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
      notifActions.push({ title: action.title, icon: action.icon, action: id });
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
      clients.openWindow(url).then((windowClient) => (windowClient ? windowClient.focus() : null));
    })
  );
});
