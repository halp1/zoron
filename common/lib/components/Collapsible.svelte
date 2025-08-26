<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    open?: boolean;
    key?: any;
    direction?: "vertical" | "horizontal";
    children?: import("svelte").Snippet;
    transition?: {
      in?: {
        function: Function;
        properties: Record<string, any>;
      };
    };
		class?: string;
  }

  let {
    open = false,
    key = 0,
    direction = "vertical",
    children,
    transition,
		class: className = "",
  }: Props = $props();
  let transitionFunction = $derived(
    transition?.in?.function || (() => () => {})
  );

  let content: HTMLDivElement = $state()!;
  let resizeKey = $state(0);

  let height = $derived(
    resizeKey > -1 && !content
      ? open
        ? "auto"
        : "0px"
      : open
        ? `${content[direction === "vertical" ? ("offsetHeight" as const) : ("offsetWidth" as const)]}px`
        : "0px"
  );
  let width = $derived(
    content
      ? `${content[direction === "horizontal" ? ("offsetHeight" as const) : ("offsetWidth" as const)]}px`
      : "auto"
  );

  function resize() {
    if (typeof window === "undefined") resizeKey++;
    else if (content) {
      resizeKey++;
    }
  }

  onMount(() => {
    let frame: number;
    const internalResize = () => {
      resize();
      frame = requestAnimationFrame(internalResize);
    };
    frame = requestAnimationFrame(internalResize);

    return () => {
      cancelAnimationFrame(frame);
    };
  });
</script>

{#if direction === "horizontal"}
  <div
    class="no-scroll"
    style="overflow: hidden; position: relative; transition: height 0.3s ease-in-out, width 0.3s ease-in-out; width: {height}; height: {width};"
    in:transitionFunction|global={transition?.in?.properties}
  >
    {#key key}
      <div bind:this={content} class="absolute left-0 top-0 {className}">
        {@render children?.()}
      </div>
    {/key}
  </div>
{:else}
  <div
    class="no-scroll"
    style="overflow: hidden; position: relative; 
		transition: height 0.3s ease-in-out, width 0.3s ease-in-out; height: {height};"
    in:transitionFunction|global={transition?.in?.properties}
  >
    {#key key}
      <div bind:this={content} class="{className}">
        {@render children?.()}
      </div>
    {/key}
  </div>
{/if}
