<script lang="ts">
  import { get, writable } from "svelte/store";
  import { fly, scale } from "svelte/transition";

  import { onMount } from "svelte";

  import { onNavigate } from "$app/navigation";
  import { page } from "$app/state";

  import bgSrc from "@zoron/common/assets/bg.png";
  import { motion } from "@zoron/common/motion";
  import type { Changelog, Tab } from "@zoron/common/types";
  import { PWA, isIOS, storage, toast } from "@zoron/common/web";
  import { mode, theme } from "@zoron/common/web/theme";

  import Fa from "svelte-fa";

  import {
    faArrowRight,
    faClose,
    faCog,
    faMoon,
    faSignOut,
    faSun,
    faUser
  } from "@fortawesome/free-solid-svg-icons";

  import { twMerge } from "tailwind-merge";

  import arrowRight from "../assets/arrow-loop-right.png";
  import { CONSTANTS } from "../constants";

  interface Props {
    tabs: Tab[];
    changelog: Changelog[];
    isPro?: boolean;
    headerWidthClass?: string;
    contentPaddingClass?: string;
    children?: import("svelte").Snippet;
  }

  let { tabs, changelog, isPro = false, children }: Props = $props();

  let windowWidth = $state(0);

  onMount(() => {
    windowWidth = window.innerWidth;
    const listener = () => {
      windowWidth = window.innerWidth;
    };
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  });

  let activeTabIndex = $derived(
    page.url?.pathname
      ? tabs.indexOf(
          [...tabs]
            .reverse()
            .find((tab) =>
              page.url.pathname.includes(
                tab.path.slice(
                  0,
                  tab.path.indexOf("?") === -1
                    ? tab.path.length
                    : tab.path.indexOf("?")
                )
              )
            )!
        )
      : 0
  );

  let tabContainer: HTMLDivElement | null = $state(null);
  let tabRefs: HTMLAnchorElement[] = $state([]);

  let tabBarWidth = $derived(
    activeTabIndex === -1 ? 0 : tabRefs[activeTabIndex]?.offsetWidth || 0
  );

  let availableTabs = $derived(tabs.filter((tab) => !tab.mobileOnly));

  let animationDirection: "left" | "right" | "none" = $state("none");

  onNavigate((navigation) => {
    if (!navigation.to?.url.pathname.includes("activity"))
      (window as any).loadingActivity = false;
    const from = tabs.indexOf(
      [...tabs]
        .reverse()
        .find((tab) => navigation.from?.url.pathname.includes(tab.path))!
    );
    const to = tabs.indexOf(
      [...tabs]
        .reverse()
        .find((tab) => navigation.to?.url.pathname.includes(tab.path))!
    );

    if (from !== -1 && to !== -1) {
      if (from < to) animationDirection = "right";
      else animationDirection = "left";
    } else animationDirection = "none";
  });

  const titleBarState = writable(false);
  const themePopup = writable(get(theme) === "zoron");

  onMount(() => {
    $themePopup = get(theme) === "zoron";
    return storage.use("popups.theme", themePopup);
  });

  const prompt = PWA.prompt;

  const tagDelay =
    changelog[0].version[0] === "0" || import.meta.env.DEV ? 100 : 0;
  const proDelay = isPro ? 100 : 0;
  let modeSwitchDelay = $derived($theme === "amoled" ? 100 : 0);
</script>

<svelte:head>
  <title>Schedule | {page.data.env.name}</title>
</svelte:head>

<main
  class="activity-container relative flex h-screen w-full flex-col items-center justify-center {$theme ===
  'amoled'
    ? 'bg-black'
    : ''}"
