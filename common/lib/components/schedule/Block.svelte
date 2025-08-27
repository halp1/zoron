<script lang="ts">
  import { fly } from "svelte/transition";

  import { twMerge } from "tailwind-merge";

  import type { aspen } from "../../aspen";
  import { motion } from "../../motion";
  import type { Block } from "../../types";
  import ScheduleBlockDetails from "./BlockDetails.svelte";

  interface Props {
    block: Block;
    index: number;
    className?: string;
    popoverClass?: string;
    freeFontSize?: string;
    lunch: aspen.Types.Schedule.Lunch;
    day: number;
  }

  let {
    block,
    className = "",
    popoverClass = "",
    freeFontSize = "text-xl",
    index,
    lunch,
    day
  }: Props = $props();

  let popoverVisible = $state(false);
</script>

<button
  class={twMerge(
    "relative row-span-1 flex cursor-pointer flex-col items-center  gap-2 border-slate-800 py-2 text-sm outline-none after:absolute after:top-0 after:left-0 after:h-full after:w-full after:bg-white/15 after:opacity-0 after:transition-opacity focus-within:outline-none hover:after:opacity-100",
    block.color + "/50",
    className
  )}
  in:fly|global={{
    delay: 100 + index * 10,
    duration: 1000,
    opacity: 0,
    y: -20,
    easing: motion.transitions.spring(400, 20)
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
      {block.type === "lunch"
        ? "Lunch"
        : block.type === "I-block"
          ? "I Block"
          : "Free"}
    </div>
  {/if}
</button>

{#if popoverVisible}
  <ScheduleBlockDetails
    {block}
    onClose={() => (popoverVisible = false)}
    {lunch}
    {day}
    class={popoverClass}
  />
{/if}
