<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export let type: "a" | "button" = "button";
  export let href = "";
  export let onClick = () => {};

  let size = writable({ x: 0, y: 0 });
  let uniqueID = `bub-${Math.random().toString(36).substring(7)}`;

  onMount(() => {
    const element = document.createElement("style");
    const unsubscribe = size.subscribe((size) => {
      const max = Math.max(size.x, size.y) * 1.1;
      element.innerHTML = `
				#${uniqueID}:hover::after {
					width: ${max}px;
					height: ${max}px;
				}
			`;
    });

    document.head.appendChild(element);
    return () => {
      document.head.removeChild(element);
      unsubscribe();
    };
  });
</script>

{#if type === "a"}
  <a
    id={uniqueID}
    {href}
    bind:offsetWidth={$size.x}
    bind:offsetHeight={$size.y}
    class="relative overflow-hidden border-2 border-orange-400 bg-transparent px-6 py-2 text-2xl text-white after:absolute after:left-1/2 after:top-1/2 after:-z-10 after:h-0 after:w-0 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-orange-400 after:opacity-50 after:transition-all after:duration-300 after:content-[''] hover:after:opacity-100"
    on:click={onClick}
  >
    <slot />
  </a>
{:else}
  <button
    id={uniqueID}
    class="relative overflow-hidden border-2 border-orange-400 bg-transparent px-6 py-2 text-2xl text-white after:absolute after:left-1/2 after:top-1/2 after:-z-10 after:h-0 after:w-0 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-orange-400 after:opacity-50 after:transition-all after:duration-300 after:content-[''] hover:after:opacity-100"
    on:click={onClick}
  >
    <slot />
  </button>
{/if}
