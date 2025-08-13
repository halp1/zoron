<script lang="ts">
  import { onMount } from "svelte";

  import Fa from "svelte-fa";

  import { faCheck, faWarning, faX } from "@fortawesome/free-solid-svg-icons";

  import { initBG } from "./bg";

  let canvas = $state<HTMLCanvasElement | null>(null);

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
    class="z-10 mx-auto mt-10 rounded-xl border border-slate-400 p-4 text-center text-6xl backdrop-blur-xl"
  >
    Upgrade your experience.
  </div>
  <div class="flex justify-center gap-24 pt-8">
    <div
      class="z-10 flex w-96 flex-col rounded-3xl border-4 border-white p-10 backdrop-blur-xl"
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
      <a class="btn-full btn-outlined mt-auto w-full" href="/home">
        Continue without PRO
      </a>
    </div>
    <div
      class="z-10 w-96 rounded-3xl border-4 border-white p-10 backdrop-blur-xl"
    >
      <div class="text-center text-4xl">
        Zoron <span class="shine-text" data-text="PRO">PRO</span>
      </div>
      <div
        class="mt-2 text-center text-xl text-green-400"
        style="text-shadow: 0 0 20px #4ade80;"
      >
        Also Free Forever
      </div>

      <ul class="mt-3">
        {@render detail("Automatic schedule import")}
        {@render detail("See your daily classes")}
        {@render detail("View who's in your classes")}
        {@render detail("Share your schedule with friends")}
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
        class="btn-full btn-outlined theme-override mt-8 w-full border-yellow-200"
        >Switch Now</button
      >
    </div>
  </div>
  <canvas bind:this={canvas} class="absolute left-0 top-0 h-screen w-screen"
  ></canvas>
</main>
