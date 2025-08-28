<script lang="ts">
  import { get, writable } from "svelte/store";
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import { Toggle } from "@zoron/common/components";
  import ImageEditor from "@zoron/common/components/ImageEditor.svelte";
  import { motion } from "@zoron/common/motion";
  import type { Settings } from "@zoron/common/types";
  import {
    type Device,
    PWA,
    compressImage,
    getDeviceInfo,
    getSubscription,
    requests,
    toast
  } from "@zoron/common/web";
  import { theme } from "@zoron/common/web/theme";

  import Fa from "svelte-fa";

  import { faTrash } from "@fortawesome/free-solid-svg-icons";
  import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
  import { faCamera } from "@fortawesome/free-solid-svg-icons/faCamera";

  import _ from "lodash";

  import { defaultSettings } from "../../api/account/settings/defaults";

  let device = $state<Device | null>(null);
  onMount(() => {
    (async () => {
      device = await getDeviceInfo();
    })();
  });

  let mounted = $state(false);
  const settings = writable(
    _.merge(defaultSettings, page.data.session?.user?.settings)
  );

  onMount(() => {
    mounted = true;
    return () => {
      history.go(0);
    };
  });

  settings.subscribe(async (value) => {
    if (!mounted) return;
    const res = await requests.post<Settings>("/api/account/settings", {
      notifications: value.notifications,
      home: value.home,
      social: value.social
    });
    if (!res.success)
      toast.error("An error occurred while saving your settings: " + res.error);
    else toast.success("Updated settings");
  });

  const devices = page.data.session?.user?.devices ?? [];
  let matchingDevice = $derived(
    devices.find(
      (d) =>
        device &&
        (device.fingerprint === d.device.fingerprint ||
          device.id === d.device.id)
    )
  );

  let uploading = $state(false);
  let fileInput: HTMLInputElement = $state(undefined as any);
  let showEditor = $state(false);
  let editingImage: HTMLImageElement | null = $state(null);

  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const imgURL = URL.createObjectURL(file);
      editingImage = new Image();
      editingImage.src = imgURL;
      await new Promise((resolve) => {
        editingImage!.onload = resolve;
      });

      showEditor = true;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process image");
    } finally {
      if (fileInput) fileInput.value = "";
    }
  };

  const handleCroppedImage = async (imageDataUrl: string) => {
    const supabaseClient = $supabase;
    if (!supabaseClient) {
      toast.error("Supabase client not initialized");
      return;
    }

    uploading = true;
    showEditor = false;
    const { dismiss } = toast.loading("Updating profile picture...");
    try {
      const userId = page.data.session?.user?.id;
      const filePath = `${userId}/profile-picture.jpg`; // Always use jpg since we convert in compressImage

      // First delete the existing profile picture if it exists
      const { error: deleteError } = await supabaseClient.storage
        .from("pfps")
        .remove([filePath]);

      if (deleteError && deleteError.message !== "Object not found") {
        throw deleteError;
      }

      // Convert data URL to blob
      const blobResponse = await fetch(imageDataUrl);
      const blob = await blobResponse.blob();

      // Create a new File object from the blob
      const processedFile = new File([blob], "profile-picture.jpg", {
        type: "image/jpeg"
      });

      // Upload processed image to Supabase storage
      const { error: uploadError, data } = await supabaseClient.storage
        .from("pfps")
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: { publicUrl }
      } = supabaseClient.storage.from("pfps").getPublicUrl(filePath);

      // Update user's profile picture URL
      const profileResponse = await fetch(
        "/api/account/settings/profile-picture",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ imageUrl: publicUrl + "?t=" + Date.now() })
        }
      );

      if (!profileResponse.ok) {
        const data = await profileResponse.json();
        throw new Error(data.error || "Failed to update profile picture");
      }

      toast.success("Profile picture updated successfully");
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update profile picture");
    } finally {
      dismiss();
      uploading = false;
      if (fileInput) fileInput.value = "";
    }
  };

  let autoAnim = (() => {
    let animIdx = 0;
    return () => {
      // return ++animIdx * 100 + 50;
      return animIdx * 100 + 50;
    };
  })();
</script>

<svelte:head>
  <title>Settings | {page.data.env.name}</title>
