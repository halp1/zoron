<script lang="ts">
  import { page } from "$app/stores";
  import { Toggle } from "$lib/components";
  import { supabase, supabaseConnect } from "$lib/supabase";
  import type { Settings } from "$lib/types";
  import { getDeviceInfo, requests, toast, type Device } from "$lib/web";
  import _ from "lodash";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { defaultSettings } from "../../api/account/settings/defaults";
  import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
  import { faCamera } from "@fortawesome/free-solid-svg-icons/faCamera";
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
    const client = supabaseConnect($page.data.env.supabase.uri, $page.data.env.supabase.key);
    client.auth.setSession($page.data.supabase.session);
    mounted = true;
    return () => {
      client.removeAllChannels();
      client.realtime.disconnect();
      history.go(0);
    };
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

  let uploading = false;
  let fileInput: HTMLInputElement;

  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const supabaseClient = $supabase;
    if (!supabaseClient) {
      toast.error('Supabase client not initialized');
      return;
    }

    uploading = true;
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const userId = $page.data.session?.user?.id;
      const filePath = `${userId}/profile-picture.${fileExt}`;

      const { error: uploadError, data } = await supabaseClient.storage
        .from('pfps')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('pfps')
        .getPublicUrl(filePath);

      // Update user's profile picture URL
      const response = await fetch('/api/account/settings/profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile picture');
      }

      toast.success('Profile picture updated successfully');
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update profile picture');
    } finally {
      uploading = false;
      if (fileInput) fileInput.value = '';
    }
  };
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
      
      <!-- Profile Picture Section -->
      <div class="flex flex-col items-center gap-3 border-b-2 border-slate-600 pb-4">
        <div class="relative">
          <img
            src={$page.data.session?.user?.image || '/favicon.png'}
            alt="Profile"
            class="h-24 w-24 rounded-full object-cover"
          />
          <label
            class="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <Fa icon={faCamera} class="text-white" />
            <input
              type="file"
              accept="image/*"
              class="hidden"
              bind:this={fileInput}
              on:change={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
        {#if uploading}
          <div class="text-sm text-gray-400">Uploading...</div>
        {/if}
      </div>

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
        <div class="flex items-center gap-3">
          <Toggle bind:checked={$settings.home.hideGPA} /> Hide GPA
        </div>
      </div>
    </div>
  </div>
</main>
