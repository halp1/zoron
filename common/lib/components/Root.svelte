<script lang="ts">
  import { onMount } from "svelte";

  import { browser } from "$app/environment";
  import { page } from "$app/state";

  import { PWA, theme } from "@zoron/common/web";

  import posthog from "posthog-js";
  import { Toaster } from "svelte-french-toast";

  import Head from "./Head.svelte";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();
  let maxHeight: null | number = $state(null);

  let showRedirectModal = $state(false);
  let redirectUrl = $state("");
  let destinationHost = $state("zoron.dev");
  let isStandalone = $state(false);

  onMount(() => {
    document.body.classList.add("suse");

    PWA.initialize();

    if (browser) {
      const hostname = window.location.hostname;
      if (hostname === "zoron.app" || hostname.endsWith(".zoron.app")) {
        showRedirectModal = true;
        document.body.style.overflow = "hidden";
        isStandalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone === true;
        
        const newHostname = hostname.replace("zoron.app", "zoron.dev");
        destinationHost = newHostname;
        redirectUrl = `https://${newHostname}${window.location.pathname}${window.location.search}${window.location.hash}`;
      }
    }

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
</script>

<Head />

<Toaster />

{#if showRedirectModal}
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl text-center flex flex-col items-center gap-6 {$theme === 'amoled'
        ? 'border-white bg-black text-white'
        : 'border-slate-700 bg-slate-900 text-white'}"
    >
      <div class="flex flex-col gap-2">
        <h2 class="text-3xl font-extrabold tracking-tight">
          Zoron.app is now <span class="text-blue-400">Zoron.dev</span>
        </h2>
        <p class="text-slate-300 text-base leading-relaxed mt-2">
          We have officially moved to a new domain! To continue using Zoron, please proceed to the new site.
        </p>
      </div>

      {#if isStandalone}
        <div class="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-sm text-left flex flex-col gap-2">
          <div class="font-bold flex items-center gap-1.5 text-base">
            ⚠️ Action Required: Reinstall App
          </div>
          <p class="leading-normal">
            You are running the installed version of the app. Please delete/uninstall this app from your device and reinstall it from <strong>zoron.dev</strong> to continue receiving updates.
          </p>
        </div>
      {:else}
        <div class="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-slate-400 text-xs text-left flex flex-col gap-1.5 w-full">
          <span class="text-slate-200 font-semibold text-sm">PWA / Shortcut Users:</span>
          <p class="leading-normal">
            If you have added Zoron to your Home Screen or installed the app, please remove it and reinstall it from the new domain (<strong>zoron.dev</strong>) to ensure you continue to receive updates.
          </p>
        </div>
      {/if}

      <a
        href={redirectUrl}
        class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-bold text-lg active:scale-98 transition-all cursor-pointer {$theme === 'amoled'
          ? 'border-white bg-white text-black hover:bg-gray-100'
          : 'border-blue-400 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}"
      >
        Go to {destinationHost}
      </a>
    </div>
  </div>
{/if}

<div style={maxHeight ? `max-height: ${maxHeight}px;` : ""}>
  {@render children?.()}
</div>
