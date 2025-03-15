<script lang="ts">
  import { writable } from "svelte/store";
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import type {
    Assignment,
    Attendance,
    PeriodAttendance,
    PostedGrade
  } from "$lib/aspen/types";
  import { ListSelect } from "$lib/components";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import { motion } from "$lib/motion";
  import { requests, storage, toast, zoron } from "$lib/web";

  import Fa from "svelte-fa";

  import {
    faCalendarCheck,
    faCheckCircle,
    faGraduationCap,
    faInfoCircle
  } from "@fortawesome/free-solid-svg-icons";

  interface GradeWithData extends Assignment {
    scoring?:
      | {
          percentage: number;
          scored: number;
          total: number;
        }
      | number
      | null;
  }

  const existingData = $zoron.preloadedActivity || [];
  let merged: (Attendance | PeriodAttendance | GradeWithData | PostedGrade)[] =
    $state(
      $zoron.activity.merged.map((item) => {
        if (item.type !== "grade") return item;
        const existing = existingData.find(
          (existing) => existing.id === item.id
        );
        if (
          !existing ||
          !existing.lastLoaded ||
          existing.lastLoaded !== item.grade.trim()
        )
          return { ...item, scoring: 0 };
        else return { ...item, scoring: existing.data };
      })
    );

  let activity = $derived($zoron.activity);

  let filter = writable<"all" | "grades" | "attendance">("all");

  onMount(() => {
    (async () => {
      const res = await requests.stream(
        "/api/aspen/assignment/all",
        merged
          .filter(
            (item) => item.type === "grade" && typeof item.scoring === "number"
          )
          .map((item) => ({
            assignment: item,
            studentID:
              activity.raw["recent-activity-list"]["recent-activity"][0].$
                .studentoid
          })),
        (steps, total, id, data) => {
          try {
            const item = merged!.find((item) => (item as any).id === id);
            if (!item || item.type !== "grade") return;
            if (data || data === null) {
              merged![merged!.indexOf(item)] = { ...item, scoring: data };
            } else {
              merged![merged!.indexOf(item)] = {
                ...item,
                scoring: steps / total
              };
            }
            const itemIdx =
              $zoron.preloadedActivity?.findIndex((item) => item.id === id) ??
              -1;
            if (itemIdx !== -1) {
              const copy = $zoron.preloadedActivity;
              copy![itemIdx].data = data;
              zoron.update((state) => ({ ...state, preloadedActivity: copy }));
            }
          } catch (e) {
            console.error(e);
          }
        }
      );
      if (!res.success) {
        return toast.error(`Error loading assignment data: ${res.error}`);
      }
    })();

    const u1 = storage.use("activity.filter", filter);
    return () => {
      u1();
    };
  });
</script>

<svelte:head>
  <title>Activity | {page.data.env.name}</title>
</svelte:head>
<div class="mt-5 flex items-center justify-center">
  <ListSelect
    items={[
      {
        value: "all",
        label: "All"
      },
      {
        value: "grades",
        label: "Grades"
      },
      {
        value: "attendance",
        label: "Attendance"
      }
    ]}
    bind:value={$filter}
  />
</div>
<div
  class="mx-auto mb-10 mt-5 flex w-full flex-1 flex-col gap-2 border-l-4 border-slate-600 lg:max-w-[1024px]"
