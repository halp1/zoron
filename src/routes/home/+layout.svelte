<script lang="ts">
  import { writable } from "svelte/store";
  import { fade, fly, scale } from "svelte/transition";

  import { onMount } from "svelte";

  import { goto, onNavigate } from "$app/navigation";
  import { page } from "$app/state";

  import { motion } from "$lib/motion";
  import { PWA, isIOS, storage, zoron } from "$lib/web";

  import Fa from "svelte-fa";

  import {
    type IconDefinition,
    faCalendar,
    faChartLine,
    faClose,
    faComments,
    faHome,
    faList,
    faShieldAlt,
    faSignOut,
    faUser
  } from "@fortawesome/free-solid-svg-icons";

  import bgSrc from "../../assets/bg.png";
  import { changelog } from "../changelog/changelog";
  import "./home.css";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  interface Tab {
    name: string;
    path: string;
    icon: IconDefinition | string;
    mobileOnly?: boolean;
  }
  let windowWidth = $state(0);
  onMount(() => {
    windowWidth = window.innerWidth;
    const listener = () => {
      windowWidth = window.innerWidth;
    };
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  });

  const tabs: Tab[] = [
    { name: "Home", path: "/home?page=home", icon: faHome },
    { name: "Schedule", path: "/home/schedule", icon: faCalendar },
    { name: "Grades", path: "/home/grades", icon: faChartLine },
    { name: "Activity", path: "/home/activity", icon: faList },
    // { name: "Chat", path: "/home/chat", icon: faComments },
    ...(page.data.session?.user?.role === "admin"
      ? [{ name: "Admin", path: "/home/admin", icon: faShieldAlt }]
      : []),
    {
      name: "Account",
      path: "/account",
      icon: page.data.session?.user?.image || faUser,
      mobileOnly: true
    }
  ];

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

    // if (!document.startViewTransition) return;

    // return new Promise((resolve) => {
    //   document
    //     .startViewTransition(async () => {
    //       resolve();
    //       await navigation.complete;
    //     })
    //     .finished.then(() => (animationDirection = "none"));
    // });
  });

  const titleBarState = writable(false);

  onMount(() => {
    $titleBarState = true;
    return storage.use("banner.show", titleBarState);
  });

  const prompt = PWA.prompt;
</script>

<svelte:head>
  <title>Schedule | {page.data.env.name}</title>
</svelte:head>

<main
  class="activity-container relative flex h-screen w-full flex-col items-center justify-center"
