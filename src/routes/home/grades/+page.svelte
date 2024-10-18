<script lang="ts">
  import { page } from "$app/stores";
  import type { aspen } from "$lib/aspen";
  import { Collapsible, Skeleton } from "$lib/components";
  import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
  import type { PageData } from "./$types";
  import Fa from "svelte-fa";
  import { requests, toast } from "$lib/web";

  interface Class extends aspen.Types.Class {
    expanded: boolean;
    data?: any;
  }

  const data: PageData["classes"] = $page.data.classes;
  const classes: Class[] | null =
    data?.classes?.map((c) => ({ ...c, expanded: false }) satisfies Class) ?? null;
</script>

{#if classes}
  {#each classes as c}
    <div class="border-2 border-slate-600 p-3">
      <div class="flex items-center gap-2">
        <button
          on:click={async () => {
            c.expanded = !c.expanded;
            const res = await requests.post("/api/aspen/class", {
              classID: c.id
            });

            if (res.success) {
              c.data = res.data;
            } else toast.error("An error occurred while fetching class data: " + res.error);
          }}
          class="btn-circle"
          ><Fa
            icon={faChevronRight}
            class="transition-all {c.expanded ? 'rotate-90' : 'rotate-0'}"
          />
        </button>
        <div class="border-r-2 border-slate-600 pr-2 text-xl">{c.name}</div>
        <div class="border-r-2 border-slate-600 pr-2 text-slate-400">{c.course}</div>
        <div class="">
          {#if c.teachers.length === 1}
            {c.teachers[0].first} {c.teachers[0].last}
          {:else}
            {#each c.teachers.slice(0, c.teachers.length - 1) as teacher}
              {teacher.first}
              {teacher.last}{#if c.teachers.length > 2},{/if}
            {/each}
            and
            {c.teachers.at(-1)?.first}
            {c.teachers.at(-1)?.last}
          {/if}
        </div>
        <div class="flex items-center gap-2 border-l-2 border-slate-600 pl-2">
          Room: <div class="font-bold">{c.room}</div>
        </div>
        <div class="ml-auto"></div>
        {#if c.grade && !Number.isNaN(c.grade.points) && typeof c.grade.points === "number"}
          <div class="relative mx-2 flex items-center text-xl">
            {c.grade?.points}: {c.grade.letter}
            <div class="absolute bottom-0 h-1 w-full bg-slate-600" />
          </div>
        {:else}
          <div class="mx-2 text-slate-400">No grades available</div>
        {/if}
        <div class="flex items-center gap-3 text-slate-400">
          <div class="flex gap-2">
            <div class="font-bold">Absent:</div>
            {c.attendance.absent}
          </div>
          <div class="flex gap-2">
            <div class="font-bold">Tardy:</div>
            {c.attendance.tardy}
          </div>
          <div class="flex gap-2">
            <div class="font-bold">Dismissed:</div>
            {c.attendance.dismissed}
          </div>
        </div>
      </div>
      <Collapsible open={c.expanded}>
        <div class="pt-3"></div>
        {#if !c.data}
          <div class="space-y-3">
            <Skeleton class="h-4 sm:w-80" />
            <Skeleton class="h-4 sm:w-96" />
            <Skeleton class="h-4 sm:w-60" />
            <Skeleton class="h-4 sm:w-72" />
          </div>
        {:else}
          yay!
        {/if}
      </Collapsible>
    </div>
  {/each}
{/if}
