<script lang="ts">
  import { onMount } from "svelte";

  export let open = false;
  export let key: any = 0;
  export let direction: "vertical" | "horizontal" = "vertical";
  let content: HTMLDivElement;
  let resizeKey = 0;

  $: height =
    resizeKey > -1 && !content
      ? open
        ? "auto"
        : "0px"
      : open
        ? `${content[direction === "vertical" ? ("offsetHeight" as const) : ("offsetWidth" as const)]}px`
        : "0px";
  $: width = content
    ? `${content[direction === "horizontal" ? ("offsetHeight" as const) : ("offsetWidth" as const)]}px`
    : "auto";

  function resize() {
    resizeKey++;
  }

  onMount(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  });
</script>

{#if direction === "horizontal"}
  <div
    style="overflow: hidden; position: relative; transition: height 0.3s ease-in-out, width 0.3s ease-in-out; width: {height}; height: {width};"
  >
    {#key key}
      <div bind:this={content} class="absolute left-0 top-0">
        <slot />
      </div>
    {/key}
  </div>
{:else}
  <div
    style="overflow-x: hidden; position: relative; 
		transition: height 0.3s ease-in-out, width 0.3s ease-in-out; height: {height};"
  >
    {#key key}
      <div bind:this={content}>
        <slot />
      </div>
    {/key}
  </div>
{/if}
