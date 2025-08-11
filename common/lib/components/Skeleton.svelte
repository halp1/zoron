<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  import { theme } from "../web";

  import { twMerge } from "tailwind-merge";

  type $Props = HTMLAttributes<HTMLDivElement>;

  interface Props {
    class?: string;
    [key: string]: any;
  }

  let { class: className = "", ...rest }: Props = $props();
</script>

<div
  class={twMerge(
    `animate-pulse rounded-md ${$theme === "amoled" ? "bg-[#363636]" : "bg-slate-700"}`,
    className
  )}
  {...rest}
></div>
