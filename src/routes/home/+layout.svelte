<script lang="ts">
  import { page } from "$app/stores";

  const tabs = [
    { name: "Home", path: "/home" },
    { name: "Schedule", path: "/home/schedule" },
    { name: "Grades", path: "/home/grades" },
    { name: "Activity", path: "/home/activity" }
  ];

  $: activeTabIndex = tabs.indexOf(
    [...tabs].reverse().find((tab) => $page.url.pathname.includes(tab.path))!
  );

  let tabContainer: HTMLDivElement | null = null;
  let tabRefs: HTMLAnchorElement[] = [];

  $: tabBarWidth = activeTabIndex === -1 ? 0 : tabRefs[activeTabIndex]?.offsetWidth || 0;

  import { goto, onNavigate } from "$app/navigation";
  import Fa from "svelte-fa";
  import { faSignOut } from "@fortawesome/free-solid-svg-icons";
  import { signOut } from "@auth/sveltekit/client";

  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<main class="activity-container flex h-screen w-full flex-col items-center justify-center">
  <div
    class="title relative mb-10 flex h-12 w-full items-center gap-4 bg-slate-800 px-3 shadow-lg"
    bind:this={tabContainer}
  >
    <div class="flex w-60 items-center text-3xl">
      <img src="/favicon.png" alt="Site Icon" class="h-8" />
      <div class="ml-2 font-bold">A+</div>
      <div>spen</div>
    </div>
    <div class="ml-auto"></div>
    {#each tabs as tab, idx}
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
      <button
        class="flex h-8 w-32 items-center justify-center gap-2 rounded-full border-2 border-blue-400 bg-white bg-opacity-0 transition-all hover:bg-opacity-10"
        on:click={() => goto("/account")}
      >
        <Fa icon={faSignOut} />
        My Account
      </button>
      <button
        class="flex h-8 w-[100px] items-center justify-center gap-2 rounded-full border-2 border-blue-400 bg-white bg-opacity-0 transition-all hover:bg-opacity-10"
        on:click={() => signOut({ callbackUrl: "/", redirect: true })}
      >
        <Fa icon={faSignOut} />
        Log Out
      </button>
    </div>
    <div
      class="absolute bottom-1 h-[2px] rounded-full bg-white transition-all"
      style="width: {tabBarWidth}px; left: {(tabRefs[activeTabIndex]?.getBoundingClientRect()
        .left || 0) - (tabContainer?.getBoundingClientRect().left || 0)}px"
    ></div>
  </div>

  {#key $page.url}
    <div class="view no-scroll flex w-full flex-1 flex-col gap-2 overflow-auto px-10 pb-10">
      <slot />
    </div>
  {/key}
</main>

<style>
  .view {
    view-transition-name: slide-in-out;
  }

  @keyframes slide-in {
    0% {
      transform: translateX(100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slide-out {
    0% {
      transform: translateX(0);
      opacity: 1;
    }
    100% {
      transform: translateX(-100%);
      opacity: 0;
    }
  }

  ::view-transition-new(slide-in-out) {
    animation: slide-in 0.3s ease-out;
  }
  ::view-transition-old(slide-in-out) {
    animation: slide-out 0.3s ease-out;
  }
</style>