</svelte:head>

<main>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    {#if mounted}
      <div
        class="relative flex w-96 flex-col gap-3 rounded-2xl {$theme ===
        'amoled'
          ? 'border-4 border-white bg-black'
          : 'bg-slate-800'} p-10"
        in:fly|global={{
          delay: autoAnim(),
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }}
      >
        <a
          class="btn-circle absolute top-5 left-5"
          href="/account"
          in:fly|global={{
            delay: autoAnim(),
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        >
          <Fa icon={faArrowLeft} />
        </a>
        <div
          class="border-b-2 border-slate-600 pb-1 text-center text-4xl"
          in:fly|global={{
            delay: autoAnim(),
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        >
          Settings
        </div>

        <!-- Profile Picture Section -->
        <div
          class="flex flex-col items-center gap-3 border-b-2 border-slate-600 pb-4"
        >
          <div class="relative">
            <img
              src={page.data.session?.user?.image || "/favicon.png"}
              alt="Profile"
              class="h-24 w-24 rounded-full object-cover"
              in:fly|global={{
                delay: autoAnim(),
                duration: 1000,
                opacity: 0,
                y: -20,
                easing: motion.transitions.spring(400, 20)
              }}
            />

            {#if showEditor && editingImage}
              <div
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              >
                <div class="w-auto rounded-lg bg-slate-800 p-6">
                  <h3 class="mb-4 text-lg font-bold">Edit Profile Picture</h3>
                  <ImageEditor
                    image={editingImage}
                    onCrop={async (url) => {
                      await handleCroppedImage(url);
                    }}
                  />
                  <button
                    class="mt-4 w-full rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                    onclick={() => {
                      showEditor = false;
                      editingImage = null;
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {/if}
            <label
              class="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full {$theme ===
              'amoled'
                ? 'border-2 border-white bg-black'
                : 'bg-blue-600 hover:bg-blue-700'}"
              in:fly|global={{
                delay: autoAnim(),
                duration: 1000,
                opacity: 0,
                y: 20,
                easing: motion.transitions.spring(400, 20)
              }}
            >
              <Fa icon={faCamera} class="text-white" />
              <input
                type="file"
                accept="image/*"
                class="hidden"
                bind:this={fileInput}
                onchange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
          {#if uploading}
            <div
              class="text-sm text-gray-400"
              transition:fly|global={{
                delay: 0,
                duration: 1000,
                opacity: 0,
                y: -20,
                easing: motion.transitions.spring(400, 20)
              }}
            >
              Uploading...
            </div>
          {/if}
        </div>

        <div class="flex flex-1 flex-col gap-1">
          <div
            class="text-2xl"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            Notifications
          </div>
          <div
            class="flex items-center gap-3"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            <Toggle bind:checked={$settings.notifications.attendance} /> Attendance
          </div>
          <div
            class="flex items-center gap-3"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            <Toggle bind:checked={$settings.notifications.grades} /> Grades
          </div>
          <div
            class="text-xl"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            Registered devices:
          </div>
          <div
            class="flex flex-col items-stretch border-2 border-dashed border-slate-600 p-2"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            {#if devices.length === 0}
              <div class="text-center">No devices registered</div>
            {:else}
              {#each devices as subscription}
                <div class="flex items-center">
                  <div class="mx-3 h-2 w-2 rounded-full bg-white"></div>
                  <div class="flex-1">
                    {subscription.device.browser} on {subscription.device.os}
                  </div>
                  <button
                    class="btn-circle transition-colors hover:bg-white/5"
                    onclick={async () => {
                      // Remove device subscription
                      if (!subscription.device.id) {
                        toast.error("Could not identify device to remove");
                        return;
                      }
                      const res = await requests.post(
                        "/api/account/unsubscribe",
                        {
                          id: subscription.device.id
                        }
                      );

                      if (!res.success) {
                        toast.error(
                          "Failed to unregister device: " + res.error
                        );
                      } else {
                        toast.success("Device unregistered successfully");
                        history.go(0); // Reload the page to reflect changes
                      }
                    }}
                  >
                    <Fa icon={faTrash} />
                  </button>
                </div>
              {/each}
            {/if}
          </div>
          {#if !matchingDevice && device}
            <button
              class="btn-full btn-outlined mt-2 text-base"
              in:fly|global={{
                delay: autoAnim(),
                duration: 1000,
                opacity: 0,
                y: -20,
                easing: motion.transitions.spring(400, 20)
              }}
              onclick={async () => {
                if (!device) {
                  toast.error("Could not detect device information");
                  return;
                }

                // Request notification permission
                if (Notification.permission !== "granted") {
                  const permission = await Notification.requestPermission();
                  if (permission !== "granted") {
                    toast.error("Notification permission denied");
                    return;
                  }
                }

                // let failedSync = false;
                // if (device.backgroundSync) {
                //   await navigator.serviceWorker.ready.then(
                //     async (registration) => {
                //       const tags = await registration.periodicSync.getTags();
                //       if (tags.includes("sync-notifications")) {
                //         await registration.periodicSync.unregister(
                //           "sync-notifications"
                //         );
                //       }
                //       try {
                //         await registration.periodicSync.register(
                //           "sync-notifications",
                //           {
                //             minInterval: 5 * 1000 // 5 seconds
                //           }
                //         );
                //       } catch (error) {
                //         console.error(
                //           "Periodic sync registration failed:",
                //           error
                //         );
                //         toast.error(
                //           "You must install this app as a PWA to enable notifications."
                //         );
                //         get(PWA.overridePrompt)?.prompt();
                //         if (!get(PWA.overridePrompt))
                //           toast.error(
                //             "Go to the home page to install the app as a PWA."
                //           );
                //         failedSync = true; // Set flag to indicate sync failure
                //       }
                //     }
                //   );
                // }

                // if (failedSync) return;

                const subscription = await getSubscription(page.data.env.vapid);

                try {
                  const res = await requests.post("/api/account/subscribe", {
                    device,
                    subscription
                  });

                  if (!res.success)
                    toast.error("Failed to register device: " + res.error);
                  else {
                    toast.success(
                      "Device registered for notifications successfully"
                    );
                    history.go(0);
                  }
                } catch {
                  // Handle any errors that may occur during the request
                  toast.error("An error occurred while registering the device");
                }
              }}
            >
              Add this device
            </button>
          {/if}
        </div>
        <div class="flex flex-1 flex-col gap-1">
          <div
            class="mt-2 text-2xl"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            App
          </div>
          <div
            class="flex items-center gap-3"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            Theme:
            <select
              bind:value={$theme}
              class="rounded-md border-2 border-slate-600 bg-transparent outline-none focus-within:outline-none"
            >
              <option value="zoron" class="bg-slate-800 text-white"
                >Zoron Classic</option
              >
              <option value="amoled" class="bg-slate-800 text-white"
                >Ultra Dark</option
              >
            </select>
          </div>
          <div
            class="flex items-center gap-3"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            Default tab:
            <select
              bind:value={$settings.home.default}
              class="rounded-md border-2 border-slate-600 bg-transparent outline-none focus-within:outline-none"
            >
              <option value="home" class="bg-slate-800 text-white">Home</option>
              <option value="schedule" class="bg-slate-800 text-white"
                >Schedule</option
              >
              <option value="grades" class="bg-slate-800 text-white"
                >Grades</option
              >
              <option value="activity" class="bg-slate-800 text-white"
                >Activity</option
              >
            </select>
          </div>
          <div
            class="flex items-center gap-3"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            <Toggle bind:checked={$settings.home.hideGPA} /> Hide GPA
          </div>
        </div>
        <div class="flex flex-1 flex-col gap-1">
          <div
            class="mt-2 text-2xl"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            Social
          </div>
          <div
            class="flex items-center gap-3"
            in:fly|global={{
              delay: autoAnim(),
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            Who can see your schedule:
            <select
              bind:value={$settings.social.schedule}
              class="rounded-md border-2 border-slate-600 bg-transparent outline-none focus-within:outline-none"
            >
              <option value="all" class="bg-slate-800 text-white"
                >Everyone</option
              >
              <option value="friends" class="bg-slate-800 text-white"
                >Friends</option
              >
              <option value="none" class="bg-slate-800 text-white"
                >Nobody</option
              >
            </select>
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>
