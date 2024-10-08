<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { getDeviceInfo, requests } from "$lib/web";
  import { signIn } from "@auth/sveltekit/client";
  import { error } from "@sveltejs/kit";
  import toast from "svelte-french-toast";

  const vapidKey = $page.data.env.vapid;

  const askPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return true;
    } else {
      return false;
    }
  };

  const subscribeToPush = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required for Chrome
      applicationServerKey: vapidKey
    });

    const res = await requests.post("/api/subscribe/" + $page.params.id, {
      device: await getDeviceInfo(),
      subscription: subscription.toJSON()
    });

    if ("success" in res) return true;
    throw new Error(res.message || "Network Error");
  };
</script>

<main class="flex h-screen w-screen items-center justify-center">
  {#if $page.data.session && $page.data.session.user}
    <button
      class="btn-full"
      on:click={async () => {
        const res = await askPermission();
        if (!res)
          return toast.error("Please accept notifications to subscribe.", {
            position: "bottom-right"
          });
        try {
          await subscribeToPush();
          toast.success("Subscribed!", { position: "bottom-right" });
					// requires hard reload to get subscription
          location.href = "/account";
        } catch (e) {
          // @ts-expect-error e is unknown, can't put types in event listeners
          toast.error("Failed to subscribe to push notifications:\n" + (e.message || e), {
            position: "bottom-right"
          });
        }
      }}
    >
      Subscribe to {$page.data.name}
    </button>
  {:else}
    <button
      class="btn-full"
      on:click={async () => {
        signIn();
      }}
    >
      Log in
    </button>
  {/if}
</main>
