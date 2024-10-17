<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  type $$Props = HTMLAttributes<HTMLDivElement>;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<div class="animate-pulse rounded-md bg-slate-700 {className}" {...$$restProps}></div>
