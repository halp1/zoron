<script lang="ts">
  import { writable } from "svelte/store";
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import type { aspen } from "@zoron/common/aspen";
  import { Collapsible, ListSelect, Skeleton } from "@zoron/common/components";
  import { motion } from "@zoron/common/motion";
  import { requests, storage, toast, zoron } from "@zoron/common/web";
  import { theme } from "@zoron/common/web/theme";

  import Fa from "svelte-fa";

  import {
    faChevronRight,
    faQuestionCircle
  } from "@fortawesome/free-solid-svg-icons";

  // Display mode state: 'grades' or 'transcript'
  let displayMode = $state<"grades" | "transcript">("grades");

  interface Class extends aspen.Types.Class {
    expanded: boolean;
    data?: aspen.Types.ClassDetail;
    credit?: number;
    height: number;
  }

  let classes: Class[] | null = $state(
    $zoron.classes
      ? ($zoron.classes.map(
          (c) =>
            ({
              ...c,
              expanded: false,
              height: -1,
              credit: $zoron.schedule?.schedule?.find((a) => a?.course === c.course)
                ?.credit
            }) satisfies Class
        ) as Class[])
      : null
  );

  const loadClassData = async (c: Class) => {
    const res = await requests.post<aspen.Types.ClassDetail>(
      "/api/aspen/class",
      {
        classID: c.id,
        year: $classQuery.year,
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
        classes = $zoron.classes
          ? $zoron.classes.map(
              (c) =>
                ({
                  ...c,
                  expanded: false,
                  height: -1,
                  credit: $zoron.schedule?.schedule?.find(
                    (a) => a?.course === c.course
                  )?.credit
                }) satisfies Class
            )
          : null;
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
        .map((term) => (term <= 10 ? convertMathScore(term) : term))
        .reduce((a, b) => a + b, 0) / terms.length
    );
  };

  const gradeToLetter = (grade: number) => {
    if (grade >= 96.5) return "A+";
    if (grade >= 92.5) return "A";
    if (grade >= 89.5) return "A-";
    if (grade >= 86.5) return "B+";
    if (grade >= 82.5) return "B";
    if (grade >= 79.5) return "B-";
    if (grade >= 76.5) return "C+";
    if (grade >= 72.5) return "C";
    if (grade >= 69.5) return "C-";
    if (grade >= 66.5) return "D+";
    if (grade >= 62.5) return "D";
    if (grade >= 59.5) return "D-";
    return "F";
  };

  const useLinearGradient = false;

  type LetterGrade =
    | "A+"
    | "A"
    | "A-"
    | "B+"
    | "B"
    | "B-"
    | "C+"
    | "C"
    | "C-"
    | "D+"
    | "D"
    | "D-"
    | "F+"
    | "F";
  type GPAData = {
    [grade in LetterGrade]: number;
  };

  const gpaData: GPAData = {
    "A+": 4.33,
    A: 4.0,
    "A-": 3.67,
    "B+": 3.33,
    B: 3.0,
    "B-": 2.67,
    "C+": 2.33,
    C: 2.0,
    "C-": 1.67,
    "D+": 1.33,
    D: 1.0,
    "D-": 0.67,
    "F+": 0.33,
    F: 0.0
  };

  const individualGPA = (
    letter?: string,
    level: "honors" | "ap" | "cp" = "cp",
    aPlus: boolean = true
  ) => {
    if (!letter) return null;
    const bonus = level === "honors" ? 0.5 : level === "ap" ? 1.0 : 0.0;
    return (
      Math.min(gpaData[letter as LetterGrade] ?? 0, aPlus ? 4.33 : 4) + bonus
    );
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

  let transcriptTime: "current" | "g9" | "g10" | "g11" | "g12" | "all" =
    $state("current");

  let weightedGPA = $state<"unweighted" | "lhs" | "weighted">("lhs");

  let transcript = $derived(
    $zoron.transcript
      ? $zoron.transcript.classes.filter((c) => {
          if (transcriptTime === "all") return true;
          if (transcriptTime === "current")
            return (
              c.grade ===
              Math.max(...$zoron.transcript.classes.map((c) => c.grade))
            );
          return c.grade === parseInt(transcriptTime.replace("g", ""));
        })
      : []
  );

  let transcriptCreditsEarned = $derived(
    transcript
      .map((c) => c.credit)
      .filter((c) => c !== undefined && !Number.isNaN(c))
      .reduce((a, b) => a + (b || 0), 0)
  );

  let transcriptGPA = $derived(
    transcript
      .map((c) => ({
        final: c.final,
        credit: c.credit,
        level: c.level
      }))
      .filter(
        (c) =>
          (c.final?.length || 0) > 0 &&
          c.credit !== undefined &&
          c.credit > 0 &&
          c.final !== "P"
      )
      .map(
        (c) =>
          (individualGPA(
            c.final!,
            weightedGPA !== "weighted"
              ? "cp"
              : c.level === "Honors"
                ? "honors"
                : c.level === "AP"
                  ? "ap"
                  : "cp",
            weightedGPA === "lhs"
          ) ?? 0) * c.credit
      )
      .reduce((a, b) => a + b, 0) /
      (transcriptCreditsEarned -
        transcript
          .filter((c) => c.final === "P")
          .reduce((a, b) => a + (b.credit || 0), 0) || 1)
  );

  // Transition delay for transcript cells (diagonal fly-in effect)
  const TRANSCRIPT_CELL_DELAY = 40; // milliseconds per cell
  const TRANSCRIPT_BASE_DELAY = 400; // base delay for transcript items

  let showTranscriptHighlight = writable(true);
  onMount(() => {
    return storage.use("grades.transcript-highlight", showTranscriptHighlight);
  });

  $effect(() => {
    if (displayMode === "transcript") showTranscriptHighlight.set(false);
  });

  // pre-load classes for tailwind
  ("grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6 grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10 grid-cols-11 grid-cols-12 grid-cols-13 grid-cols-14 border-b-0");
</script>

<svelte:head>
  <title>Grades | {page.data.env.name}</title>
</svelte:head>

<div class="mb-2 flex flex-wrap items-center justify-center gap-5 pt-10">
  <ListSelect
    items={[
      { value: "grades", label: "Quarter Grades" },
      { value: "transcript", label: "Transcript" }
    ]}
    bind:value={displayMode}
    transition={{
      in: {
        function: fly,
        properties: {
          delay: 200,
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }
      }
    }}
    glow={$showTranscriptHighlight}
  />

  {#if displayMode === "grades"}
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
        class="text-center text-3xl whitespace-nowrap"
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
  {:else}
    <ListSelect
      items={[
        { value: "current", label: "This Year" },
        { value: "g9", label: "9th" },
        { value: "g10", label: "10th" },
        { value: "g11", label: "11th" },
        { value: "g12", label: "12th" },
        { value: "all", label: "All Time" }
      ]}
      bind:value={transcriptTime}
    />
    <ListSelect
      items={[
        { value: "unweighted", label: "Unweighted" },
        { value: "lhs", label: "LHS" },
        { value: "weighted", label: "Weighted" }
      ]}
      bind:value={weightedGPA}
    />
  {/if}
</div>

{#if displayMode === "grades"}
  {#if $zoron.classes === null}
    <div class="text-center text-red-500 py-10 text-lg font-medium">
      Cannot obtain your current class list.
    </div>
  {:else if classes && classes.length}
    <div
      class="grid grid-cols-1 gap-5 px-10 pb-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {#each classes as c, idx}
        <div
          id="c-{c.id}"
          class="{c.expanded && c.data
            ? 'col-span-1 sm:pt-1 md:col-span-2 lg:col-span-3 xl:col-span-4'
            : ''} mb-auto border-2 {$theme === 'amoled'
            ? 'border-white'
            : 'border-slate-600'} p-3"
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

                          const data = await loadClassData(c);
                          const transition = document.startViewTransition(
                            () =>
                              new Promise<void>((r) => {
                                c.data = data;
                                c.height = -1;
                                if (!c.data) c.expanded = false;
                                const interval = setInterval(() => {
                                  if (
                                    document.querySelector(`#grades-${c.id}`)
                                  ) {
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

                          await transition.finished;
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
                    class="btn-circle z-10 mr-1 -ml-2"
                  >
                    <Fa
                      icon={faChevronRight}
                      class="z-10 transition-all {c.expanded
                        ? 'rotate-90'
                        : 'rotate-0'}"
                    />
                  </button>
                  <div
                    class="overflow-hidden text-xl text-ellipsis whitespace-nowrap"
                  >
                    {c.name}
                  </div>
                  {#if c.credit && c.expanded && c.data && window.matchMedia("(min-width: 640px)").matches}
                    <div
                      class="ml-3 {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      {c.credit.toFixed(2)} credits
                    </div>
                  {/if}
                </div>
                <div class="flex items-center">
                  <div
                    class="mr-2 border-r-2 whitespace-nowrap {$theme ===
                    'amoled'
                      ? 'border-white'
                      : 'border-slate-600'} pr-2 text-sm {$theme === 'amoled'
                      ? 'text-white'
                      : 'text-slate-400'}"
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
                  class="ml-auto flex flex-col border-r-2 {$theme === 'amoled'
                    ? 'border-white'
                    : 'border-slate-600'} pr-1 {$theme === 'amoled'
                    ? 'text-white'
                    : 'text-slate-400'}"
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
                class="mt-auto flex flex-col justify-end border-l-2 {$theme ===
                'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} {c.expanded && c.data
                  ? 'sm:flex-row sm:gap-5 sm:border-l-0'
                  : ''}"
              >
                <div class="flex items-center gap-2 pl-2">
                  Room: {#if c.room}
                    <div class="font-bold">{c.room}</div>
                  {:else}
                    <div
                      class={$theme === "amoled"
                        ? "text-white"
                        : "text-slate-400"}
                    >
                      (no room)
                    </div>{/if}
                </div>
                {#if c.grade && !Number.isNaN(c.grade.number) && typeof c.grade.number === "number"}
                  <div class="relative mx-2 mr-auto flex items-center text-xl">
                    {c.grade.number.toFixed(2)}: {c.grade.letter}
                    <div
                      class="absolute bottom-0 h-[3px] w-full {$theme ===
                      'amoled'
                        ? 'bg-white'
                        : 'bg-slate-600'}"
                    ></div>
                  </div>
                {:else}
                  <div
                    class="mx-2 {$theme === 'amoled'
                      ? 'text-white'
                      : 'text-slate-400'}"
                  >
                    No grades available
                  </div>
                {/if}
              </div>
              <div
                class="-mb-1 ml-auto flex flex-col items-end justify-center border-l-0 border-dashed {$theme ===
                'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} pl-0 {$theme === 'amoled'
                  ? 'text-white'
                  : 'text-slate-400'} {c.expanded && c.data
                  ? 'sm:border-l-2 sm:pl-2'
                  : ''}"
              >
                <div class="flex gap-2">
                  <div class="font-bold">Absent:</div>
                  {c.attendance.absent ?? "N/A"}
                </div>
                <div class="-mt-1 flex gap-2">
                  <div class="font-bold">Tardy:</div>
                  {c.attendance.tardy ?? "N/A"}
                </div>
                <div class="-mt-1 flex gap-2">
                  <div class="font-bold">Dismissed:</div>
                  {c.attendance.dismissed ?? "N/A"}
                </div>
              </div>
            </div>
          </div>
          <Collapsible open={c.expanded} key={c.data}>
            <div class="pt-2"></div>
            <div
              class="border-t-2 border-dashed {$theme === 'amoled'
                ? 'border-white'
                : 'border-slate-600'}"
            ></div>
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
                    {@html `<style>div { --height: ${c.height === -1 ? 400 : Math.max(400, c.height)}px; }</style>`}
                    <div
                      class="custom-scroll custom-scroll-right flex max-h-96 flex-1 flex-col items-stretch overflow-auto border-2 {$theme ===
                      'amoled'
                        ? 'border-white'
                        : 'border-slate-600'} lg:max-h-[var(--height)]"
                    >
                      {#each c.data.assignments as assignment, idx}
                        <div
                          class="grid grid-cols-4 border-b-2 border-dashed {$theme ===
                          'amoled'
                            ? 'border-white'
                            : 'border-slate-600'} p-2 sm:grid-cols-7"
                          style={idx === c.data.assignments.length - 1
                            ? `border: none`
                            : ""}
                        >
                          <div
                            class="col-span-4 row-span-2 flex items-center justify-center border-dashed border-r-slate-600 text-center font-bold sm:col-span-3 sm:border-r-2 sm:pr-2"
                          >
                            <div
                              class="border-b-2 {$theme === 'amoled'
                                ? 'border-white'
                                : 'border-slate-600'}"
                            >
                              {assignment.name}
                            </div>
                          </div>
                          <div
                            class="col-span-2 row-span-2 flex flex-col items-center justify-center text-right"
                          >
                            <div>{assignment.due}</div>
                            <!-- {#if "weight" in assignment && assignment.weight !== undefined} -->
                            <div
                              class={$theme === "amoled"
                                ? "text-white"
                                : "text-slate-400"}
                            >
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
                              class="relative col-span-2 border-2 border-dashed {$theme ===
                              'amoled'
                                ? 'border-white'
                                : 'border-slate-600'} text-transparent"
                            >
                              .
                              <div
                                class="bg-opacity-80 absolute top-0 left-0 h-full bg-green-400"
                                style="width: {Math.min(
                                  assignment.score.percentage,
                                  100
                                )}%"
                              ></div>
                              <div
                                class="absolute top-1/2 right-0 z-10 -translate-y-1/2 font-bold text-white"
                              >
                                {assignment.score.percentage}%
                              </div>
                            </div>
                          {:else}
                            <div
                              class="col-span-2 row-span-2 flex items-center justify-center {$theme ===
                              'amoled'
                                ? 'text-white'
                                : 'text-slate-400'}"
                            >
                              No score available
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div
                      class="flex flex-1 items-center justify-center py-5 {$theme ===
                      'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      You don't have any assignments in this class yet...
                    </div>
                  {/if}
                </div>
                {#if c.data.grades}
                  <div
                    id="grades-{c.id}"
                    class="relative mb-auto grid flex-1 border-2 {$theme ===
                    'amoled'
                      ? 'border-white'
                      : 'border-slate-600'} grid-cols-{c.data.grades
                      .categories[0].terms.length *
                      2 +
                      3}"
                  >
                    <div
                      class="col-span-3 flex items-center justify-center border-b-2 border-dashed {$theme ===
                      'amoled'
                        ? 'border-white'
                        : 'border-slate-600'} px-2 py-1 text-center"
                    >
                      Category
                    </div>
                    {#each c.data.grades.categories[0].terms as _, idx}
                      <div
                        class="col-span-2 flex justify-center border-b-2 border-l-2 border-dashed {$theme ===
                        'amoled'
                          ? 'border-white'
                          : 'border-slate-600'} px-2 py-1 text-center"
                      >
                        Term {idx + 1}
                      </div>
                    {/each}
                    {#each c.data.grades.categories as grade}
                      <div
                        class="col-span-3 row-span-2 flex items-center justify-center overflow-hidden border-b-2 border-dashed {$theme ===
                        'amoled'
                          ? 'border-white'
                          : 'border-slate-600'} px-2 py-1 text-center capitalize"
                        style="overflow-wrap: break-word; word-break: break-word"
                      >
                        {grade.name}
                      </div>
                      {#each grade.terms as term}
                        <div
                          class="col-span-2 flex justify-center border-b-2 border-l-2 border-dashed {$theme ===
                          'amoled'
                            ? 'border-white bg-gray-900'
                            : 'border-slate-600 bg-slate-800'} px-2 py-1 text-center"
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
                          class="col-span-2 flex flex-wrap justify-center border-b-2 border-l-2 border-dashed {$theme ===
                          'amoled'
                            ? 'border-white'
                            : 'border-slate-600'} bg-opacity-50 px-2 py-1 text-center text-sm xl:text-base"
                          style={(useLinearGradient &&
                            !term.grade &&
                            `background: repeating-linear-gradient(45deg, rgb(71 85 105 / var(--tw-bg-opacity)), rgb(71 85 105 / var(--tw-bg-opacity)) 2px, transparent 2px, transparent 10px); background-position: 0 0; background-size: 100% 100%;`) ||
                            ""}
                        >
                          {#if term.grade}
                            {term.grade.number.toFixed(2)}
                            <div class="ml-1">({term.grade.letter})</div>
                          {:else}
                            <div class="text-transparent select-none">.</div>
                          {/if}
                        </div>
                      {/each}
                    {/each}
                    <div
                      class="col-span-3 flex items-center justify-center overflow-hidden border-b-2 border-dashed {$theme ===
                      'amoled'
                        ? 'border-white'
                        : 'border-slate-600'} px-2 py-1 text-center"
                      style="overflow-wrap: break-word; word-break: break-word"
                    >
                      Quarterly average
                    </div>
                    {#each c.data.grades.averages as avg}
                      <div
                        class="col-span-2 flex flex-wrap justify-center border-b-2 border-l-2 border-dashed {$theme ===
                        'amoled'
                          ? 'border-white bg-gray-900'
                          : 'border-slate-600 bg-slate-800'} px-2 py-1 text-center text-sm xl:text-base"
                        style={(useLinearGradient &&
                          !avg &&
                          `background: repeating-linear-gradient(45deg, rgb(100 116 139 / .5), rgb(100 116 139 / .5) 2px, #1e293b 2px, #1e293b 10px); background-position: 0 0; background-size: 100% 100%;`) ||
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
                          <div class="text-transparent select-none">.</div>
                        {/if}
                      </div>
                    {/each}
                    <div
                      class="col-span-3 flex items-center justify-center overflow-hidden border-b-2 border-dashed {$theme ===
                      'amoled'
                        ? 'border-white'
                        : 'border-slate-600'} px-2 py-1 text-center"
                      style="overflow-wrap: break-word; word-break: break-word"
                    >
                      Posted grade
                    </div>
                    {#each c.data.grades.posted as grade}
                      <div
                        class="col-span-2 flex flex-wrap justify-center border-b-2 border-l-2 border-dashed {$theme ===
                        'amoled'
                          ? 'border-white bg-gray-900'
                          : 'border-slate-600 bg-slate-800'} px-2 py-1 text-center text-sm xl:text-base {!grade &&
                          'bg-opacity-50'}"
                        style={(useLinearGradient &&
                          !grade &&
                          `background: repeating-linear-gradient(45deg, rgb(71 85 105 / var(--tw-bg-opacity)), rgb(71 85 105 / var(--tw-bg-opacity)) 2px, transparent 2px, transparent 10px); background-position: 0 0; background-size: 100% 100%;`) ||
                          ""}
                      >
                        {#if grade}
                          {grade.number.toFixed(2)}
                          <div class="ml-1">({grade.letter})</div>
                        {:else}
                          <div class="text-transparent select-none">.</div>
                        {/if}
                      </div>
                    {/each}
                    <div
                      class="col-span-3 flex items-center justify-center overflow-hidden border-b-2 border-dashed {$theme ===
                      'amoled'
                        ? 'border-white'
                        : 'border-slate-600'} px-2 py-1 text-center"
                      style="overflow-wrap: break-word; word-break: break-word"
                    >
                      Final grade
                    </div>
                    <div
                      class="relative flex justify-center border-b-2 border-l-2 border-dashed {$theme ===
                      'amoled'
                        ? 'border-white bg-gray-900'
                        : 'border-slate-600 bg-slate-800'} px-2 py-1 text-center"
                      style="grid-column: span {c.data.grades.categories[0]
                        .terms.length * 2} / span {c.data.grades.categories[0]
                        .terms.length * 2};"
                    >
                      {#if c.data.grades.final}
                        {#if c.data.grades.final.number}
                          {c.data.grades.final.number.toFixed(2)}
                          <div class="ml-1">({c.data.grades.final.letter})</div>
                        {:else}
                          {c.data.grades.final.letter}
                          <Fa
                            icon={faQuestionCircle}
                            class="absolute top-1/2 right-2 -translate-y-1/2 cursor-help"
                            title="No exact final grade is available."
                          />
                        {/if}
                      {:else}
                        {calculateFinalGrade(c.data.grades).toFixed(2)}
                        <Fa
                          icon={faQuestionCircle}
                          class="absolute top-1/2 right-2 -translate-y-1/2 cursor-help"
                          title="This grade is calculated as an average of all terms. It may not accurately represent your final grade."
                        />
                      {/if}
                    </div>
                  </div>
                {:else}
                  <div
                    class="flex flex-1 items-center justify-center py-5 {$theme ===
                    'amoled'
                      ? 'text-white'
                      : 'text-slate-400'}"
                  >
                    This class doesn't appear to have any grades...
                  </div>{/if}
              </div>
            {/if}
          </Collapsible>
        </div>
      {/each}
    </div>
  {:else if classes}
    <div class="text-center text-slate-400">
      You don't have any class data available yet.
    </div>
  {:else}
    <div
      class="grid grid-cols-1 gap-5 px-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {#each Array.from({ length: preloadLength }) as _, idx}
        <div
          class="mb-auto flex h-[143.2px] flex-col items-stretch border-2 {$theme ===
          'amoled'
            ? 'border-white'
            : 'border-slate-600'} p-3"
        >
          <div class="flex items-center">
            <div class="overflow-auto">
              <div class="flex items-center">
                <button disabled class="btn-circle mr-1">
                  <Skeleton class="rounded-full p-3" />
                </button>
                <div
                  class="overflow-hidden text-xl text-ellipsis whitespace-nowrap"
                >
                  <Skeleton class="h-4 w-36" />
                </div>
              </div>
              <div class="mt-2 flex items-center">
                <Skeleton class="h-3 w-48" />
              </div>
            </div>
            <div
              class="mt-1 ml-auto flex flex-col border-r-2 border-transparent pr-1 {$theme ===
              'amoled'
                ? 'text-white'
                : 'text-slate-400'}"
            >
              <div class="mb-2">
                <Skeleton class="h-3 w-10" />
              </div>
              <Skeleton class="h-3 w-10" />
            </div>
          </div>
          <div class="mt-auto flex gap-0">
            <div class="mt-auto -ml-2 flex flex-col justify-end">
              <div class="flex items-center gap-2 pl-2">
                <Skeleton class="h-4 w-24" />
              </div>
              <div
                class="relative mx-2 mr-auto -mb-3 flex items-center text-xl"
              >
                <Skeleton class="my-2 h-5 w-24" />
              </div>
            </div>
            <div
              class="-mb-1 ml-auto flex flex-col items-end justify-center gap-2 border-l-0 border-dashed border-transparent pl-0 {$theme ===
              'amoled'
                ? 'text-white'
                : 'text-slate-400'}"
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
{:else}
  <!-- Transcript View -->
  <div class="pb-10">
    {#if $zoron.transcript === null}
      <div
        class="flex h-64 items-center justify-center text-xl text-red-500 font-medium"
      >
        Cannot obtain your transcript.
      </div>
    {:else if transcript.length > 0}
      <div
        class="mb-5 grid gap-5 pb-5"
        in:fly={{
          delay: 200,
          duration: 800,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }}
      >
        <div class="mx-auto mb-5 flex items-center justify-center gap-8">
          <div class="text-center">
            <div
              class="text-2xl font-bold"
              in:fly|global={{
                delay: 200,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Cumulative GPA: {transcriptGPA?.toFixed(2)}
            </div>
          </div>
          <div class="text-center">
            <div
              class="text-2xl font-bold"
              in:fly|global={{
                delay: 300,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Credits Earned: {transcriptCreditsEarned.toFixed(2)}
            </div>
          </div>
        </div>

        <div class="mx-auto overflow-visible lg:w-[960px]">
          <!-- Desktop Grid Layout -->
          <div
            class="hidden grid-cols-[repeat(13,minmax(0,1fr))] md:grid {$theme ===
            'amoled'
              ? 'border-white'
              : 'border-slate-600'}"
          >
            <!-- Header Row -->
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-center font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (0 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Grade
            </div>
            <div
              class="col-span-4 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-left font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (1 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Course
            </div>
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-left font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (2 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Level
            </div>
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-center font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (3 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Q1
            </div>
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-center font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (4 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Q2
            </div>
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-center font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (5 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Q3
            </div>
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-center font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (6 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Q4
            </div>
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-center font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (7 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Exam
            </div>
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-center font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (8 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Final
            </div>
            <div
              class="col-span-1 border-2 {$theme === 'amoled'
                ? 'border-white text-white'
                : 'border-slate-600 bg-slate-800 text-white'} p-2 text-center font-bold"
              in:fly|global={{
                delay: TRANSCRIPT_BASE_DELAY + (9 + 0) * TRANSCRIPT_CELL_DELAY,
                duration: 600,
                opacity: 0,
                y: -10,
                easing: motion.transitions.spring(400, 15)
              }}
            >
              Credits
            </div>

            <!-- Data Rows -->
            {#each transcript as course, rowIndex}
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2 text-center {$theme === 'amoled'
                  ? 'bg-black'
                  : 'bg-slate-800'}"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (0 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.grade}
              </div>
              <div
                class="col-span-4 overflow-hidden border-2 p-2 overflow-ellipsis whitespace-nowrap {$theme ===
                'amoled'
                  ? 'border-white'
                  : 'border-slate-600'}"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (1 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
                title={course.course}
              >
                {course.course}
              </div>
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (2 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.level}
              </div>
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2 text-center {course.breakdown[0]
                  ? $theme === 'amoled'
                    ? 'bg-black'
                    : 'bg-slate-800'
                  : ''}"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (3 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.breakdown[0] || "-"}
              </div>
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2 text-center {course.breakdown[1]
                  ? $theme === 'amoled'
                    ? 'bg-black'
                    : 'bg-slate-800'
                  : ''}"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (4 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.breakdown[1] || "-"}
              </div>
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2 text-center {course.breakdown[2]
                  ? $theme === 'amoled'
                    ? 'bg-black'
                    : 'bg-slate-800'
                  : ''}"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (5 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.breakdown[2] || "-"}
              </div>
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2 text-center {course.breakdown[3]
                  ? $theme === 'amoled'
                    ? 'bg-black'
                    : 'bg-slate-800'
                  : ''}"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (6 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.breakdown[3] || "-"}
              </div>
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2 text-center {course.breakdown[4]
                  ? $theme === 'amoled'
                    ? 'bg-black'
                    : 'bg-slate-800'
                  : ''}"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (7 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.breakdown[4] || "-"}
              </div>
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2 text-center font-bold"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (8 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.final || "-"}
              </div>
              <div
                class="col-span-1 border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'} p-2 text-center"
                in:fly|global={{
                  delay:
                    TRANSCRIPT_BASE_DELAY +
                    (9 + rowIndex + 1) * TRANSCRIPT_CELL_DELAY,
                  duration: 600,
                  opacity: 0,
                  y: -10,
                  easing: motion.transitions.spring(400, 15)
                }}
              >
                {course.credit.toFixed(2)}
              </div>
            {/each}
          </div>

          <!-- Mobile Grid Layout -->
          <div class="space-y-4 md:hidden">
            {#each transcript || [] as course, rowIndex}
              <div class="grid grid-cols-1">
                <!-- Course Info Row -->
                <div
                  class="border-2 {$theme === 'amoled'
                    ? 'border-white'
                    : 'border-slate-600'} p-2"
                  in:fly|global={{
                    delay:
                      TRANSCRIPT_BASE_DELAY +
                      rowIndex * 2 * TRANSCRIPT_CELL_DELAY,
                    duration: 600,
                    opacity: 0,
                    y: -10,
                    easing: motion.transitions.spring(400, 15)
                  }}
                >
                  <div class="font-bold">
                    <span
                      class="mr-2 inline-block rounded bg-slate-800 px-2 py-1"
                      >{course.grade}th</span
                    >{course.course}
                  </div>
                  <div class="mt-1 flex justify-between">
                    <span
                      class="text-sm {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}">{course.level}</span
                    >
                    <span class="text-sm font-semibold"
                      >{course.credit.toFixed(2)} credits</span
                    >
                  </div>
                </div>

                <!-- Grades Row -->
                <div
                  class="mb-4 border-2 border-t-0 p-2 {$theme === 'amoled'
                    ? 'border-white'
                    : 'border-slate-600'}"
                  in:fly|global={{
                    delay:
                      TRANSCRIPT_BASE_DELAY +
                      (rowIndex * 2 + 1) * TRANSCRIPT_CELL_DELAY,
                    duration: 600,
                    opacity: 0,
                    y: -10,
                    easing: motion.transitions.spring(400, 15)
                  }}
                >
                  <div class="grid grid-cols-7 gap-1 text-center">
                    <div
                      class="text-xs {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      Grade
                    </div>
                    <div
                      class="text-xs {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      Q1
                    </div>
                    <div
                      class="text-xs {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      Q2
                    </div>
                    <div
                      class="text-xs {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      Q3
                    </div>
                    <div
                      class="text-xs {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      Q4
                    </div>
                    <div
                      class="text-xs {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      Exam
                    </div>
                    <div
                      class="text-xs {$theme === 'amoled'
                        ? 'text-white'
                        : 'text-slate-400'}"
                    >
                      Final
                    </div>

                    <div
                      class="rounded p-1 text-sm {$theme === 'amoled'
                        ? 'bg-gray-900'
                        : 'bg-slate-800'}"
                    >
                      {course.grade}
                    </div>

                    <div
                      class="rounded p-1 text-sm {course.breakdown[0]
                        ? $theme === 'amoled'
                          ? 'bg-gray-900'
                          : 'bg-slate-800'
                        : ''}"
                    >
                      {course.breakdown[0] || "-"}
                    </div>
                    <div
                      class="rounded p-1 text-sm {course.breakdown[1]
                        ? $theme === 'amoled'
                          ? 'bg-gray-900'
                          : 'bg-slate-800'
                        : ''}"
                    >
                      {course.breakdown[1] || "-"}
                    </div>
                    <div
                      class="rounded p-1 text-sm {course.breakdown[2]
                        ? $theme === 'amoled'
                          ? 'bg-gray-900'
                          : 'bg-slate-800'
                        : ''}"
                    >
                      {course.breakdown[2] || "-"}
                    </div>
                    <div
                      class="rounded p-1 text-sm {course.breakdown[3]
                        ? $theme === 'amoled'
                          ? 'bg-gray-900'
                          : 'bg-slate-800'
                        : ''}"
                    >
                      {course.breakdown[3] || "-"}
                    </div>
                    <div
                      class="rounded p-1 text-sm {course.breakdown[4]
                        ? $theme === 'amoled'
                          ? 'bg-gray-900'
                          : 'bg-slate-800'
                        : ''}"
                    >
                      {course.breakdown[4] || "-"}
                    </div>
                    <div class="rounded p-1 text-sm font-bold">
                      {course.final || "-"}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div
        class="flex h-64 items-center justify-center text-xl {$theme ===
        'amoled'
          ? 'text-white'
          : 'text-slate-400'}"
      >
        No transcript data available
      </div>
    {/if}
  </div>
{/if}
