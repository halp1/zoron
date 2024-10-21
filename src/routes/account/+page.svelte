<script lang="ts">
  import { page } from "$app/stores";
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { onMount } from "svelte";
  import { getDeviceInfo, requests, toast, type Device } from "$lib/web";
  import Toggle from "$lib/components/Toggle.svelte";
  import { writable } from "svelte/store";
  import type { Settings } from "$lib/types";
  import _ from "lodash";
  import { defaultSettings } from "../api/account/settings/defaults";
  import { faHome, faClose } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";

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
  const settings = writable(_.merge(defaultSettings, $page.data.session?.user?.settings));

  onMount(async () => {
    mounted = true;
  });

  settings.subscribe(async (value) => {
    if (!mounted) return;
    const res = await requests.post<Settings>("/api/account/settings", {
      notifications: value.notifications
    });
    if (!res.success) toast.error("An error occurred while saving your settings: " + res.error);
    else toast.success("Updated settings");
  });

  let deleting: number = -1;
  let deleteInterval: NodeJS.Timeout | null = null;
  const unclickDeleteAccountButton = () => {
    if (deleteInterval) clearInterval(deleteInterval);
    deleting = 0;
  };
</script>

<svelte:head>
  <title>Account | A+spen</title>
</svelte:head>

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
        <a
          href="/home"
          class="btn-full btn-outlined mx-auto flex items-center justify-center gap-3 text-base"
        >
          My A+spen <Fa icon={faHome} />
        </a>
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
            on:click={() => {
              deleting = 0;
            }}
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
  <!-- delete modal thingy -->
  {#if deleting !== -1}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="fixed bottom-0 left-0 right-0 top-0 grid place-items-center backdrop-blur-md"
      on:click={({ currentTarget, target }) => {
        if (currentTarget === target) deleting = -1;
      }}
    >
      <div class="relative flex flex-col items-center rounded-lg bg-slate-800 p-5">
        <button
          class="btn-circle absolute right-2 top-2"
          on:click={() => {
            deleting = -1;
          }}><Fa icon={faClose} /></button
        >
        <div class="text-2xl">Delete your account?</div>
        <div class="text-sm text-slate-400">This action is irreversible.</div>
        <button
          class="btn-full btn-outlined relative mt-5 flex w-72 items-center justify-center overflow-hidden border-red-500 text-base text-transparent"
        >
          Delete account
          <div
            class="pointer-events-none absolute left-0 h-full bg-red-500 bg-opacity-40 transition-all {deleting ===
            0
              ? 'duration-200'
              : 'duration-0'}"
            style="width: {deleting}%;"
          ></div>
          <button
            on:mousedown={async () => {
              deleteInterval = setInterval(async () => {
                deleting += 0.5;
                if (deleting >= 100) {
                  deleting = -1;
                  // @ts-expect-error
                  clearInterval(deleteInterval);
                  toast.loading("Deleting account...");
                  const res = await requests.del("/api/account/delete");
                  if (res.success) {
                    toast.success("Account deleted.");
                    await signOut({ redirect: true, callbackUrl: "/" });
                  } else {
                    toast.error("An error occurred while deleting your account: " + res.error);
                  }
                }
              }, 1000 / 120);
            }}
            on:mouseup={unclickDeleteAccountButton}
            on:mouseleave={unclickDeleteAccountButton}
            class="absolute bottom-0 left-0 right-0 top-0 z-10 flex items-center justify-center text-white"
          >
            Delete account
          </button>
        </button>
      </div>
    </div>
  {/if}
</main>
