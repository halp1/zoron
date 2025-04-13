<script lang="ts">
  import { onMount } from "svelte";

  import { browser } from "$app/environment";
  import { page } from "$app/state";

  import { PWA, isMobile } from "$lib/web";

  import posthog from "posthog-js";
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

    onMount(() => {
      if (browser && !import.meta.env.DEV) {
        posthog.init(page.data.env.posthog.key, {
          api_host: "/posthog-proxy",
          person_profiles: "identified_only"
        });
        if (page.data.session?.user?.email) {
          posthog.identify(page.data.session.user.email, {
            email: page.data.session.user.email,
            name: page.data.session.user.name
          });
        }
      }
    });
  });
</script>

<svelte:head>
  <link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-title" content={page.data.env.name} />
  <link rel="manifest" href="/site.webmanifest" />
	
	<!-- OpenGraph/Twitter tags -->
	<meta property="og:title" content={page.data.env.name} />
	<meta property="og:description" content="The new way to see your schedule and grades at LHS." />
	<meta property="og:image" content="/screenshots/desktop.png" />
	<meta property="og:url" content="https://zoron.app" />
	<meta property="og:type" content="website" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={page.data.env.name} />
	<meta name="twitter:description" content="The new way to see your schedule and grades at LHS." />
	<meta name="twitter:image" content="/screenshots/desktop.png" />
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
