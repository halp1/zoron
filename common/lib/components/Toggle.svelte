<script lang="ts">
  import { twMerge } from "tailwind-merge";

  import { theme } from "../web/theme";

  interface Props {
    checked?: boolean;
    color?: string;
    className?: string;
  }

  let {
    checked = $bindable(false),
    color = $theme === "amoled" ? "bg-white" : "bg-orange-400",
    className = ""
  }: Props = $props();
</script>

<label class={twMerge("flex cursor-pointer items-center", className)}>
  <div
    class="relative h-6 w-10 rounded-full {$theme === 'amoled'
      ? 'border-2 border-white bg-black'
      : 'bg-slate-600'}"
  >
    <input type="checkbox" bind:checked class="peer hidden" />
    <div
      class="absolute {$theme === 'amoled'
        ? 'left-0'
        : 'left-[2px]'} top-1/2 h-5 w-5 -translate-y-1/2 rounded-full {color} transition-all {$theme ===
      'amoled'
        ? 'peer-checked:left-[16.5px]'
        : 'peer-checked:left-[18px]'}"
    ></div>
  </div>
</label>