>
  <!-- Title bar notification -->
  <div
    class="{$titleBarState
      ? 'h-12'
      : 'h-0'} w-screen overflow-hidden transition-all"
  >
    <div class="flex h-12 items-center bg-green-500 px-4 text-xl text-white">
      <div class="md:mr-auto md:w-10"></div>
      <div>
        Notifications are back, now checked about every hour between 7am and
        10pm.
      </div>
      <div class="ml-auto md:w-10">
        <button class="btn-circle" onclick={() => ($titleBarState = false)}>
          <Fa icon={faClose} />
        </button>
      </div>
    </div>
  </div>

  <!-- Desktop header -->
  {#if typeof window === "undefined" || windowWidth >= 768}
    <div class="hidden md:block">
      <div class="h-12 {$theme === 'amoled' ? 'border-b-2' : ''}"></div>
      <div
        class="fixed left-0 {$titleBarState
          ? 'top-12'
          : 'top-0'} z-10 flex h-12 w-full items-center gap-4 {$theme ===
        'amoled'
          ? 'border-b-2 border-white bg-black'
          : 'bg-slate-800'} px-3 shadow-2xl transition-all"
        style="view-transition-name: header;"
        bind:this={tabContainer}
      >
        <!-- Logo and title section -->
        <div class="flex w-[24rem] items-center text-3xl">
          <img
            src="/favicon.png"
            alt="Site Icon"
            class="h-8"
            in:scale|global={{
              start: 0.5,
              easing: motion.transitions.spring(500, 15, 1.2),
              opacity: 0,
              duration: 1000,
              delay: 100
            }}
          />
          <div
            class="ml-2"
            in:fly|global={{
              x: -20,
              opacity: 0,
              easing: motion.transitions.spring(300, 30),
              duration: 1000,
              delay: 200
            }}
          >
            {page.data.env.name}
          </div>

          {#if isPro}
            <div
              class="shine-text ml-2 font-semibold"
              in:fly|global={{
                x: -20,
                opacity: 0,
                easing: motion.transitions.spring(300, 30),
                duration: 1000,
                delay: 300
              }}
            >
              PRO
            </div>
          {/if}

          {#if changelog[0].version[0] === "0" || import.meta.env.DEV}
            <div
              class="mb-[1px] ml-2 font-mono text-slate-600"
              in:fly|global={{
                x: -20,
                opacity: 0,
                easing: motion.transitions.spring(300, 30),
                duration: 1000,
                delay: 300 + proDelay
              }}
            >
              {#if import.meta.env.DEV}
                DEV
              {:else}
                BETA
              {/if}
            </div>
          {/if}

          <div
            class="group mb-[4px] ml-2 mt-auto flex items-center font-mono text-sm text-slate-600"
            in:fly|global={{
              delay: 400 + proDelay + tagDelay,
              duration: 1000,
              opacity: 0,
              y: 20,
              easing: motion.transitions.spring(500, 15, 0.2)
            }}
          >
            v{changelog[0].version}
            <span
              class="suse ml-1 w-0 overflow-hidden transition-all group-hover:w-32"
            >
              @{page.data.env.commit}
            </span>
          </div>
        </div>

        <div class="ml-auto"></div>

        <!-- Navigation tabs -->
        {#each availableTabs as tab, idx}
          <a
            href={tab.path}
            data-sveltekit-preload-code
            data-sveltekit-preload-data
            class="text-xl"
            class:active={activeTabIndex === tabs.indexOf(tab)}
            bind:this={tabRefs[idx]}
            in:fly|global={{
              delay: idx * 100 + 500 + proDelay + tagDelay,
              duration: 1000,
              opacity: 0,
              y: -5,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            {tab.name}
          </a>
        {/each}

        <div class="mr-auto"></div>

        <!-- User actions section -->
        <div class="flex w-[24rem] items-center justify-end gap-2">
          {#if !isPro && (page.data.accountAge ?? 0) > CONSTANTS.proAccountAge}
            <span
              class="flex items-center justify-center whitespace-nowrap font-mono text-xs text-green-300"
              in:fly|global={{
                delay:
                  availableTabs.length * 100 +
                  1100 +
                  tagDelay +
                  modeSwitchDelay,
                duration: 1000,
                opacity: 0,
                x: 20,
                easing: motion.transitions.spring(300, 30)
              }}
            >
              free btw
              <div
                class="-mr-1 inline-block h-8 w-8 bg-green-300"
                style="mask-image: url('{arrowRight}'); mask-repeat: no-repeat; mask-position: center; mask-size: contain"
              ></div>
            </span>
            <!-- svelte-ignore a11y_mouse_events_have_key_events -->
            <a
              class="flex h-8 items-center justify-center gap-1 rounded-full border-2 bg-white/0 px-2 transition-all hover:bg-white/10 {$theme ===
              'amoled'
                ? 'border-white'
                : 'border-blue-400'}"
              href="/pro"
              in:fly|global={{
                delay:
                  availableTabs.length * 100 +
                  1000 +
                  tagDelay +
                  modeSwitchDelay,
                duration: 1000,
                opacity: 0,
                x: 20,
                easing: motion.transitions.spring(300, 30)
              }}
            >
              <span class="shine-text" data-text="PRO">PRO</span>
            </a>
          {/if}
          {#if $theme === "amoled"}
            <button
              class="flex h-8 w-8 cursor-pointer items-center justify-center gap-2 rounded-full border-2 bg-white/0 transition-all hover:bg-white/10"
              class:border-white={$theme === "amoled"}
              onclick={() => {
                mode.update((mode) => (mode === "light" ? "dark" : "light"));
              }}
              in:fly|global={{
                delay: availableTabs.length * 100 + 900 + tagDelay,
                duration: 1000,
                opacity: 0,
                x: 20,
                easing: motion.transitions.spring(300, 30)
              }}
            >
              {#if $mode === "dark"}
                <Fa icon={faSun} />
              {:else}
                <Fa icon={faMoon} />
              {/if}
            </button>
          {/if}
          <a
            class="flex h-8 w-8 items-center justify-center gap-2 rounded-full border-2 bg-white/0 transition-all hover:bg-white/10"
            class:border-white={$theme === "amoled"}
            class:border-blue-400={$theme === "zoron"}
            href="/account"
            in:fly|global={{
              delay: availableTabs.length * 100 + 800 + tagDelay,
              duration: 1000,
              opacity: 0,
              x: 20,
              easing: motion.transitions.spring(300, 30)
            }}
          >
            {#if typeof page.data.session?.user?.image === "string"}
              <img
                src={page.data.session?.user?.image}
                alt="Profile"
                class="h-6 rounded-full"
              />
            {:else}
              <Fa icon={faUser} />
            {/if}
          </a>
          <a
            class="flex h-8 w-8 items-center justify-center gap-2 rounded-full border-2 bg-white/0 transition-all hover:bg-white/10"
            class:border-white={$theme === "amoled"}
            class:border-blue-400={$theme === "zoron"}
            href="/account/settings"
            in:fly|global={{
              delay: availableTabs.length * 100 + 700 + tagDelay,
              duration: 1000,
              opacity: 0,
              x: 20,
              easing: motion.transitions.spring(300, 30)
            }}
          >
            <Fa icon={faCog} />
          </a>
          <a
            class="flex h-8 w-8 items-center justify-center gap-2 rounded-full border-2 bg-white/0 transition-all hover:bg-white/10"
            class:border-white={$theme === "amoled"}
            class:border-blue-400={$theme === "zoron"}
            href="/logout"
            in:fly|global={{
              delay: availableTabs.length * 100 + 600 + tagDelay,
              duration: 1000,
              opacity: 0,
              x: 20,
              easing: motion.transitions.spring(300, 30)
            }}
          >
            <Fa icon={faSignOut} />
            <!-- Log Out -->
          </a>
        </div>

        <!-- Active tab indicator -->
        <div
          class="absolute bottom-1 h-[2px] rounded-full bg-white transition-all"
          style="width: {tabBarWidth}px; left: {(tabRefs[
            activeTabIndex
          ]?.getBoundingClientRect().left || 0) -
            (tabContainer?.getBoundingClientRect().left || 0) -
            windowWidth +
            windowWidth}px"
          in:fly|global={{
            y: 10,
            opacity: 0,
            easing: motion.transitions.spring(300, 30),
            duration: 1000,
            delay: 1000
          }}
        ></div>
      </div>
    </div>
  {/if}

  <!-- Main content area -->
  {#key page.url}
    <div
      class="view-anim-{animationDirection} no-scroll mt-[env(safe-area-inset-top)] flex w-full flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden"
    >
      {@render children?.()}
    </div>
  {/key}

  <!-- Mobile bottom navigation -->
  {#if typeof window === "undefined" || windowWidth < 768}
    <div
      class="h-14 md:hidden pb-[env(safe-area-inset-bottom)]"
    ></div>
    <div
      class="fixed bottom-0 left-0 right-0 flex w-full items-center justify-evenly pb-2 pt-2 shadow-xl md:hidden {$theme ===
      'amoled'
        ? 'border-t-2 border-white bg-black'
        : 'bg-slate-800'}"
    >
      {#each tabs as tab, idx}
        <a
          in:fly|global={{
            delay: (idx + 1) * 75,
            duration: 1000,
            opacity: 0,
            y: -5,
            easing: motion.transitions.spring(400, 20)
          }}
          href={tab.path}
          data-sveltekit-preload-code
          data-sveltekit-preload-data
          class="btn-circle relative h-10 w-10 border-2"
          class:border-slate-600={$theme === "zoron"}
          class:border-white={$theme === "amoled"}
          class:bg-white={$theme === "amoled" && idx === activeTabIndex}
          class:bg-blue-600={$theme === "zoron" && idx === activeTabIndex}
          class:hover:bg-blue-600={$theme === "zoron" && idx === activeTabIndex}
        >
          {#if typeof tab.icon === "string"}
            <img
              src={tab.icon}
              alt=""
              class={twMerge(
                "absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full",
                tab.iconClass ?? ""
              )}
            />
          {:else}
            <Fa
              icon={tab.icon}
              size="lg"
              class={twMerge(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-85",
                $theme === "amoled" && idx === activeTabIndex
                  ? "text-black"
                  : "text-white",
                tab.iconClass ?? ""
              )}
            />
          {/if}
        </a>
      {/each}
    </div>
  {/if}

  <!-- PWA installation popup -->
  <div
    class="fixed bottom-0 left-0 right-0 top-0 {$prompt
      ? 'flex'
      : 'hidden'} items-center justify-center backdrop-blur-md"
  >
    <div
      class="flex flex-col items-center justify-center rounded-md p-10 {$theme ===
      'amoled'
        ? 'border-2 border-white bg-black'
        : 'bg-slate-800'}"
    >
      <div class="mb-5 text-xl">Install {page.data.env.name}?</div>
      <div class="text-center">
        You appear to be on a mobile device.
        <br />
        {page.data.env.name} works better when installed as an app.
      </div>
      <div class="mt-3 flex items-center justify-center gap-3">
        <button
          class="btn-full btn-outlined border-green-400 text-base"
          onclick={() => {
            $prompt?.prompt();
            PWA.hidePrompt();
          }}
        >
          Install
        </button>
        <button
          class="btn-full btn-outlined {$theme === 'amoled'
            ? 'border-white'
            : 'border-blue-400'} text-base"
          onclick={() => PWA.hidePrompt()}
        >
          No thanks
        </button>
      </div>
    </div>
  </div>

  <!-- Theme popup -->
  {#if $themePopup}
    <div
      class="fixed bottom-10 right-0 mx-5 rounded-3xl border-4 p-8 md:right-10 md:mx-0 md:ml-0 md:w-96 {$theme ===
      'amoled'
        ? 'border-white bg-black'
        : 'border-slate-600 bg-slate-900'}"
    >
      <h1 class="text-3xl">Zoron has a new theme!</h1>
      <div class={$theme === "amoled" ? "text-white" : "text-slate-400"}>
        You can always change this in the app settings.
      </div>
      <div class="mt-3 flex gap-2">
        {#if $theme === "zoron"}
          <button
            class="btn-full btn-outlined flex-1 border-green-400 p-2 text-base"
            onclick={() => {
              theme.set("amoled");
            }}
          >
            Try it out
          </button>
          <button
            class="btn-full btn-outlined flex-1 border-red-500 p-2 text-base"
            onclick={() => ($themePopup = false)}
          >
            Close
          </button>
        {:else}
          <button
            class="btn-full btn-outlined flex-1 border-green-400 p-2 text-base"
            onclick={() => {
              $themePopup = false;
            }}
          >
            Keep it
          </button>
          <button
            class="btn-full btn-outlined flex-1 border-red-500 p-2 text-base"
            onclick={() => {
              theme.set("zoron");
              $themePopup = false;
            }}
          >
            Revert
          </button>
        {/if}
      </div>
    </div>
  {/if}
</main>

{#if $theme === "zoron"}
  <img
    src={bgSrc}
    alt=""
    class="fixed left-1/2 top-1/2 -z-10 mb-12 h-[70vh] -translate-x-1/2 -translate-y-1/2 opacity-10 blur-xl md:mt-12"
  />
{/if}

<style>
  .view-anim-left {
    view-transition-name: slide-in-out-left;
  }

  .view-anim-right {
    view-transition-name: slide-in-out-right;
  }
</style>
