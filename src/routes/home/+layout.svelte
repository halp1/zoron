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

	import { onNavigate } from "$app/navigation";

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

<main class="activity-container flex h-screen w-full flex-col items-center justify-center py-10">
  <div
    class="title relative mb-10 flex items-center gap-4 border-x-2 border-dashed border-slate-600 px-3 text-3xl"
    bind:this={tabContainer}
  >
    {#each tabs as tab, idx}
      <a
        href={tab.path}
        class=""
        class:active={activeTabIndex === tabs.indexOf(tab)}
        bind:this={tabRefs[idx]}>{tab.name}</a
      >
    {/each}
    <div
      class="absolute -bottom-1 h-1 rounded-full bg-white transition-all"
      style="width: {tabBarWidth}px; left: {(tabRefs[activeTabIndex]?.getBoundingClientRect()
        .left || 0) - (tabContainer?.getBoundingClientRect().left || 0)}px"
    ></div>
  </div>

  <div
    class="view no-scroll flex w-5/6 flex-1 flex-col gap-2 overflow-auto border-4 border-dashed border-slate-600 p-6"
  >
    <slot />
  </div>
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