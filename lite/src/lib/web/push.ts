export const getSubscription = (vapid: string) =>
  navigator.serviceWorker.ready.then((registration) =>
    registration.pushManager.getSubscription().then(
      (subscription) =>
        subscription ||
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapid
        })
    )
  );
