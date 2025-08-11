<script lang="ts">
  import { fly } from "svelte/transition";

  import { motion } from "../motion";
  import type { Block } from "../types";

  import { twMerge } from "tailwind-merge";
  import ScheduleBlockDetails from "./ScheduleBlockDetails.svelte";
  import type { aspen } from "../aspen";

  interface Props {
    block: Block;
    index: number;
    className?: string;
    freeFontSize?: string;
    lunch: aspen.Types.Schedule.Lunch;
    day: number;
  }

  let {
    block,
    className = "",
    freeFontSize = "text-xl",
    index,
    lunch,
    day,
  }: Props = $props();

  let popoverVisible = $state(false);
</script>

<button
  class={twMerge(
    "row-span-1 flex flex-col items-center gap-2 border-slate-800 bg-opacity-50 py-2 text-sm cursor-pointer after:opacity-0 after:bg-white/15 relative after:w-full after:h-full after:absolute after:top-0 after:left-0 hover:after:opacity-100 after:transition-opacity focus-within:outline-none outline-none",
    block.color,
    className
  )}
  in:fly|global={{
    delay: 100 + index * 10,
    duration: 1000,
    opacity: 0,
    y: -20,
    easing: motion.transitions.spring(400, 20),
  }}
  onclick={() => {
    popoverVisible = true;
  }}
>
  {#if block.type === "block"}
    <div
      class="relative px-2 text-center font-bold filter"
      style="word-wrap: break-word;"
    >
      {block.description}
    </div>
    <div class="mt-auto flex w-full items-center px-2">
      <div class="mr-auto">Room <strong>{block.room}</strong></div>
      <div class="relative ml-auto inline-flex items-center gap-2">
        {#if block.block}
          {block.block}
        {/if}
      </div>
    </div>
  {:else}
    <div class="my-auto {freeFontSize}">
      {block.type === "lunch" ? "Lunch" : block.type === "I-block" ? "I Block" : "Free"}
    </div>
  {/if}
</button>

{#if popoverVisible}
  <ScheduleBlockDetails {block} onClose={() => (popoverVisible = false)} {lunch} {day} />
{/if}
