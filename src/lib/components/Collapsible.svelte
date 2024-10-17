<script lang="ts">
  export let open = false;
  let contentHeight = 0;
  let content: HTMLDivElement;

  $: height = !content ? (open ? "auto" : "0px") : open ? `${content.offsetHeight}px` : "0px";
</script>

<div style="overflow: hidden; transition: height 0.3s ease-in-out; height: {height}">
  <div bind:this={content}>
    <slot />
  </div>
</div>
