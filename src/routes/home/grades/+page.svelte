<script lang="ts">
  import { writable } from "svelte/store";
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import type { aspen } from "$lib/aspen";
  import { Collapsible, ListSelect, Skeleton } from "$lib/components";
  import { motion } from "$lib/motion";
  import { requests, toast, zoron } from "$lib/web";

  import Fa from "svelte-fa";

  import {
    faChevronRight,
    faQuestionCircle
  } from "@fortawesome/free-solid-svg-icons";

  interface Class extends aspen.Types.Class {
    expanded: boolean;
    data?: aspen.Types.ClassDetail;
    credit?: number;
    height: number;
  }

  let classes: Class[] | null = $state(
    $zoron.classes.map(
      (c) =>
        ({
          ...c,
          expanded: false,
          height: -1,
          credit: $zoron.schedule?.schedule?.find((a) => a?.course === c.course)
            ?.credit
        }) satisfies Class
    ) as Class[] | null
  );

  const loadClassData = async (c: Class) => {
    const res = await requests.post<aspen.Types.ClassDetail>(
      "/api/aspen/class",
      {
        classID: c.id,
        assignments: {
          term: 0
        }
      }
    );

    if (!res.success)
      toast.error("An error occurred while fetching class data: " + res.error);
    return "data" in res ? res.data : undefined;
  };

  onMount(() => {
    (async () => {
      // const res = await $zoron.classes;
      // data = res;
      setTimeout(async () => {
        const name = decodeURIComponent(location.hash).replaceAll("#", "");
        if (!name || name.length === 0 || !classes) return;
        const c = classes.find((c) => c.name.trim() === name.trim());
        if (!c) return toast.error(`Class "${name}" does not exist`);

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

        const d = await loadClassData(c);
        classes[classes.indexOf(c)].data = d;
        setTimeout(
          () =>
            element?.parentElement?.scrollTo({
              top: element.getBoundingClientRect().top - 20,
              behavior: "smooth"
            }),
          300
        );
        history.replaceState({}, "", location.href.split("#")[0]);
      }, 100);
    })();
  });

  const loadTerm = async (options: aspen.Types.ClassOptions) => {
    const res = await requests.post<{ classes: aspen.Types.Class[] }>(
      "/api/aspen/classes",
      options
    );
    if (!res.success)
      return toast.error(
        "An error occurred while fetching grade data: " + res.error
      );
    classes = res.data.classes.map(
      (c) =>
        ({
          ...c,
          expanded: false,
          height: -1,
          credit: $zoron.schedule?.schedule?.find((a) => a?.course === c.course)
            ?.credit
        }) satisfies Class
    );
  };

  let classQuery = writable<aspen.Types.ClassOptions>({
    year: "current",
    term: 0
  });

  onMount(() => {
    let init = false;
    const unsubscribe = classQuery.subscribe(async (query) => {
      if (!init) {
        init = true;
        return;
      }
      if (query.year === "current" && query.term === 0) {
        classes = $zoron.classes.map(
          (c) =>
            ({
              ...c,
              expanded: false,
              height: -1,
              credit: $zoron.schedule?.schedule?.find(
                (a) => a?.course === c.course
              )?.credit
            }) satisfies Class
        );
        return;
      }
      if (query.year === "previous" && query.term === 0) {
        return classQuery.set({ year: "previous", term: 1 });
      }
      classes = null;
      await loadTerm(query);
    });

    return unsubscribe;
  });

  let loaded = $state(false);

  onMount(() => {
    const items = classes?.map((c) => `class-${c.id}`);

    const style = document.createElement("style");
    style.innerHTML = `${items?.map((item) => `::view-transition-group(${item})`).join(", ")} {
      animation-timing-function: ease-in;
      animation-duration: 0.3s;
    }
    ::view-transition-image-pair(*) {
      isolation: auto;
    }`;
    document.head.appendChild(style);
    setTimeout(() => (loaded = true), 100);
    return () => style.remove();
  });

  const calculateFinalGrade = (grades: aspen.Types.ClassDetail["grades"]) => {
    const grade = grades!;
    const terms: number[] = [];
    grade.categories[0].terms.forEach((_, idx) => {
      if (grade.posted[idx]) terms.push(grade.posted[idx].number);
      else if (grade.averages[idx]) terms.push(grade.averages[idx].number);
    });
    return (
      terms
        .map((term) => (term <= 9 ? convertMathScore(term) : term))
        .reduce((a, b) => a + b, 0) / terms.length
    );
  };

  const useLinearGradient = false;

  const individualGPA = (letter?: string) => {
    switch (letter) {
      case "A+":
        return 4.33;
      case "A":
        return 4.0;
      case "A-":
        return 3.67;
      case "B+":
        return 3.33;
      case "B":
        return 3.0;
      case "B-":
        return 2.67;
      case "C+":
        return 2.33;
      case "C":
        return 2.0;
      case "C-":
        return 1.67;
      case "D+":
        return 1.33;
      case "D":
        return 1.0;
      case "D-":
        return 0.67;
      case "F":
        return 0.0;
      default:
        return null;
    }
  };

  const calculateGPA = (
    grades: { grade?: aspen.Types.Grade; courseID: string; credit?: number }[]
  ) =>
    grades
      .map((grade) => ({
        gpa: individualGPA(grade?.grade?.letter)!,
        weight: grade.credit!
      }))
      .filter((g) => g.weight && g.gpa !== null)
      .reduce(
        (a, b, _, arr) =>
          a + (b.gpa * b.weight) / arr.reduce((a, b) => a + b.weight, 0),
        0
      );

  const convertMathScore = (score: number) =>
    Math.min(
      100,
      Math.max(
        0,
        0.000892691 * Math.pow(score, 4) -
          0.000714091 * Math.pow(score, 3) -
          0.145062 * Math.pow(score, 2) +
          5.71381 * score +
          55
      )
    );

  const preloadLength =
    (page.data.session?.user?.schedule?.schedule?.reduce(
      (prev, cur) =>
        !prev.find((item) => cur === null || item?.course === cur?.course)
          ? [...prev, cur]
          : prev,
      [] as (aspen.Types.Schedule.Course | null)[]
    ).length || 8) + 1;

  // pre-load classes for tailwind
  ("grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6 grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10 grid-cols-11 grid-cols-12 border-b-0");
