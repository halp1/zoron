<script lang="ts">
  import { fade, fly } from "svelte/transition";

  import { toast } from "@zoron/common/web";

  import Fa from "svelte-fa";

  import {
    faCalendar,
    faClose,
    faDownload
  } from "@fortawesome/free-solid-svg-icons";

  import html2canvas from "html2canvas-pro";

  import { motion } from "../../motion";

  interface Props {
    open: boolean;
    imageSchedule: HTMLDivElement;
  }

  let { open = $bindable(), imageSchedule }: Props = $props();

  const getImageSchedule = () =>
    html2canvas(imageSchedule).then((canvas) => canvas.toDataURL("image/png"));
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed bottom-0 left-0 right-0 top-0 z-20 grid place-items-center bg-black/50 backdrop-blur-md"
    onclick={({ currentTarget, target }) => {
      if (currentTarget === target) {
        open = false;
      }
    }}
    transition:fade
  >
    <div
      class="relative flex flex-col items-center rounded-lg border-2 border-white bg-black p-5"
      transition:fly|global={{
        delay: 0,
        duration: 1000,
        opacity: 0,
        y: -100,
        easing: motion.transitions.spring(400, 20)
      }}
    >
      <button
        class="btn-circle absolute right-2 top-2"
        onclick={() => {
          open = false;
        }}><Fa icon={faClose} /></button
      >
      <div class="text-2xl">Export Calendar</div>
      <div class="text-sm text-slate-400">
        Use this calendar on other sites, imported automatically.
      </div>

      <div
        class="btn-full btn-outlined mt-4 flex h-10 w-60 items-stretch p-0 py-0 text-base hover:bg-transparent"
      >
        <button
          class="flex flex-1 cursor-pointer items-center justify-center border-r-2 border-white hover:bg-white/10"
          onclick={async () => {
            const image = await getImageSchedule();

            if (
              navigator.share &&
              navigator.canShare &&
              navigator.canShare({ files: [new File([], "test")] })
            ) {
              const blob = await fetch(image).then((res) => res.blob());
              const file = new File([blob], "schedule.png", {
                type: "image/png"
              });

              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: "My Schedule",
                  files: [file]
                });
                return;
              }
            }
          }}
        >
          Share image
        </button>
        <button
          class="-ml-4 flex w-10 cursor-pointer items-center justify-center hover:bg-white/10"
          onclick={async () => {
            const image = await getImageSchedule();

            const link = document.createElement("a");
            link.download = "schedule.png";
            link.href = image;
            link.click();
          }}
        >
          <Fa icon={faDownload} />
        </button>
      </div>
      <button
        class="btn-full btn-outlined mt-4 flex h-10 w-60 cursor-pointer items-center gap-2 p-0 py-0 text-base hover:bg-transparent"
        onclick={() => {
          toast.error("This feature is coming soon!");
        }}
      >
        <Fa icon={faCalendar} class="-mt-0.5" />
        Export to Calendar
      </button>
    </div>
  </div>
{/if}
