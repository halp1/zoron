<script lang="ts">
  import { page } from "$app/stores";
  import { goto, onNavigate } from "$app/navigation";
  import Fa from "svelte-fa";
  import {
    faSignOut,
    faUser,
    type IconDefinition,
    faHome,
    faCalendar,
    faChartLine,
    faList
  } from "@fortawesome/free-solid-svg-icons";
  import { signOut } from "@auth/sveltekit/client";

  import "./home.css";
  import { onMount } from "svelte";
  import { PWA } from "$lib/web";
  import { Footer } from "$lib/components";

  interface Tab {
    name: string;
    path: string;
    icon: IconDefinition;
    mobileOnly?: boolean;
  }
  let windowWidth = 0;
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
    { name: "Account", path: "/account", icon: faUser, mobileOnly: true }
  ];

  $: activeTabIndex = $page.url?.pathname
    ? tabs.indexOf(
        [...tabs]
          .reverse()
          .find((tab) =>
            $page.url.pathname.includes(
              tab.path.slice(
                0,
                tab.path.indexOf("?") === -1 ? tab.path.length : tab.path.indexOf("?")
              )
            )
          )!
      )
    : 0;

  let tabContainer: HTMLDivElement | null = null;
  let tabRefs: HTMLAnchorElement[] = [];

  $: tabBarWidth = activeTabIndex === -1 ? 0 : tabRefs[activeTabIndex]?.offsetWidth || 0;

  let animationDirection: "left" | "right" | "none" = "none";

  onNavigate((navigation) => {
    if (!navigation.to?.url.pathname.includes("activity")) (window as any).loadingActivity = false;
    const from = tabs.indexOf(
      [...tabs].reverse().find((tab) => navigation.from?.url.pathname.includes(tab.path))!
    );
    const to = tabs.indexOf(
      [...tabs].reverse().find((tab) => navigation.to?.url.pathname.includes(tab.path))!
    );

    if (from !== -1 && to !== -1) {
      if (from < to) animationDirection = "right";
      else animationDirection = "left";
    } else animationDirection = "none";

    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document
        .startViewTransition(async () => {
          resolve();
          await navigation.complete;
        })
        .finished.then(() => (animationDirection = "none"));
    });
  });
  const prompt = PWA.prompt;
</script>

<svelte:head>
  <title>Schedule | A+spen</title>
</svelte:head>

<main class="activity-container flex h-screen w-full flex-col items-center justify-center">
  <div class="hidden md:block">
    <div class="h-12"></div>
    <div
      class="fixed left-0 top-0 z-10 flex h-12 w-full items-center gap-4 bg-slate-800 px-3 shadow-2xl"
      style="view-transition-name: header;"
      bind:this={tabContainer}
    >
      <div class="flex w-60 items-center text-3xl">
        <img src="/favicon.png" alt="Site Icon" class="h-8" />
        <div class="ml-2 font-bold">A+</div>
        <div>spen</div>
      </div>
      <div class="ml-auto"></div>
      {#each tabs.filter((tab) => !tab.mobileOnly) as tab, idx}
        <a
          href={tab.path}
          class="text-xl"
          class:active={activeTabIndex === tabs.indexOf(tab)}
          bind:this={tabRefs[idx]}
        >
          {tab.name}
        </a>
      {/each}
      <div class="mr-auto"></div>
      <div class="flex w-60 items-center justify-end gap-2">
        <a
          class="flex h-8 w-32 items-center justify-center gap-2 rounded-full border-2 border-blue-400 bg-white bg-opacity-0 transition-all hover:bg-opacity-10"
          href="/account"
        >
          <Fa icon={faUser} />
          My Account
        </a>
        <a
          class="flex h-8 w-[100px] items-center justify-center gap-2 rounded-full border-2 border-blue-400 bg-white bg-opacity-0 transition-all hover:bg-opacity-10"
          href="/logout"
        >
          <Fa icon={faSignOut} />
          Log Out
        </a>
      </div>
      <div
        class="absolute bottom-1 h-[2px] rounded-full bg-white transition-all"
        style="width: {tabBarWidth}px; left: {(tabRefs[activeTabIndex]?.getBoundingClientRect()
          .left || 0) -
          (tabContainer?.getBoundingClientRect().left || 0) -
          windowWidth +
          windowWidth}px"
      ></div>
    </div>
  </div>

  {#key $page.url}
    <div
      class="view-anim-{animationDirection} no-scroll flex w-full flex-1 flex-col gap-2 overflow-auto p-10"
    >
      <slot />
    </div>
  {/key}
  <div class="flex h-20 w-full items-center justify-evenly bg-slate-800 shadow-xl md:hidden">
    {#each tabs as tab}
      <a href={tab.path} class="flex w-20 flex-col items-center justify-center">
        <div class="rounded-full bg-white bg-opacity-10 p-3">
          <Fa icon={tab.icon} size="lg" />
        </div>
        <div class="text-center">{tab.name}</div>
      </a>
    {/each}
  </div>
  <!-- <Footer className="hidden md:flex" hideable /> -->
  <!-- PWA popup -->
  <div
    class="fixed bottom-0 left-0 right-0 top-0 {$prompt
      ? 'flex'
      : 'hidden'} items-center justify-center backdrop-blur-md"
  >
    <div class="flex flex-col items-center justify-center rounded-md bg-slate-800 p-10">
      <div class="mb-5 text-xl">Install A+spen?</div>
      <div class="text-center">
        You appear to be on a mobile device.
        <br />
        A+spen works better when installed as an app.
      </div>
      <div class="mt-3 flex items-center justify-center gap-3">
        <button
          class="btn-full btn-outlined border-green-400 text-base"
          on:click={() => {
            $prompt?.prompt();
            PWA.hidePrompt();
          }}
        >
          Install
        </button>
        <button
          class="btn-full btn-outlined border-blue-400 text-base"
          on:click={() => PWA.hidePrompt()}
        >
          No thanks
        </button>
      </div>
    </div>
  </div>
</main>

<style>
  .view-anim-left {
    view-transition-name: slide-in-out-left;
  }

  .view-anim-right {
    view-transition-name: slide-in-out-right;
  }
</style>