>
  {#each merged.filter((item) => {
    if ($filter === "grades") return item.type === "grade" || item.type === "posted-grade";
    if ($filter === "attendance") return item.type === "attendance" || item.type === "period-attendance";
    return true;
  }) as item, idx}
    <div
      class="flex min-h-8 items-center gap-3"
      in:fly|global={{
        delay: (idx + 1) * 25,
        duration: 1000,
        opacity: 0,
        y: -20,
        easing: motion.transitions.spring(400, 20, 0.2)
      }}
    >
      {#if item.type === "grade"}
        <div class="ml-3 flex w-5 justify-center sm:-mr-2">
          <Fa icon={faGraduationCap} color="#4ade80" />
        </div>
        <div class="hidden border-r-4 border-slate-600 px-2 sm:block">
          <span class="text-green-300">Grade</span> -
          <a
            href="/home/grades#{encodeURIComponent(item.class)}"
            class="border-b-2 border-slate-600 border-opacity-0 text-blue-300 hover:border-opacity-100"
            >{item.class}</a
          >
        </div>
        {item.assignment}:
        <div
          class="flex h-8 items-center justify-center whitespace-nowrap border-4 border-slate-600 px-2"
        >
          {#if !item.scoring || typeof item.scoring === "number"}
            {item.grade}
            {#if typeof item.scoring === "number"}
              {" "}/ <Skeleton class="ml-2 hidden h-2 w-12 sm:block" />
              {#if typeof item.scoring === "number"}
                <div
                  class="relative ml-2 h-2 w-12 overflow-hidden rounded-full bg-slate-600 sm:hidden"
                >
                  <div
                    class="absolute left-0 top-0 h-full bg-green-300"
                    style="width: {item.scoring * 100}%"
                  ></div>
                </div>
              {/if}
            {/if}
          {:else if item.scoring.scored.toString().trim() === item.grade.trim()}
            {item.grade} / {item.scoring.total}
          {:else}
            {item.grade}
            <span class="ml-1 hidden sm:inline">
              ({item.scoring.scored} / {item.scoring.total})
            </span>
          {/if}
        </div>

        <div class="h-[2px] flex-1 bg-slate-600"></div>
        {#if typeof item.scoring === "number"}
          <div
            class="relative ml-2 hidden h-2 w-12 overflow-hidden rounded-full bg-slate-600 sm:block"
          >
            <div
              class="absolute left-0 top-0 h-full bg-green-300"
              style="width: {item.scoring * 100}%"
            ></div>
          </div>
        {/if}
      {:else if item.type === "period-attendance"}
        <div class="ml-3 flex w-5 justify-center sm:-mr-2">
          <Fa icon={faCalendarCheck} color="#fde047" />
        </div>
        <div class="hidden border-r-4 border-slate-600 px-2 sm:block">
          <span class="text-yellow-300">Attendance</span> -
          <a
            href="/home/grades#{encodeURIComponent(item.class)}"
            class="border-b-2 border-slate-600 border-opacity-0 text-blue-300 hover:border-opacity-100"
            >{item.class}</a
          >
        </div>

        <div class="-mr-1">Period:</div>
        <div class="font-bold">{item.period}</div>
        <div class="-mr-1">Code:</div>
        <div class="font-bold">{item.code}</div>
        <div class="h-[2px] flex-1 bg-slate-600"></div>
      {:else if item.type === "attendance"}
        <div class="ml-3 flex w-5 justify-center sm:-mr-2">
          <Fa icon={faCalendarCheck} color="#fde047" />
        </div>
        <div class="hidden border-r-4 border-slate-600 px-2 sm:block">
          <span class="text-yellow-300">Attendance</span>
        </div>
        <div class="-mr-1">Code:</div>
        <div class="font-bold">{item.code}</div>
        {#if item.absent}
          <div class="text-sm text-slate-400">Absent,</div>
        {/if}
        {#if item.tardy}
          <div class="text-sm text-slate-400">Tardy,</div>
        {/if}
        {#if item.dismissed}
          <div class="text-sm text-slate-400">Dismissed Early,</div>
        {/if}
        {#if item.excused}
          <div class="-ml-2 text-sm text-slate-400">Excused</div>
        {:else}
          <div class="-ml-2 text-sm text-slate-400">Unexcused</div>
        {/if}

        <div class="h-[2px] flex-1 bg-slate-600"></div>
      {:else if item.type === "posted-grade"}
        <div class="ml-3 flex w-5 justify-center sm:-mr-2">
          <Fa icon={faCheckCircle} color="#c4b5fd" />
        </div>
        <div class="hiddenpx-2 sm:block">
          <span class="text-violet-300">Grades Posted</span> -
          <a
            href="/home/grades#{encodeURIComponent(item.classname)}"
            class="border-b-2 border-slate-600 border-opacity-0 text-blue-300 hover:border-opacity-100"
            >{item.classname}</a
          >
        </div>
        <div class="h-[2px] flex-1 bg-slate-600"></div>
      {/if}
      <div class="hidden text-slate-400 sm:block">{item.date}</div>
      <div class="text-slate-400 sm:hidden">
        {item.date.split("-")[1]}/{item.date.split("-")[2]}
      </div>
    </div>
  {/each}
  <div class="ml-4 text-sm text-slate-400">
    <Fa icon={faInfoCircle} class="float-left mr-2 mt-[3px]" />
    Activity only goes back 60 days. To see more, visit
    <a
      href="/home/grades"
      class="underline"
      data-sveltekit-preload-code
      data-sveltekit-preload-data
    >
      your grades
    </a>.
  </div>
</div>
