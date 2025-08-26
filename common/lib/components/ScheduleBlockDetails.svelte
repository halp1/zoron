<script lang="ts">
  import { fade } from "svelte/transition";

  import { onMount } from "svelte";

  import Fa from "svelte-fa";

  import { faUser } from "@fortawesome/free-solid-svg-icons";

  import { twMerge } from "tailwind-merge";

  import type { aspen } from "../aspen";
  import type { Block } from "../types";
  import { requests, theme, toast } from "../web";

  interface Props {
    block: Block;
    lunch?: aspen.Types.Schedule.Lunch;
    day: number;
    class?: string;
    onClose: () => void;
  }

  let { block, onClose, lunch, day, class: className }: Props = $props();
  let sharedUsers = $state<
    null | { name: string; image: string; id: string }[]
  >(null);

  onMount(() => {
    (async () => {
      if (block.type === "block") {
        const res = await requests.post<{
          users: { name: string; image: string; id: string }[];
        }>(`/api/social/shared`, {
          course: block.course,
          teacher: block.teacher,
          schedule: block.schedule
        });
        if (res.success === false) toast.error("Failed to fetch shared users");
        else
          sharedUsers = res.data.users.toSorted((a, b) =>
            a.name.localeCompare(b.name)
          );
      } else if (block.type === "lunch") {
        const res = await requests.post<{
          users: { name: string; image: string; id: string }[];
        }>(`/api/social/shared/lunch`, {
          lunch,
          day
        });
        if (res.success === false) toast.error("Failed to fetch shared users");
        else
          sharedUsers = res.data.users.toSorted((a, b) =>
            a.name.localeCompare(b.name)
          );
      }
    })();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={twMerge(
    "fixed top-0 right-0 bottom-0 left-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-md",
    className
  )}
  transition:fade={{
    duration: 200,
    easing: (t) => t
  }}
  onclick={(e) => {
    if (e.currentTarget === e.target) onClose();
  }}
>
  <!-- info panel -->
  <div
    class="{$theme === 'amoled'
      ? 'border-4 border-white bg-black'
      : 'bg-slate-800'}  m-4 flex max-w-96 flex-col rounded-xl p-5"
  >
    <h1 class="mb-1 text-center text-2xl">
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
            <div class="mt-2 flex flex-wrap gap-2">
              {#each sharedUsers as user}
                <div
                  class="flex items-center gap-2 rounded-full bg-gray-700/20 px-3 py-1 text-sm text-gray-300"
                >
                  {#if user.image}
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img src={user.image} class="h-6 w-6 rounded-full" />
                  {:else}
                    <Fa icon={faUser} />
                  {/if}
                  <span>{user.name}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-center text-gray-400">
              No friends found for this block.
            </p>
          {/if}
        {:else}
          <p class="text-center text-gray-400">Loading your friends...</p>
        {/if}
      </div>
    {:else}
      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <div
          class="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300"
        >
          <span class="font-medium">Course:</span>
          {block.course}
        </div>
        <div
          class="inline-block rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300"
        >
          <span class="font-medium">Teacher:</span>
          {block.teacher}
        </div>
        <div
          class="inline-block rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300"
        >
          <span class="font-medium">Room:</span>
          {block.room}
        </div>
        <div
          class="inline-block rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300"
        >
          <span class="font-medium">Schedule:</span>
          {block.schedule}
        </div>
        <div
          class="inline-block rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300"
        >
          <span class="font-medium">Term:</span>
          {block.term}
        </div>
        <div
          class="inline-block rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300"
        >
          <span class="font-medium">Credits:</span>
          {block.credit}
        </div>
        <div
          class="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-300"
        >
          <span class="font-medium">Level:</span>
          {block.level === "Hon" ? "Honors" : block.level}
        </div>
      </div>

      <div class="mt-5">
        <h2 class="text-lg">People in this class:</h2>
        {#if sharedUsers}
          {#if sharedUsers.length > 0}
            <div class="mt-2 flex flex-wrap gap-2">
              {#each sharedUsers as user}
                <div
                  class="flex items-center gap-2 rounded-full bg-gray-700/20 px-3 py-1 text-sm text-gray-300"
                >
                  {#if user.image}
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img src={user.image} class="h-6 w-6 rounded-full" />
                  {:else}
                    <Fa icon={faUser} />
                  {/if}
                  <span>{user.name}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-center text-gray-400">
              No users found for this block.
            </p>
          {/if}
        {:else}
          <p class="text-center text-gray-400">Loading your classmates...</p>
        {/if}
      </div>
    {/if}
  </div>
</div>
