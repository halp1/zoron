<script lang="ts">
  import { page } from "$app/state";

  import { PWA, isMobile } from "$lib/web";

  import { onMount } from "svelte";
  import { Toaster } from "svelte-french-toast";

  import "../app.css";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();
  let maxHeight: null | number = $state(null);

  onMount(() => {
    document.body.classList.add("suse");

    PWA.initialize();
  });
</script>

<svelte:head>
  <link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-title" content={page.data.env.name} />
  <link rel="manifest" href="/site.webmanifest" />
</svelte:head>

<Toaster />
<div style={maxHeight ? `max-height: ${maxHeight}px;` : ""}>
  {@render children?.()}
</div>

<style>
  :root {
    --sat: env(safe-area-inset-top);
    --sab: env(safe-area-inset-bottom);
  }
</style>
