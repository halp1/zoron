<script>
  import { fly } from "svelte/transition";

  import { page } from "$app/state";

  import { motion } from "$lib/motion";

  import Fa from "svelte-fa";

  import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

  import { changelog } from "./changelog";
</script>

<svelte:head>
  <title>Changelog | {page.data.env.name}</title>
</svelte:head>
<button
  onclick={() => window.history.back()}
  class="btn-circle fixed left-4 top-4"
  ><Fa icon={faArrowLeft} size="lg" /></button
>
<div class="mx-auto my-10 max-w-[800px]">
  <h1
    class="mb-4 text-center text-4xl"
    in:fly|global={{
      delay: 0,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
  >
    Changelog
  </h1>
  <div class="flex flex-col space-y-4">
    {#each changelog as entry, idx}
      <div
        class="space-y-2 rounded-xl bg-slate-700 p-5"
        id={entry.version}
        in:fly|global={{
          delay: 100 * (idx + 1),
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }}
      >
        <div class="flex justify-between">
          <h2 class="text-2xl">Version {entry.version} - {entry.overview}</h2>
          <p class="text-slate-400">{entry.date}</p>
        </div>
        {#if entry.changes.length}<div>
            <div class="text-lg">Updates:</div>
            <div class="ml-4">
              <ul class="list-inside list-disc">
                {#each entry.changes as change}
                  <li class="pl-[1.5em]" style="text-indent: -1.5em;">
                    {change}
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}
        {#if entry.bugfixes.length}<div>
            <div class="text-lg">Bugfixes:</div>
            <div class="ml-4">
              <ul class="list-inside list-disc">
                {#each entry.bugfixes as bugfix}
                  <li>{bugfix}</li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
