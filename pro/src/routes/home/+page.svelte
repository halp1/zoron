<script lang="ts">
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import iosInstructions1 from "@zoron/common/assets/instructions/pwa/ios/1.png";
  import iosInstructions2 from "@zoron/common/assets/instructions/pwa/ios/2.png";
  import iosInstructions3 from "@zoron/common/assets/instructions/pwa/ios/3.png";
  import { motion } from "@zoron/common/motion";
  import { PWA, theme, zoron } from "@zoron/common/web";

  import { changelog } from "../changelog/changelog";

  const name = page.data?.session?.user?.name;
  const prompt = PWA.overridePrompt;
  const showIOSPopup = PWA.showIOSPopup;
  let iosInstructionsOpen = $state(false);
</script>

<svelte:head>
  <title>Home | {page.data.env.name}</title>
</svelte:head>

<div class="flex h-full flex-col items-center px-10 pt-5">
  {#if name}
    <div
      class="text-center text-3xl"
      in:fly|global={{
        delay: 250,
        duration: 1000,
        opacity: 0,
        y: -20,
        easing: motion.transitions.spring(400, 20)
      }}
    >
      Hello, {name?.split(" ")[0]}.
    </div>
    <div
      class="mt-5 mr-auto text-2xl sm:mr-0"
      in:fly|global={{
        delay: 350,
        duration: 1000,
        opacity: 0,
        y: -20,
        easing: motion.transitions.spring(400, 20)
      }}
    >
      Announcements:
    </div>
    {#if $zoron.announcements.length > 0}
      {#each $zoron.announcements as announcement, idx}
        <div
          class="mt-5 max-w-96 rounded-md border-white p-2 text-lg sm:w-auto {$theme ===
          'amoled'
            ? 'border-2'
            : ''} {$theme === 'zoron' ? 'bg-slate-600' : ''}"
          in:fly|global={{
            delay: 450 + idx * 25,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        >
          {announcement}
        </div>
      {/each}
    {:else}
      <div class="mt-5 text-slate-400">No announcements at this time.</div>
    {/if}
    <!-- <div
      class="mt-5 w-full text-2xl sm:w-auto"
      in:fly|global={{
        delay: 550,
        duration: 1000,
        opacity: 0,
        y: -20,
        easing: motion.transitions.spring(400, 20)
      }}
    >
      Updates:

      <div
        in:fly|global={{
          delay: 650,
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }}
        class="px-auto mt-2 max-h-80 w-full border-2 border-slate-600 px-1 py-3 sm:w-96"
      >
        {#each changelog.slice(0, 5) as update}
          <a
            class="relative flex items-center gap-3 rounded-full px-2 hover:bg-slate-50/10"
            href="/changelog#{update.version}"
          >
            <div
              class="flex h-full items-center border-r-2 border-slate-600 pr-2"
            >
              <div>
                {update.version}	
              </div>
            </div>
            <div class="ml-auto text-lg">
              {update.overview}
              <div class="float-right ml-2 text-slate-400">{update.date}</div>
            </div>
          </a>
        {/each}
      </div>
    </div> -->
    {#if $prompt}
      <button
        in:fly|global={{
          delay: 250,
          duration: 1000,
          opacity: 0,
          y: 20,
          easing: motion.transitions.spring(400, 20)
        }}
        class="btn-full btn-outlined mt-auto mb-10 w-80 border-green-400 text-base"
        onclick={() => {
          $prompt?.prompt();
          PWA.hidePrompt();
        }}
      >
        Install {page.data.env.name}
      </button>
    {/if}
    {#if $showIOSPopup}
      <button
        in:fly|global={{
          delay: 250,
          duration: 1000,
          opacity: 0,
          y: 20,
          easing: motion.transitions.spring(400, 20)
        }}
        class="btn-full btn-outlined mt-auto mb-10 w-80 border-green-400 text-base"
        onclick={() => {
          iosInstructionsOpen = true;
        }}
      >
        Install {page.data.env.name} on IOS
      </button>
    {/if}
  {:else}
    An error occurred.
  {/if}
</div>
{#if iosInstructionsOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black backdrop-blur-sm"
    onkeydown={(e) => {
      if (e.key === "Escape") {
        iosInstructionsOpen = false;
      }
    }}
    onclick={(e) => {
      if (e.target === e.currentTarget) {
        iosInstructionsOpen = false;
      }
    }}
  >
    <div
      class="custom-scroll mx-2 max-h-[80vh] w-96 overflow-y-auto rounded-lg p-5"
      class:bg-slate-800={$theme === "zoron"}
      class:bg-black={$theme === "amoled"}
    >
      <div class="text-2xl">Instructions</div>
      <div class="mt-5 flex flex-col gap-5">
        <div>
          <div class="text-lg">1. Tap the share button</div>
          <img
            src={iosInstructions1}
            alt="Tap share button"
            class="mt-2 rounded-lg border border-slate-200"
          />
        </div>
        <div>
          <div class="text-lg">2. Tap "Add to Home Screen"</div>
          <img
            src={iosInstructions2}
            alt="Tap Add to Home Screen"
            class="mt-2 rounded-lg border border-slate-200"
          />
        </div>
        <div>
          <div class="text-lg">3. Tap "Add"</div>
          <img
            src={iosInstructions3}
            alt="Tap Add"
            class="mt-2 rounded-lg border border-slate-200"
          />
        </div>
      </div>
      <button
        class="btn-full btn-outlined mt-5"
        onclick={() => {
          iosInstructionsOpen = false;
        }}
      >
        Close
      </button>
    </div>
  </div>
{/if}
