<script lang="ts">
  export let type: "a" | "button" = "button";
  export let href = "";
  export let onClick = () => {};
</script>

{#if type === "a"}
  <a
    {href}
    class="relative overflow-hidden border-2 border-blue-400 bg-transparent px-6 py-2 text-2xl text-white after:absolute after:right-full after:top-0 after:-z-10 after:h-full after:w-full after:bg-blue-400 after:transition-all after:duration-300 after:content-[''] hover:after:right-0"
    on:click={onClick}
  >
    <slot />
  </a>
{:else}
  <button
    class="relative overflow-hidden border-2 border-blue-400 bg-transparent px-6 py-2 text-2xl text-white ease-in after:absolute after:right-full after:top-0 after:-z-10 after:h-full after:w-full after:bg-blue-400 after:transition-all after:duration-300 after:content-[''] hover:after:right-0"
    on:click={onClick}
  >
    <slot />
  </button>
{/if}
