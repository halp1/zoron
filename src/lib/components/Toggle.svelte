<script lang="ts">
  import { twMerge } from "tailwind-merge";

  interface Props {
    checked?: boolean;
    color?: string;
    className?: string;
  }

  let {
    checked = $bindable(false),
    color = "bg-orange-400",
    className = ""
  }: Props = $props();
</script>

<label class={twMerge("flex cursor-pointer items-center", className)}>
  <div class="relative h-6 w-10 rounded-full bg-slate-600">
    <input type="checkbox" bind:checked class="peer hidden" />
    <div
      class="absolute left-[2px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full {color} transition-all peer-checked:left-[18px]"
    ></div>
  </div>
</label>
