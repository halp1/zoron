<script lang="ts">
  import { page } from "$app/stores";
  import { PWA } from "$lib/web";
  import { changelog } from "../changelog/changelog";
  const name = $page.data?.session?.user?.name;
  const prompt = PWA.overridePrompt;
</script>

<svelte:head>
  <title>Home | {$page.data.env.name}</title>
</svelte:head>

<div class="flex h-full flex-col items-center pt-5">
  {#if name}
    <div class="text-center text-3xl">
      Hello, {name?.split(" ")[0]}.
    </div>
    <div class="mr-auto mt-5 text-2xl sm:mr-0">Announcements:</div>
    <div class="ml-2 mr-auto mt-2 text-slate-400 sm:mr-0">This feature is coming soon!</div>
    <div class="mt-5 w-full text-2xl sm:w-auto">
      Updates:

      <div class="px-auto mx-2 mt-2 max-h-80 w-full border-2 border-slate-600 py-3 px-1 sm:w-96">
        {#each changelog as update}
          <a
            class="flex items-center gap-3 rounded-full hover:bg-opacity-5 hover:bg-slate-50 px-2"
            href="/changelog#{update.version}"
          >
            <div class="border-r-2 border-slate-600 pr-2">
              {update.version}
            </div>
            <div class="ml-auto flex flex-wrap justify-end gap-2 text-lg">
              <div>
                {update.overview}
              </div>
              <div class="text-slate-400">{update.date}</div>
            </div>
          </a>
        {/each}
      </div>
    </div>
    {#if $prompt}
      <button
        class="btn-full btn-outlined mt-auto w-80 border-green-400 text-base"
        on:click={() => {
          $prompt?.prompt();
          PWA.hidePrompt();
        }}
      >
        Install {$page.data.env.name}
      </button>
    {/if}
  {:else}
    An error occurred.
  {/if}
</div>
