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
    glow?: boolean;
  }

  let {
    items,
    value = $bindable(),
    transition,
    glow = false
  }: Props = $props();

  let transitionFunction = $derived(
    transition?.in?.function || (() => () => {})
  );
</script>

<div
  class="border-x-1px inline-flex overflow-clip rounded-xl border-2 {$theme ===
  'amoled'
    ? 'border-white'
    : 'border-slate-600'}"
  class:glow
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

<style>
	.glow {
		border-color: white;
		animation: glow 6s ease-in-out forwards;
		box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
	}

	@keyframes glow {
		0% {
			border-color: white;
			box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
		}
		20% {
			border-color: rgba(52, 168, 82, 1);
			box-shadow: 0 0 20px rgba(52, 168, 82, 0.6);
		}
		40% {
			border-color: rgba(255, 211, 20, 1);
			box-shadow: 0 0 20px rgba(255, 211, 20, 0.6);
		}
		60% {
			border-color: rgba(255, 70, 65, 1);
			box-shadow: 0 0 20px rgba(255, 70, 65, 0.6);
		}
		80% {
			border-color: rgba(49, 134, 255, 1);
			box-shadow: 0 0 20px rgba(49, 134, 255, 0.6);
		}
		100% {
			border-color: white;
			box-shadow: 0 0 0px rgba(255, 255, 255, 0.6);
		}
	}

</style>
