<script lang="ts">
  import type { Block } from "$lib/types";

  export let block: Block;

  export let className = "";
  export let freeFontSize = "text-xl";

  import { twMerge } from "tailwind-merge";
</script>

<div
  class={twMerge(
    "row-span-1 flex flex-col items-center gap-2 border-slate-800 bg-opacity-50 py-2 text-sm",
    block.color,
    className
  )}
>
  {#if block.type === "block"}
    <div class="relative px-2 text-center font-bold" style="word-wrap: break-word;">
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
</div>
