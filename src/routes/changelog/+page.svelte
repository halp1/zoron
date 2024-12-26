<script>
  import { changelog } from "./changelog";
</script>

<div class="mx-auto my-10 max-w-[800px]">
  <h1 class="mb-4 text-center text-4xl">Changelog</h1>
  <div class="flex flex-col space-y-4">
    {#each changelog as entry}
      <div class="space-y-2 rounded-xl bg-slate-700 p-5" id={entry.version}>
        <div class="flex justify-between">
          <h2 class="text-2xl">Version {entry.version} - {entry.overview}</h2>
          <p class="text-slate-400">{entry.date}</p>
        </div>
        {#if entry.changes.length}<div>
            <div class="text-lg">Updates:</div>
            <div class="ml-4">
              <ul class="list-inside list-disc">
                {#each entry.changes as change}
                  <li class="pl-[1.5em]" style="text-indent: -1.5em;">{change}</li>
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
