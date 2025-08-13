<script lang="ts">
  import { onMount } from "svelte";

  import { browser } from "$app/environment";
  import { page } from "$app/state";

  import Head from "./Head.svelte";
  import { PWA } from "@zoron/common/web";

  import posthog from "posthog-js";
  import { Toaster } from "svelte-french-toast";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();
  let maxHeight: null | number = $state(null);

  onMount(() => {
    document.body.classList.add("suse");

    PWA.initialize();

    if (browser && !import.meta.env.DEV) {
      posthog.init(page.data.env.posthog.key, {
        api_host: "/posthog-proxy",
        person_profiles: "identified_only",
      });
      if (page.data.session?.user?.email) {
        posthog.identify(page.data.session.user.email, {
          email: page.data.session.user.email,
          name: page.data.session.user.name,
        });
      }
    }
  });
</script>

<Head />

<Toaster />

<div style={maxHeight ? `max-height: ${maxHeight}px;` : ""}>
  {@render children?.()}
</div>