</script>

<svelte:head>
  <title>Grades | {page.data.env.name}</title>
</svelte:head>
<div class="mb-2 flex flex-wrap items-center justify-center gap-5 pt-10">
  <ListSelect
    items={[
      { value: "current", label: "This Year" },
      { value: "previous", label: "Last Year" }
    ]}
    bind:value={$classQuery.year}
    transition={{
      in: {
        function: fly,
        properties: {
          delay: 250,
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }
      }
    }}
  />
  <ListSelect
    items={$classQuery.year === "current"
      ? [
          { value: 0, label: "Current Term" },
          { value: 1, label: "Q1" },
          { value: 2, label: "Q2" },
          { value: 3, label: "Q3" },
          { value: 4, label: "Q4" }
        ]
      : [
          { value: 1, label: "Q1" },
          { value: 2, label: "Q2" },
          { value: 3, label: "Q3" },
          { value: 4, label: "Q4" }
        ]}
    bind:value={$classQuery.term}
    transition={{
      in: {
        function: fly,
        properties: {
          delay: 300,
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }
      }
    }}
  />
  <Collapsible
    direction="horizontal"
    open={!!(
      (classes &&
        $zoron.schedule &&
        $classQuery.year !== "previous" &&
        !page.data?.session?.user?.settings?.home?.hideGPA &&
        calculateGPA(
          classes.map((c) => ({
            grade: c.grade,
            courseID: c.course,
            credit: c.credit
          }))
        ) !== 0) ||
      typeof window === "undefined"
    )}
    transition={{
      in: {
        function: fly,
        properties: {
          delay: 350,
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }
      }
    }}
  >
    <div
      class="whitespace-nowrap text-center text-3xl"
      style="view-transition-name: gpa;"
    >
      Quarter GPA: {#if classes && $zoron.schedule && $classQuery.year !== "previous" && !page.data?.session?.user?.settings?.home?.hideGPA && calculateGPA(classes.map( (c) => ({ grade: c.grade, courseID: c.course, credit: c.credit }) )) !== 0}
        {calculateGPA(
          classes.map((c) => ({
            grade: c.grade,
            courseID: c.course,
            credit: c.credit
          }))
        ).toFixed(2)}
      {:else}
        0.00
      {/if}
    </div>
  </Collapsible>
</div>

{#if classes}
  <div
    class="grid grid-cols-1 gap-5 pb-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    {#each classes as c, idx}
      <div
        id="c-{c.id}"
        class="{c.expanded && c.data
          ? 'col-span-1 sm:pt-1 md:col-span-2 lg:col-span-3 xl:col-span-4'
          : ''} mb-auto border-2 border-slate-600 p-3"
        style={loaded ? `view-transition-name: class-${c.id}` : ""}
        in:fly|global={{
          delay: 400 + 50 * (idx + 1),
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20, 0.2)
        }}
      >
        <div class={(c.expanded && c.data && "sm:flex sm:items-end") || ""}>
          <div class="flex items-center">
            <div class="overflow-auto">
              <div class="flex items-center">
                <button
                  onclick={async () => {
                    if (!c.expanded) {
                      if (!c.data) {
                        c.expanded = true;
                        classes;
                        console.log("expanded");

                        const data = await loadClassData(c);
                        console.log(data);
                        const transition = document.startViewTransition(
                          () =>
                            new Promise<void>((r) => {
                              c.data = data;
                              c.height = -1;
                              if (!c.data) c.expanded = false;
                              const interval = setInterval(() => {
                                if (document.querySelector(`#grades-${c.id}`)) {
                                  c.height =
                                    (
                                      document.querySelector(
                                        `#grades-${c.id}`
                                      ) as HTMLDivElement
                                    )?.offsetHeight || 400;
                                  clearInterval(interval);
                                  r();
                                }
                              }, 10);
                            })
                        );

                        console.log(await transition.finished);
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
                  class="btn-circle z-10 -ml-2 mr-1"
                >
                  <Fa
                    icon={faChevronRight}
                    class="z-10 transition-all {c.expanded
                      ? 'rotate-90'
                      : 'rotate-0'}"
                  />
                </button>
                <div
                  class="overflow-hidden text-ellipsis whitespace-nowrap text-xl"
                >
                  {c.name}
                </div>
                {#if c.credit && c.expanded && c.data && window.matchMedia("(min-width: 640px)").matches}
                  <div class="ml-3 text-slate-400">
                    {c.credit.toFixed(2)} credits
                  </div>
                {/if}
              </div>
              <div class="flex items-center">
                <div
                  class="mr-2 whitespace-nowrap border-r-2 border-slate-600 pr-2 text-sm text-slate-400"
                >
                  {c.course}
                </div>
                <div class="overflow-hidden text-ellipsis whitespace-nowrap">
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
            {#if c.credit && (!c.expanded || !c.data || !window.matchMedia("(min-width: 640px)").matches)}
              <div
                class="ml-auto flex flex-col border-r-2 border-slate-600 pr-1 text-slate-400"
              >
                <div class="-mb-1 text-end">{c.credit.toFixed(2)}</div>
                <div class="text-end">credits</div>
              </div>
            {/if}
          </div>
          <div
            class="ml-auto flex gap-0 {c.expanded && c.data
              ? 'sm:items-center sm:gap-4'
              : ''}"
          >
            <div
              class="mt-auto flex flex-col justify-end border-l-2 border-slate-600 {c.expanded &&
              c.data
                ? 'sm:flex-row sm:gap-5 sm:border-l-0'
                : ''}"
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
                  <div
                    class="absolute bottom-0 h-[3px] w-full bg-slate-600"
                  ></div>
                </div>
              {:else}
                <div class="mx-2 text-slate-400">No grades available</div>
              {/if}
            </div>
            <div
              class="-mb-1 ml-auto flex flex-col items-end justify-center border-l-0 border-dashed border-slate-600 pl-0 text-slate-400 {c.expanded &&
              c.data
                ? 'sm:border-l-2 sm:pl-2'
                : ''}"
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
              <Skeleton class="h-4 sm:w-60" />
              <Skeleton class="h-4 sm:w-72" />
              <Skeleton class="h-4 sm:w-80" />
            </div>
          {:else}
            <div class="grid grid-cols-1 gap-10 p-5 lg:grid-cols-2">
              <div class="flex-1">
                {#if c.data.assignments.length > 0}
                  {@html `<style>div { --height: ${c.height === -1 ? 400 : c.height}px; }</style`}
                  <div
                    class="custom-scroll custom-scroll-right flex max-h-96 flex-1 flex-col items-stretch overflow-auto border-2 border-slate-600 lg:max-h-[var(--height)]"
                  >
                    {#each c.data.assignments as assignment, idx}
                      <div
                        class="grid grid-cols-4 border-b-2 border-dashed border-slate-600 p-2 sm:grid-cols-7"
                        style={idx === c.data.assignments.length - 1
                          ? "border: none"
                          : ""}
                      >
                        <div
                          class="col-span-4 row-span-2 flex items-center justify-center border-dashed border-r-slate-600 text-center font-bold sm:col-span-3 sm:border-r-2 sm:pr-2"
                        >
                          <div class="border-b-2 border-slate-600">
                            {assignment.name}
                          </div>
                        </div>
                        <div
                          class="col-span-2 row-span-2 flex flex-col items-center justify-center text-right"
                        >
                          <div>{assignment.due}</div>
                          <!-- {#if "weight" in assignment && assignment.weight !== undefined} -->
                          <div class="text-slate-400">
                            Weight: <span class="font-bold">
                              {typeof assignment.weight === "undefined"
                                ? 1
                                : assignment.weight}
                            </span>
                          </div>
                          <!-- {/if} -->
                        </div>
                        {#if assignment.score}
                          <div
                            class="col-span-2 flex items-center justify-end gap-1"
                          >
                            <div class="font-bold">
                              {assignment.score.scored}
                            </div>
                            <div>/</div>
                            <div class="font-bold">
                              {assignment.score.total}
                            </div>
                          </div>
                          <div
                            class="relative col-span-2 border-2 border-dashed border-slate-600 text-transparent"
                          >
                            .
                            <div
                              class="absolute left-0 top-0 h-full bg-green-400 bg-opacity-80"
                              style="width: {Math.min(
                                assignment.score.percentage,
                                100
                              )}%"
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
                  <div
                    class="flex flex-1 items-center justify-center py-5 text-slate-400"
                  >
                    You don't have any assignments in this class yet...
                  </div>
                {/if}
              </div>
              {#if c.data.grades}
                <div
                  id="grades-{c.id}"
                  class="relative mb-auto grid flex-1 border-2 border-slate-600 grid-cols-{c
                    .data.grades.categories[0].terms.length *
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
                        style={(useLinearGradient &&
                          !term.grade &&
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
                      style={(useLinearGradient &&
                        !avg &&
                        "background: repeating-linear-gradient(45deg, rgb(100 116 139 / .5), rgb(100 116 139 / .5) 2px, #1e293b 2px, #1e293b 10px); background-position: 0 0; background-size: 100% 100%;") ||
                        ""}
                    >
                      {#if avg}
                        {#if avg.number}
                          {avg.number.toFixed(2)}
                          <div class="ml-1">({avg.letter})</div>
                        {:else}
                          {avg.letter}
                        {/if}
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
                      style={(useLinearGradient &&
                        !grade &&
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
                    style="grid-column: span {c.data.grades.categories[0].terms
                      .length * 2} / span {c.data.grades.categories[0].terms
                      .length * 2};"
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
                <div
                  class="flex flex-1 items-center justify-center py-5 text-slate-400"
                >
                  This class doesn't appear to have any grades...
                </div>{/if}
            </div>
          {/if}
        </Collapsible>
      </div>
    {/each}
  </div>
{:else}
  <div
    class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    {#each Array.from({ length: preloadLength }) as _, idx}
      <div
        class="mb-auto flex h-[143.2px] flex-col items-stretch border-2 border-slate-600 p-3"
      >
        <div class="flex items-center">
          <div class="overflow-auto">
            <div class="flex items-center">
              <button disabled class="btn-circle mr-1">
                <Skeleton class="rounded-full p-3" />
              </button>
              <div
                class="overflow-hidden text-ellipsis whitespace-nowrap text-xl"
              >
                <Skeleton class="h-4 w-36" />
              </div>
            </div>
            <div class="mt-2 flex items-center">
              <Skeleton class="h-3 w-48" />
            </div>
          </div>
          <div
            class="ml-auto mt-1 flex flex-col border-r-2 border-transparent pr-1 text-slate-400"
          >
            <div class="mb-2">
              <Skeleton class="h-3 w-10" />
            </div>
            <Skeleton class="h-3 w-10" />
          </div>
        </div>
        <div class="mt-auto flex gap-0">
          <div class="-ml-2 mt-auto flex flex-col justify-end">
            <div class="flex items-center gap-2 pl-2">
              <Skeleton class="h-4 w-24" />
            </div>
            <div class="relative mx-2 -mb-3 mr-auto flex items-center text-xl">
              <Skeleton class="my-2 h-5 w-24" />
            </div>
          </div>
          <div
            class="-mb-1 ml-auto flex flex-col items-end justify-center gap-2 border-l-0 border-dashed border-transparent pl-0 text-slate-400"
          >
            <div class="flex gap-2">
              <Skeleton class="h-3 w-16" />
            </div>
            <div class="flex gap-2">
              <Skeleton class="h-3 w-12" />
            </div>
            <div class="flex gap-2">
              <Skeleton class="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
