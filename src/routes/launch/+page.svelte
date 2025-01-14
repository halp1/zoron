<script lang="ts">
  import { type AppState, zoron } from "$lib/web";
  import { motion } from "$lib/motion";
  import { requests, toast } from "$lib/web";
  import { onMount } from "svelte";
  import { scale } from "svelte/transition";
  import { goto } from "$app/navigation";
    import { page } from "$app/state";

  let loaded = false;

  onMount(() => {
    loaded = true;
    (async () => {
      try {
        const res = await requests.get<AppState>("/api/home/launch");
        if (res.success === false) toast.error(res.error);
        else {
          zoron.set(res.data);
          const target = (
            new URLSearchParams(window.location.search).get("path") || "/home"
          ).replaceAll("/__data.json", "");
          goto(target);
        }
      } catch (e) {
        toast.error(`Error loading launch data: ${e}`);
      }
    })();
  });
</script>

<svelte:head>
	<title>{page.data.env.name}</title>
</svelte:head>

<main class="flex h-screen w-full items-center justify-center">
  {#if loaded}
    <div
      class="relative h-48 w-48"
      in:scale|global={{
        duration: 1000,
        opacity: 0,
        start: 0,
        easing: motion.transitions.spring(400, 20)
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class=" animate-spin">
        <g fill="none" stroke="white" stroke-width="10" stroke-linecap="round">
          <path d="M 100,30 A 70,70 0 1,1 30,100" stroke-dasharray="0,330" stroke-dashoffset="0">
            <animate
              attributeName="stroke-dasharray"
              from="0,330"
              to="330,330"
              dur=".6s"
              fill="freeze"
            />
          </path>
        </g>
      </svg>
      <img
        src="/favicon.png"
        class="absolute left-1/2 top-1/2 h-24 -translate-x-1/2 -translate-y-1/2"
        alt="site icon"
      />
    </div>
  {/if}
</main>
