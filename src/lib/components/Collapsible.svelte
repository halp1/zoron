<script lang="ts">
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
	$:width = 0;
</script>

<div
  style="overflow-x: hidden; transition: height 0.3s ease-in-out, width 0.3s ease-in-out; {direction ===
  'vertical'
    ? 'height'
    : 'width'}: {height}"
>
  {#key key}
    <div bind:this={content}>
      <slot />
    </div>
  {/key}
</div>
