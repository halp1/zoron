<script lang="ts">
  import { page } from "$app/stores";
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { onMount } from "svelte";
  import { getDeviceInfo, requests, toast, type Device } from "$lib/web";
  import Toggle from "$lib/components/Toggle.svelte";
  import { writable } from "svelte/store";

  let device: Device | null = null;
  onMount(() => {
    (async () => {
      device = await getDeviceInfo();
    })();
  });

  if (!$page.data.session || !$page.data.session.user) {
    signIn();
  }

  let mounted = false;
  const settings = writable({
    notifications: {
      attendance: false
    }
  });

  onMount(async () => {
    mounted = true;
  });

  settings.subscribe(async (value) => {
    if (!mounted) return;
    const res = await requests.post("/api/account/settings", {
      notifications: value.notifications
    });
    if (!res.success) {
      toast.error("An error occurred while saving your settings: " + res.error);
    }
  });
</script>

<main>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    {#if $page.data && $page.data.session && $page.data.session.user}
      <div class="relative flex flex-col gap-5 sm:w-[450px]">
        <div class="mx-auto border-b-2 border-slate-600 pb-1 text-3xl">
          Hello, {$page.data.session.user.name}.
        </div>
        <div class="flex items-center justify-center gap-3 text-xl">
          Your aspen account: <div class="border-2 border-slate-500 px-2 py-1">
            {$page.data.username || "Unset"}
          </div>
        </div>
        <div>
          <div class="text-2xl">Notifications</div>
          <div class="flex items-center gap-3">
            Attendance: <Toggle bind:checked={$settings.notifications.attendance} />
          </div>
        </div>
        <div class="border-b-2 border-dashed border-slate-600"></div>
        <div class="grid grid-cols-2 gap-2">
          <a
            href="/account/update"
            class="btn-full btn-outlined col-span-2 flex flex-1 items-center justify-center border-orange-400 text-base"
          >
            Update credentials
          </a>
          <button
            on:click={async (e) => {
              e.preventDefault();
              await signOut({ redirect: true, callbackUrl: "/" });
              toast.success("You have been signed out.");
            }}
            class="btn-full btn-outlined col-span-1 flex flex-1 items-center justify-center border-red-500 text-base"
          >
            Sign out
          </button>
          <button
            class="btn-full btn-outlined col-span-1 flex flex-1 items-center justify-center border-red-500 text-base"
          >
            Delete account
          </button>
        </div>
      </div>
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
  </div>
</main>
