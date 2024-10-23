<script lang="ts">
  import { page } from "$app/stores";
  import type { aspen } from "$lib/aspen";
  import { Collapsible, Skeleton } from "$lib/components";
  import { faChevronRight, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
  import type { PageData } from "./$types";
  import Fa from "svelte-fa";
  import { requests, toast } from "$lib/web";
  import { onMount } from "svelte";

  import "./grades.css";

  interface Class extends aspen.Types.Class {
    expanded: boolean;
    data?: aspen.Types.ClassDetail;
    height: number;
  }

  const data: PageData["classes"] = $page.data.classes;
  const classes: Class[] | null =
    data?.classes?.map((c) => ({ ...c, expanded: false, height: -1 }) satisfies Class) ?? null;

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

  const calculateFinalGrade = (grades: aspen.Types.ClassDetail["grades"]) => {
    const grade = grades!;
    const terms: number[] = [];
    grade.categories[0].terms.forEach((_, idx) => {
      if (grade.posted[idx]) terms.push(grade.posted[idx].number);
      else if (grade.averages[idx]) terms.push(grade.averages[idx].number);
    });
    return terms.reduce((a, b) => a + b, 0) / terms.length;
  };

  // pre-load classes for tailwind
  ("grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6 grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10 grid-cols-11 grid-cols-12 border-b-0");
</script>

<svelte:head>
  <title>Grades | A+spen</title>
</svelte:head>

{#if classes}
  <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each classes as c}
      <div
        id="c-{c.id}"
        class="{c.expanded && c.data
          ? 'col-span-1 pt-1 md:col-span-2 lg:col-span-3 xl:col-span-4'
          : ''} class mb-auto border-2 border-slate-600 p-3"
				style="view-transition-name: class-{c.id}"
      >
        <div class={(c.expanded && c.data && "flex items-end") || ""}>
          <div>
            <div class="flex items-center">
              <button
                on:click={async () => {
                  if (!c.expanded) {
                    if (!c.data) {
                      c.expanded = true;
                      const data = await loadClassData(c);
                      document.startViewTransition(
                        () =>
                          new Promise((r) => {
                            c.data = data;
                            c.height = -1;
                            if (!c.data) c.expanded = false;
                            const interval = setInterval(() => {
                              if (document.querySelector(`#grades-${c.id}`)) {
                                c.height =
                                  // @ts-expect-error offsetheight blah blah
                                  document.querySelector(`#grades-${c.id}`)?.offsetHeight || 400;
                                clearInterval(interval);
                                // @ts-expect-error didn't put void
                                r();
                              }
                            }, 10);
                          })
                      );
                    } else {
                      document.startViewTransition(() => {
                        c.expanded = true;
                        return new Promise((r) => setTimeout(r, 130));
                      });
                    }
                  } else {
                    document.startViewTransition(() => {
                      c.expanded = false;
                      return new Promise((r) => setTimeout(r, 130));
                    });
                  }
                }}
                class="btn-circle"
                ><Fa
                  icon={faChevronRight}
                  class="transition-all {c.expanded ? 'rotate-90' : 'rotate-0'}"
                />
              </button>
              <div class="text-xl">{c.name}</div>
            </div>
            <div class="flex items-center">
              <div class="mr-2 border-r-2 border-slate-600 pr-2 text-sm text-slate-400">
                {c.course}
              </div>
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
            </div>
          </div>
          <div class="ml-auto flex {c.expanded && c.data ? 'items-center gap-4' : 'gap-0'}">
            <div
              class="flex justify-end border-slate-600 {c.expanded && c.data
                ? 'flex-row gap-5 border-l-0'
                : 'mt-auto flex-col border-l-2'}"
            >
              <div class="flex items-center gap-2 pl-2">
                Room: {#if c.room}
                  <div class="font-bold">{c.room}</div>
                {:else}
                  <div class="text-slate-400">(no room)</div>{/if}
              </div>
              {#if c.grade && !Number.isNaN(c.grade.number) && typeof c.grade.number === "number"}
                <div class="relative mx-2 mr-auto flex items-center text-xl">
                  {c.grade.number.toFixed(2)}: {c.grade.letter}
                  <div class="absolute bottom-0 h-[3px] w-full bg-slate-600" />
                </div>
              {:else}
                <div class="mx-2 text-slate-400">No grades available</div>
              {/if}
            </div>
            <div
              class="-mb-1 ml-auto flex flex-col items-end justify-center border-dashed border-slate-600 text-slate-400 {c.expanded &&
              c.data
                ? 'border-l-2 pl-2'
                : 'border-l-0 pl-0'}"
            >
              <div class="flex gap-2">
                <div class="font-bold">Absent:</div>
                {c.attendance.absent}
              </div>
              <div class="-mt-1 flex gap-2">
                <div class="font-bold">Tardy:</div>
                {c.attendance.tardy}
              </div>
              <div class="-mt-1 flex gap-2">
                <div class="font-bold">Dismissed:</div>
                {c.attendance.dismissed}
              </div>
            </div>
          </div>
        </div>
        <Collapsible open={c.expanded} key={c.data}>
          <div class="pt-2"></div>
          <div class="border-t-2 border-dashed border-slate-600"></div>
          <div class="pt-2"></div>

          {#if !c.data}
            <div class="mt-3 space-y-3">
              <Skeleton class="h-4 sm:w-80" />
              <Skeleton class="h-4 sm:w-96" />
              <Skeleton class="h-4 sm:w-60" />
              <Skeleton class="h-4 sm:w-72" />
            </div>
          {:else}
            <div class="flex gap-10 p-5">
              <div class="flex-1">
                {#if c.data.assignments.length > 0}
                  <div
                    class="custom-scroll flex flex-1 flex-col items-stretch overflow-auto border-2 border-slate-600"
                    style="max-height: {c.height === -1 ? 400 : c.height}px"
                  >
                    {#each c.data.assignments as assignment, idx}
                      <div
                        class="grid grid-cols-7 border-b-2 border-dashed border-slate-600 p-2"
                        style={idx === c.data.assignments.length - 1 ? "border: none" : ""}
                      >
                        <div
                          class="col-span-3 row-span-2 flex items-center justify-center border-r-2 border-dashed border-r-slate-600 pr-2 text-center"
                        >
                          {assignment.name}
                        </div>
                        <div
                          class="col-span-2 row-span-2 flex flex-col items-center justify-center text-right"
                        >
                          <div>{assignment.due}</div>
                          <!-- {#if "weight" in assignment && assignment.weight !== undefined} -->
                          <div class="text-slate-400">
                            Weight: <span class="font-bold"
                              >{typeof assignment.weight === "undefined"
                                ? 1
                                : assignment.weight}</span
                            >
                          </div>
                          <!-- {/if} -->
                        </div>
                        {#if assignment.score}
                          <div class="col-span-2 flex items-center justify-end gap-1">
                            <div class="font-bold">{assignment.score.scored}</div>
                            <div>/</div>
                            <div class="font-bold">{assignment.score.total}</div>
                          </div>
                          <div
                            class="relative col-span-2 border-2 border-dashed border-slate-600 text-transparent"
                          >
                            .
                            <div
                              class="absolute left-0 top-0 h-full bg-green-400 bg-opacity-80"
                              style="width: {assignment.score.percentage}%"
                            ></div>
                            <div
                              class="absolute right-0 top-1/2 z-10 -translate-y-1/2 font-bold text-white"
                            >
                              {assignment.score.percentage}%
                            </div>
                          </div>
                        {:else}
                          <div
                            class="col-span-2 row-span-2 flex items-center justify-center text-slate-400"
                          >
                            No score available
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="flex flex-1 items-center justify-center py-5 text-slate-400">
                    You don't have any assignemnts in this class yet...
                  </div>
                {/if}
              </div>
              {#if c.data.grades}
                <div
                  id="grades-{c.id}"
                  class="relative mb-auto grid flex-1 border-2 border-slate-600 grid-cols-{c.data
                    .grades.categories[0].terms.length *
                    2 +
                    3}"
                >
                  <div
                    class="col-span-3 flex items-center justify-center border-b-2 border-dashed border-slate-600 px-2 py-1 text-center"
                  >
                    Category
                  </div>
                  {#each c.data.grades.categories[0].terms as _, idx}
                    <div
                      class="col-span-2 flex justify-center border-b-2 border-l-2 border-dashed border-slate-600 px-2 py-1 text-center"
                    >
                      Term {idx + 1}
                    </div>
                  {/each}
                  {#each c.data.grades.categories as grade}
                    <div
                      class="col-span-3 row-span-2 flex items-center justify-center overflow-hidden border-b-2 border-dashed border-slate-600 px-2 py-1 text-center capitalize"
                      style="overflow-wrap: break-word; word-break: break-word"
                    >
                      {grade.name}
                    </div>
                    {#each grade.terms as term}
                      <div
                        class="col-span-2 flex justify-center border-b-2 border-l-2 border-dashed border-slate-600 bg-slate-800 px-2 py-1 text-center"
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
                        class="col-span-2 flex flex-wrap justify-center border-b-2 border-l-2 border-dashed border-slate-600 bg-opacity-50 px-2 py-1 text-center text-sm xl:text-base"
                        style={(!term.grade &&
                          "background: repeating-linear-gradient(45deg, rgb(71 85 105 / var(--tw-bg-opacity)), rgb(71 85 105 / var(--tw-bg-opacity)) 2px, transparent 2px, transparent 10px); background-position: 0 0; background-size: 100% 100%;") ||
                          ""}
                      >
                        {#if term.grade}
                          {term.grade.number.toFixed(2)}
                          <div class="ml-1">({term.grade.letter})</div>
                        {:else}
                          <div class="select-none text-transparent">.</div>
                        {/if}
                      </div>
                    {/each}
                  {/each}
                  <div
                    class="col-span-3 flex items-center justify-center overflow-hidden border-b-2 border-dashed border-slate-600 px-2 py-1 text-center"
                    style="overflow-wrap: break-word; word-break: break-word"
                  >
                    Quarterly average
                  </div>
                  {#each c.data.grades.averages as avg}
                    <div
                      class="col-span-2 flex flex-wrap justify-center border-b-2 border-l-2 border-dashed border-slate-600 bg-slate-800 px-2 py-1 text-center text-sm xl:text-base"
                      style={(!avg &&
                        "background: repeating-linear-gradient(45deg, rgb(100 116 139 / .5), rgb(100 116 139 / .5) 2px, #1e293b 2px, #1e293b 10px); background-position: 0 0; background-size: 100% 100%;") ||
                        ""}
                    >
                      {#if avg}
                        {avg.number.toFixed(2)}
                        <div class="ml-1">({avg.letter})</div>
                      {:else}
                        <div class="select-none text-transparent">.</div>
                      {/if}
                    </div>
                  {/each}
                  <div
                    class="col-span-3 flex items-center justify-center overflow-hidden border-b-2 border-dashed border-slate-600 px-2 py-1 text-center"
                    style="overflow-wrap: break-word; word-break: break-word"
                  >
                    Posted grade
                  </div>
                  {#each c.data.grades.posted as grade}
                    <div
                      class="col-span-2 flex flex-wrap justify-center border-b-2 border-l-2 border-dashed border-slate-600 bg-slate-800 px-2 py-1 text-center text-sm xl:text-base {!grade &&
                        'bg-opacity-50'}"
                      style={(!grade &&
                        "background: repeating-linear-gradient(45deg, rgb(71 85 105 / var(--tw-bg-opacity)), rgb(71 85 105 / var(--tw-bg-opacity)) 2px, transparent 2px, transparent 10px); background-position: 0 0; background-size: 100% 100%;") ||
                        ""}
                    >
                      {#if grade}
                        {grade.number.toFixed(2)}
                        <div class="ml-1">({grade.letter})</div>
                      {:else}
                        <div class="select-none text-transparent">.</div>
                      {/if}
                    </div>
                  {/each}
                  <div
                    class="col-span-3 flex items-center justify-center overflow-hidden border-b-2 border-dashed border-slate-600 px-2 py-1 text-center"
                    style="overflow-wrap: break-word; word-break: break-word"
                  >
                    Final grade
                  </div>
                  <div
                    class="relative flex justify-center border-b-2 border-l-2 border-dashed border-slate-600 bg-slate-800 px-2 py-1 text-center"
                    style="grid-column: span {c.data.grades.categories[0].terms.length *
                      2} / span {c.data.grades.categories[0].terms.length * 2};"
                  >
                    {#if c.data.grades.final}
                      {c.data.grades.final.number.toFixed(2)}
                      <div class="ml-1">({c.data.grades.final.letter})</div>
                    {:else}
                      {calculateFinalGrade(c.data.grades).toFixed(2)}
                      <Fa
                        icon={faQuestionCircle}
                        class="absolute right-2 top-1/2 -translate-y-1/2 cursor-help"
                        title="This grade is calculated as an average of all terms. It may not accurately represent your final grade."
                      />
                    {/if}
                  </div>
                </div>
              {:else}
                <div class="flex flex-1 items-center justify-center py-5 text-slate-400">
                  This class doesn't appear to have any grades...
                </div>{/if}
            </div>
          {/if}
        </Collapsible>
      </div>
    {/each}
  </div>
{/if}
