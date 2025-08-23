<script lang="ts">
  import { fade } from "svelte/transition";
  import type { Block } from "../types";
  import { requests, theme, toast } from "../web";
  import { onMount } from "svelte";
  import Fa from "svelte-fa";
  import { faUser } from "@fortawesome/free-solid-svg-icons";
  import type { aspen } from "../aspen";

  interface Props {
    block: Block;
    lunch?: aspen.Types.Schedule.Lunch;
    day: number;
    onClose: () => void;
  }

  let { block, onClose, lunch, day }: Props = $props();

  let sharedUsers = $state<null | { name: string; image: string; id: string }[]>(null);

  onMount(() => {
    (async () => {
      if (block.type === "block") {
        const res = await requests.post<{
          users: { name: string; image: string; id: string }[];
        }>(`/api/social/shared`, {
          course: block.course,
          teacher: block.teacher,
          schedule: block.schedule,
        });
        if (res.success === false) toast.error("Failed to fetch shared users");
        else
          sharedUsers = res.data.users.toSorted((a, b) => a.name.localeCompare(b.name));
      } else if (block.type === "lunch") {
        const res = await requests.post<{
          users: { name: string; image: string; id: string }[];
        }>(`/api/social/shared/lunch`, {
          lunch,
          day,
        });
        if (res.success === false) toast.error("Failed to fetch shared users");
        else
          sharedUsers = res.data.users.toSorted((a, b) => a.name.localeCompare(b.name));
      }
    })();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="z-10 fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black/40 backdrop-blur-md"
  transition:fade={{
    duration: 200,
    easing: (t) => t,
  }}
  onclick={(e) => {
    if (e.currentTarget === e.target) onClose();
  }}
>
  <!-- info panel -->
  <div
    class="{$theme === 'amoled'
      ? 'bg-black border-4 border-white'
      : 'bg-slate-800'}  max-w-96 rounded-xl m-4 p-5 flex flex-col"
  >
    <h1 class="text-2xl text-center mb-1">
      {block.type === "block"
        ? block.description
        : block.type === "I-block"
          ? "I Block"
          : block.type === "free"
            ? "Free"
            : `Lunch ${lunch}`}
    </h1>
    {#if block.type === "free" || block.type === "I-block"}
      <div class="text-center">
        There is no additional information available for this block.
      </div>
    {:else if block.type === "lunch"}
      You share this lunch with:

      <div class="mt-1">
        {#if sharedUsers}
          {#if sharedUsers.length > 0}
            <div class="flex flex-wrap gap-2 mt-2">
              {#each sharedUsers as user}
                <div
                  class="flex items-center gap-2 bg-gray-700/20 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  {#if user.image}
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img src={user.image} class="w-6 h-6 rounded-full" />
                  {:else}
                    <Fa icon={faUser} />
                  {/if}
                  <span>{user.name}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-center text-gray-400">No friends found for this block.</p>
          {/if}
        {:else}
          <p class="text-center text-gray-400">Loading your friends...</p>
        {/if}
      </div>
    {:else}
      <div class="mt-5 flex flex-wrap gap-2 justify-center">
        <div
          class="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm"
        >
          <span class="font-medium">Course:</span>
          {block.course}
        </div>
        <div
          class="inline-block bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm"
        >
          <span class="font-medium">Teacher:</span>
          {block.teacher}
        </div>
        <div
          class="inline-block bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
        >
          <span class="font-medium">Room:</span>
          {block.room}
        </div>
        <div
          class="inline-block bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm"
        >
          <span class="font-medium">Schedule:</span>
          {block.schedule}
        </div>
        <div
          class="inline-block bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm"
        >
          <span class="font-medium">Term:</span>
          {block.term}
        </div>
        <div
          class="inline-block bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm"
        >
          <span class="font-medium">Credits:</span>
          {block.credit}
        </div>
        <div
          class="inline-block bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm"
        >
          <span class="font-medium">Level:</span>
          {block.level === "Hon" ? "Honors" : block.level}
        </div>
      </div>

      <div class="mt-5">
        <h2 class="text-lg">People in this class:</h2>
        {#if sharedUsers}
          {#if sharedUsers.length > 0}
            <div class="flex flex-wrap gap-2 mt-2">
              {#each sharedUsers as user}
                <div
                  class="flex items-center gap-2 bg-gray-700/20 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  {#if user.image}
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img src={user.image} class="w-6 h-6 rounded-full" />
                  {:else}
                    <Fa icon={faUser} />
                  {/if}
                  <span>{user.name}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-center text-gray-400">No users found for this block.</p>
          {/if}
        {:else}
          <p class="text-center text-gray-400">Loading your classmates...</p>
        {/if}
      </div>
    {/if}
  </div>
</div>
