<script lang="ts">
  export let open = false;
  export let key: any = 0;
  let content: HTMLDivElement;
  let resizeKey = 0;

  $: height =
    resizeKey > -1 && !content
      ? open
        ? "auto"
        : "0px"
      : open
        ? `${content.offsetHeight}px`
        : "0px";
</script>

<div style="overflow: hidden; transition: height 0.3s ease-in-out; height: {height}">
  {#key key}
    <div bind:this={content}>
      <slot />
    </div>
  {/key}
</div>
