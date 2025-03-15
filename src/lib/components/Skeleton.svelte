<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  import { twMerge } from "tailwind-merge";

  type $Props = HTMLAttributes<HTMLDivElement>;

  interface Props {
    class?: $Props["class"];
    [key: string]: any;
  }

  let { class: className = undefined, ...rest }: Props = $props();
</script>

<div
  class={twMerge("animate-pulse rounded-md bg-slate-700", className)}
  {...rest}
></div>
