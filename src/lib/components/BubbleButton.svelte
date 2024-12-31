<script lang="ts">
  interface Props {
    type?: "a" | "button";
    href?: string;
    onClick?: any;
    children?: import("svelte").Snippet;
  }

  let { type = "button", href = "", onClick = () => {}, children }: Props = $props();
  const className =
    "relative overflow-hidden border-2 border-blue-400 bg-transparent px-6 py-2 text-2xl text-white ease-in after:absolute after:right-full after:top-0 after:-z-10 after:h-full after:w-full after:bg-blue-400 after:transition-all after:duration-300 after:content-[''] active:after:right-0 sm:hover:after:right-0";
</script>

{#if type === "a"}
  <a {href} class={className} onclick={onClick}>
    {@render children?.()}
  </a>
{:else}
  <button class={className} onclick={onClick}>
    {@render children?.()}
  </button>
{/if}
