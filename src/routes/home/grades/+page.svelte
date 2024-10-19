<script lang="ts">
  import { page } from "$app/stores";
  import type { aspen } from "$lib/aspen";
  import { Collapsible, Skeleton } from "$lib/components";
  import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
  import type { PageData } from "./$types";
  import Fa from "svelte-fa";
  import { requests, toast } from "$lib/web";
  import { onMount } from "svelte";

  interface Class extends aspen.Types.Class {
    expanded: boolean;
    data?: aspen.Types.ClassDetail;
  }

  const data: PageData["classes"] = $page.data.classes;
  const classes: Class[] | null =
    data?.classes?.map((c) => ({ ...c, expanded: false }) satisfies Class) ?? null;

  const loadClassData = async (c: Class) => {
    const res = await requests.post<aspen.Types.ClassDetail>("/api/aspen/class", {
      classID: c.id
    });

    if (!res.success) toast.error("An error occurred while fetching class data: " + res.error);
    return "data" in res ? res.data : undefined;
  };

  let started = false;
  onMount(() => {
    const name = decodeURIComponent(location.hash).replaceAll("#", "");
    if (!name || name.length === 0 || !classes) return;
    const c = classes.find((c) => c.name.trim() === name.trim());
    if (!c) return toast.error(`Class "${name}" does not exist`);
    (async () => {
      classes[classes.indexOf(c)].expanded = true;
      const element = document.querySelector(`#c-${c.id}`);
      if (!element) return toast.error("An error occured");
      setTimeout(
        () =>
          element?.parentElement?.scrollTo({
            top: element.getBoundingClientRect().top - 20,
            behavior: "smooth"
          }),
        100
      );

      const data = await loadClassData(c);
      classes[classes.indexOf(c)].data = data;
      setTimeout(
        () =>
          element?.parentElement?.scrollTo({
            top: element.getBoundingClientRect().top - 20,
            behavior: "smooth"
          }),
        300
      );
      history.replaceState({}, "", location.href.split("#")[0]);
    })();
  });

  // pre-load classes for tailwind
  ("grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6 grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10 grid-cols-11 grid-cols-12 border-b-0");
</script>

{#if classes}
  {#each classes as c}
    <div id="c-{c.id}" class="border-2 border-slate-600 p-3">
      <div class="flex items-center gap-2">
        <!-- svelte-ignore missing-declaration -->
        <button
          on:click={async () => {
            c.expanded = !c.expanded;
            if (c.expanded && !c.data) {
              c.data = await loadClassData(c);
              if (!c.data) c.expanded = false;
            }
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
          Room: {#if c.room}
            <div class="font-bold">{c.room}</div>
          {:else}
            <div class="text-slate-400">(no room)</div>{/if}
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
      <Collapsible open={c.expanded} key={c.data}>
        <div class="pt-2"></div>
        <div class="border-t-2 border-dashed border-slate-600"></div>
        <div class="pt-2"></div>

        {#if !c.data}
          <div class="space-y-3 mt-3">
            <Skeleton class="h-4 sm:w-80" />
            <Skeleton class="h-4 sm:w-96" />
            <Skeleton class="h-4 sm:w-60" />
            <Skeleton class="h-4 sm:w-72" />
          </div>
        {:else}
          <div class="flex gap-10 p-5">
            <div class="flex-1">Something is coming here soon...</div>
            <div
              class="relative grid flex-1 border-2 border-slate-600 grid-cols-{c.data.grades[0]
                .terms.length *
                2 +
                3}"
            >
              <div
                class="col-span-3 flex items-center justify-center border-b-2 border-dashed border-slate-600 p-2 text-center"
              >
                Category
              </div>
              {#each c.data.grades[0].terms as _, idx}
                <div
                  class="col-span-2 flex justify-center border-b-2 border-l-2 border-dashed border-slate-600 p-2 text-center"
                >
                  Term {idx + 1}
                </div>
              {/each}
              {#each c.data.grades as grade}
                <div
                  class="col-span-3 row-span-2 flex items-center justify-center overflow-hidden border-b-2 border-dashed border-slate-600 p-2 text-center"
                  style="overflow-wrap: break-word; word-break: break-word"
                >
                  {grade.name}
                </div>
                {#each grade.terms as term}
                  <div
                    class="col-span-2 flex justify-center border-b-2 border-l-2 border-dashed border-slate-600 bg-slate-800 p-2 text-center"
                  >
                    {#if term.weight}
                      {term.weight}%
                    {:else}
                      N/A
                    {/if}
                  </div>
                {/each}
                {#each grade.terms as term}
                  <div
                    class="col-span-2 flex justify-center border-b-2 border-l-2 border-dashed border-slate-600 bg-opacity-50 p-2 text-center"
                    style={(!term.grade &&
                      "background: repeating-linear-gradient(45deg, rgb(71 85 105 / var(--tw-bg-opacity)), rgb(71 85 105 / var(--tw-bg-opacity)) 2px, transparent 2px, transparent 10px); background-position: 0 0; background-size: 100% 100%;") ||
                      ""}
                  >
                    {#if term.grade}
                      {term.grade.number}
                      <div class="ml-1">({term.grade.letter})</div>
                    {:else}
                      <div class="select-none text-transparent">.</div>
                    {/if}
                  </div>
                {/each}
              {/each}
            </div>
          </div>
        {/if}
      </Collapsible>
    </div>
  {/each}
{/if}
