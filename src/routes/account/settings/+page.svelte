<script lang="ts">
  import { page } from "$app/stores";
  import { Toggle } from "$lib/components";
  import type { Settings } from "$lib/types";
  import { getDeviceInfo, requests, toast, type Device } from "$lib/web";
  import _ from "lodash";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { defaultSettings } from "../../api/account/settings/defaults";
  import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";

  let device: Device | null = null;
  onMount(() => {
    (async () => {
      device = await getDeviceInfo();
    })();
  });

  let mounted = false;
  const settings = writable(_.merge(defaultSettings, $page.data.session?.user?.settings));

  onMount(() => {
    mounted = true;
    return () => history.go(0);
  });

  settings.subscribe(async (value) => {
    if (!mounted) return;
    const res = await requests.post<Settings>("/api/account/settings", {
      notifications: value.notifications,
      home: value.home
    });
    if (!res.success) toast.error("An error occurred while saving your settings: " + res.error);
    else toast.success("Updated settings");
  });
  const devices = $page.data.session?.user?.devices || [];
  const matchingDevice = devices.find(
    (d) => device && (device.fingerprint === d.device.fingerprint || device.id === d.device.id)
  );
</script>

<svelte:head>
  <title>Settings | {$page.data.env.name}</title>
</svelte:head>

<main>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    <div class="relative flex w-96 flex-col gap-3 rounded-2xl bg-slate-800 p-10">
      <a class="btn-circle absolute left-5 top-5" href="/account">
        <Fa icon={faArrowLeft} />
      </a>
      <div class="border-b-2 border-slate-600 pb-1 text-center text-4xl">Settings</div>
      <div class="flex flex-1 flex-col gap-1">
        <div class="text-2xl">Notifications</div>
        <div class="flex items-center gap-3">
          <Toggle bind:checked={$settings.notifications.attendance} /> Attendance
        </div>
        <div class="flex items-center gap-3">
          <Toggle bind:checked={$settings.notifications.grades} /> Grades
        </div>
        <div class="text-xl">Registered devices:</div>
        <div class="flex flex-col items-stretch border-2 border-dashed border-slate-600 p-2">
          {#if devices.length === 0}
            <div class="text-center">No devices registered</div>
          {:else}
            {#each devices as subscription}
              <div class="flex items-center">
                <div class="flex-1">{subscription.device}</div>
              </div>
            {/each}
          {/if}
        </div>
        {#if !matchingDevice}
          <button class="btn-full btn-outlined mt-2 text-base">Add this device</button>
        {/if}
      </div>
      <div class="flex flex-1 flex-col gap-1">
        <div class="mt-2 text-2xl">Home page</div>
        <div class="flex items-center gap-3">
          Default tab:
          <select
            bind:value={$settings.home.default}
            class="rounded-md border-2 border-slate-600 bg-transparent outline-none focus-within:outline-none"
          >
            <option value="home" class="bg-slate-800 text-white">Home</option>
            <option value="schedule" class="bg-slate-800 text-white">Schedule</option>
            <option value="grades" class="bg-slate-800 text-white">Grades</option>
            <option value="activity" class="bg-slate-800 text-white">Activity</option>
          </select>
        </div>
        <!-- hideGPA toggle -->
        <div class="flex items-center gap-3">
          <Toggle bind:checked={$settings.home.hideGPA} /> Hide GPA
        </div>
      </div>
    </div>
  </div>
</main>