>
  <div
    class="{$titleBarState
      ? 'h-12'
      : 'h-0'} w-screen overflow-hidden transition-all"
  >
    <div class="flex h-12 items-center bg-emerald-600 px-4 text-xl text-white">
      <div class="md:mr-auto md:w-10"></div>
      <div>
        Zoron now has notifications! Go <a
          href="/account/settings"
          class="underline">here to set them up.</a
        >
      </div>
      <div class="ml-auto md:w-10">
        <button class="btn-circle" onclick={() => ($titleBarState = false)}>
          <Fa icon={faClose} />
        </button>
      </div>
    </div>
  </div>
  {#if typeof window === "undefined" || windowWidth >= 768}
    <div class="hidden md:block">
      <div class="h-12"></div>
      <div
        class="fixed left-0 {$titleBarState
          ? 'top-12'
          : 'top-0'} z-10 flex h-12 w-full items-center gap-4 bg-slate-800 px-3 shadow-2xl transition-all"
        style="view-transition-name: header;"
        bind:this={tabContainer}
      >
        <div class="flex w-60 items-center text-3xl">
          <img
            src="/favicon.png"
            alt="Site Icon"
            class="h-8"
            in:scale|global={{
              start: 0.5,
              easing: motion.transitions.spring(500, 15, 1.2),
              opacity: 0,
              duration: 1000
            }}
          />
          <div
            class="ml-2"
            in:fly|global={{
              x: -20,
              opacity: 0,
              easing: motion.transitions.spring(300, 30),
              duration: 1000,
              delay: 0.2
            }}
          >
            {page.data.env.name}
          </div>
          {#if changelog[0].version[0] === "0" || import.meta.env.DEV}
            <div
              class="ml-2 mt-[2px] font-mono text-slate-600"
              in:fly|global={{
                delay: 0.5,
                duration: 1000,
                opacity: 0,
                x: 20,
                easing: motion.transitions.spring(500, 15, 0.2)
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
            class="mb-[3px] ml-2 mt-auto font-mono text-sm text-slate-600"
            in:fly|global={{
              delay: 0.35,
              duration: 1000,
              opacity: 0,
              y: 20,
              easing: motion.transitions.spring(500, 15, 0.2)
            }}
          >
            v{changelog[0].version}
          </div>
        </div>
        <div class="ml-auto"></div>
        {#each tabs.filter((tab) => !tab.mobileOnly) as tab, idx}
          <a
            href={tab.path}
            data-sveltekit-preload-code
            data-sveltekit-preload-data
            class="text-xl"
            class:active={activeTabIndex === tabs.indexOf(tab)}
            bind:this={tabRefs[idx]}
            in:fly|global={{
              delay: (idx + 1) * 75,
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
        <div class="flex w-60 items-center justify-end gap-2">
          <a
            class="flex h-8 w-32 items-center justify-center gap-2 rounded-full border-2 border-blue-400 bg-white bg-opacity-0 transition-all hover:bg-opacity-10"
            href="/account"
            in:fly|global={{
              delay: 500,
              duration: 1000,
              opacity: 0,
              x: 20,
              easing: motion.transitions.spring(500, 15, 1.2)
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
            My Account
          </a>
          <a
            class="flex h-8 w-[100px] items-center justify-center gap-2 rounded-full border-2 border-blue-400 bg-white bg-opacity-0 transition-all hover:bg-opacity-10"
            href="/logout"
            in:fly|global={{
              delay: 300,
              duration: 1000,
              opacity: 0,
              x: 20,
              easing: motion.transitions.spring(500, 15, 1.2)
            }}
          >
            <Fa icon={faSignOut} />
            Log Out
          </a>
        </div>
        <div
          class="absolute bottom-1 h-[2px] rounded-full bg-white transition-all"
          style="width: {tabBarWidth}px; left: {(tabRefs[
            activeTabIndex
          ]?.getBoundingClientRect().left || 0) -
            (tabContainer?.getBoundingClientRect().left || 0) -
            windowWidth +
            windowWidth}px"
        ></div>
      </div>
    </div>
  {/if}

  {#key page.url}
    <div
      class="view-anim-{animationDirection} no-scroll flex w-full flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-10"
    >
      {@render children?.()}
    </div>
  {/key}
  {#if typeof window === "undefined" || windowWidth < 768}
    <div class="h-14 md:hidden {isIOS() ? 'pb-5' : ''}"></div>
    <div
      class="fixed bottom-0 left-0 right-0 flex w-full items-center justify-evenly rounded-t-2xl bg-slate-800 pb-2 pt-2 shadow-xl md:hidden"
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
          class="btn-circle relative h-10 w-10 border-2 border-slate-600 {idx ===
          activeTabIndex
            ? 'bg-blue-600 hover:bg-blue-600'
            : ''}"
        >
          {#if typeof tab.icon === "string"}
            <img
              src={tab.icon}
              alt=""
              class="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
            />
          {:else}
            <Fa
              icon={tab.icon}
              size="lg"
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          {/if}
        </a>
      {/each}
    </div>
  {/if}
  <!-- <Footer className="hidden md:flex" hideable /> -->
  <!-- PWA popup -->
  <div
    class="fixed bottom-0 left-0 right-0 top-0 {$prompt
      ? 'flex'
      : 'hidden'} items-center justify-center backdrop-blur-md"
  >
    <div
      class="flex flex-col items-center justify-center rounded-md bg-slate-800 p-10"
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
          class="btn-full btn-outlined border-blue-400 text-base"
          onclick={() => PWA.hidePrompt()}
        >
          No thanks
        </button>
      </div>
    </div>
  </div>
</main>
<img
  src={bgSrc}
  alt=""
  class="fixed left-1/2 top-1/2 -z-10 mb-12 h-[70vh] -translate-x-1/2 -translate-y-1/2 opacity-10 blur-xl md:mt-12"
/>

<style>
  .view-anim-left {
    view-transition-name: slide-in-out-left;
  }

  .view-anim-right {
    view-transition-name: slide-in-out-right;
  }
</style>
