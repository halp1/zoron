<script lang="ts" generics="T extends string | number">
  import { theme } from "$lib/web/theme";

  interface Props {
    items: {
      value: T;
      label: string;
    }[];
    value: T;
    transition?: {
      in?: {
        function: Function;
        properties: Record<string, any>;
      };
    };
  }

  let { items, value = $bindable(), transition }: Props = $props();

  let transitionFunction = $derived(
    transition?.in?.function || (() => () => {})
  );
</script>

<div
  class="border-x-1px inline-flex overflow-clip rounded-xl border-2 {$theme ===
  'amoled'
    ? 'border-white'
    : 'border-slate-600'}"
  in:transitionFunction|global={transition?.in?.properties}
>
  {#each items as item, idx}
    <button
      class="{$theme === 'amoled' ? 'border-white' : 'border-slate-600'} p-1"
      class:border-l-2={idx !== 0}
      class:bg-blue-500={item.value === value && $theme !== "amoled"}
      class:bg-white={item.value === value && $theme === "amoled"}
      class:text-black={item.value === value && $theme === "amoled"}
      onclick={() => (value = item.value)}>{item.label}</button
    >
  {/each}
</div>
