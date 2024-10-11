<script lang="ts">
  import { page } from "$app/stores";
  import type { aspen } from "$lib/aspen";

  const data: Awaited<ReturnType<typeof aspen.activity>> = $page.data.activity;
</script>

<main class="flex h-screen w-full flex-col items-center justify-center py-10">
  <div class="mb-10 text-4xl">Activity</div>
  {#if data}
    <div
      class="no-scroll flex w-2/3 flex-1 flex-col gap-2 overflow-auto border-4 border-dashed border-slate-600 p-6"
    >
      {#each data.merged as item}
        <div class="flex items-center gap-3">
          {#if item.type === "grade"}
            <div class="border-x-4 border-x-slate-600 px-2">
              <span class="text-green-300">Grade</span> - {item.class}
            </div>
            {item.assignment}:
            <div class="flex h-8 items-center justify-center border-4 border-slate-600 px-2">
              {item.grade}
            </div>
            <div class="ml-auto text-slate-400">{item.date}</div>
          {:else}
            <div class="border-x-4 border-x-slate-600 px-2">
              <span class="text-green-300">Attendance</span> - {item.class}
            </div>

            <div class="">Period:</div>
            {item.period}
            <div class="">Code:</div>
            {item.code}

            <div class="ml-auto text-slate-400">{item.date}</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</main>
