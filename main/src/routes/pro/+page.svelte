<script lang="ts">
  import { fade } from "svelte/transition";

  import { onMount } from "svelte";

  import { goto } from "$app/navigation";

  import Footer from "@zoron/common/components/Footer.svelte";
  import { toast } from "@zoron/common/web";

  import Fa from "svelte-fa";

  import { faCheck, faWarning, faX } from "@fortawesome/free-solid-svg-icons";

  import { initBG } from "./bg";
  import { upgrade } from "./pro.remote";

  let canvas = $state<HTMLCanvasElement | null>(null);

  let upgraded = $state(false);

  onMount(() => {
    if (!canvas) return;

    const { destroy, enableMouse, disableMouse, pause, unpause, renderOnce } =
      initBG(canvas);

    disableMouse();
    renderOnce();

    return () => destroy();
  });
</script>

{#snippet detail(text: string)}
  <li class="flex items-center gap-4 text-green-400">
    <Fa icon={faCheck} size="lg" />
    <div class="text-lg text-white">{text}</div>
  </li>
{/snippet}

<main class="relative flex h-screen w-full flex-col">
  <div
    class="z-10 mx-2 mt-10 rounded-xl border-2 border-white p-4 text-center text-6xl backdrop-blur-sm md:mx-auto"
  >
    Upgrade your experience.
  </div>
  <div
    class="flex flex-col-reverse items-center justify-center gap-24 pt-8 pb-24 md:flex-row md:items-stretch md:pb-0"
  >
    <div
      class="z-10 flex w-96 flex-col overflow-y-auto rounded-3xl border-4 border-white p-10 backdrop-blur-sm"
    >
      <div class="text-center text-4xl">Zoron</div>
      <div
        class="mt-2 text-center text-xl text-green-400"
        style="text-shadow: 0 0 20px #4ade80;"
      >
        Free Forever
      </div>
      <ul class="mt-3">
        {@render detail("Instant schedule import")}
        {@render detail("See your daily classes")}
        {@render detail("View who's in your classes")}
        {@render detail("Share your schedule with friends")}
        <li class="flex items-center gap-4 text-red-400">
          <Fa icon={faX} size="lg" />
          <div class="text-lg text-white">Aspen integration</div>
        </li>
      </ul>
      <a class="btn-full btn-outlined mt-8 w-full md:mt-auto" href="/home">
        Continue without PRO
      </a>
    </div>
    <div
      class="z-10 w-96 rounded-3xl border-4 border-white p-10 backdrop-blur-sm"
      class:overflow-y-auto={!upgraded}
      class:overflow-visible={upgraded}
    >
      <div class="text-center text-4xl">
        Zoron <span class="shine-text" data-text="PRO">PRO</span>
      </div>
      <div
        class="mt-2 text-center text-xl text-green-400"
        style="text-shadow: 0 0 20px #4ade80;"
      >
        <span class="hidden md:inline">Also</span> Free Forever
      </div>

      <ul class="mt-3">
        {@render detail("Everything in normal Zoron")}
        {@render detail("Automatic schedule import")}
        {@render detail("Aspen activity notifications")}
        {@render detail("View all your grades on one page")}
        {@render detail("Automatic GPA calculation")}
        <li class="flex items-center gap-4 text-yellow-400">
          <Fa icon={faWarning} size="lg" />
          <div class="text-lg text-white">Requires Aspen credentials*</div>
        </li>
        <div class="mt-4 text-sm text-slate-300">
          * Zoron PRO hooks directly into MyFollet Aspen to load your schedule,
          transcript, activity, and grades. No data, apart from your schedule,
          is ever stored anywhere. Your credentials are encrypted against a
          private key stored only on your device, making it impossible for
          anyone to access your information.
        </div>
      </ul>

      <button
        class="btn-full btn-outlined theme-override mt-8 w-full border-yellow-200 transition-all"
        style="transition-duration: 2s"
        class:bg-yellow-200={upgraded}
        class:text-transparent={upgraded}
        class:hover:bg-yellow-200={upgraded}
        class:scale-[1000]={upgraded}
        onclick={() => {
          upgrade()
            .then(async () => {
              toast.success("Welcome to Zoron PRO! Upgrading your account...");
              document.querySelector("html")!.style.overflow = "visible";
              upgraded = true;
              await new Promise((r) => setTimeout(r, 2000));
              window.location.href = "https://pro.zoron.app";
            })
            .catch((e) => toast.error(e.message));
        }}
      >
        Switch Now
      </button>
    </div>
  </div>
  <canvas
    bind:this={canvas}
    class="absolute top-0 left-0 h-screen w-screen"
    style="opacity: 0"
  ></canvas>
</main>
{#if !upgraded}
  <Footer fixed className="z-20 bg-transparent backdrop-blur-sm" />
{/if}
