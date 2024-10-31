<script lang="ts">
  import { page } from "$app/stores";
  import { getDeviceInfo, requests, toast, type Device } from "$lib/web";
  import Toggle from "$lib/components";
  import { writable } from "svelte/store";
  import type { Settings } from "$lib/types";
  import _ from "lodash";
  import { defaultSettings } from "../../api/account/settings/defaults";
  import { onMount } from "svelte";

  let device: Device | null = null;
  onMount(() => {
    (async () => {
      device = await getDeviceInfo();
    })();
  });

  let mounted = false;
  const settings = writable(_.merge(defaultSettings, $page.data.session?.user?.settings));

  onMount(async () => {
    mounted = true;
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
</script>

<svelte:head>
  <title>Settings | A+spen</title>
</svelte:head>

<main>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    <div class="flex">
      <div class="flex flex-1 flex-col items-center">
        <div class="text-2xl">Notifications</div>
        <div class="flex items-center gap-3">
          Attendance: <Toggle bind:checked={$settings.notifications.attendance} />
        </div>
        <div class="flex items-center gap-3">
          Grades: <Toggle bind:checked={$settings.notifications.grades} />
        </div>
      </div>
      <div class="flex flex-1 flex-col items-center">
        <div class="mt-2 text-2xl">Home page</div>
        Default tab:
        <select bind:value={$settings.home.default} class="bg-transparent">
          <option value="home" class="text-black">Home</option>
          <option value="assignments" class="text-black">Assignments</option>
          <option value="grades" class="text-black">Grades</option>
          <option value="activity" class="text-black">Activity</option>
        </select>
      </div>
    </div>
  </div>
</main>
