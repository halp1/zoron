<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  import { twMerge } from "tailwind-merge";

  import { theme } from "../web";

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
