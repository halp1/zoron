<script lang="ts">
  import { page } from "$app/stores";
  import type { Assignment, Attendance, PeriodAttendance, PostedGrade } from "$lib/aspen/types";
  import type { aspen } from "$lib/aspen";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import { requests, toast } from "$lib/web";
  import {
    faGraduationCap,
    faCalendarCheck,
    faInfoCircle,

    faCheckCircle

  } from "@fortawesome/free-solid-svg-icons";
  import { onMount } from "svelte";
  import Fa from "svelte-fa";
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

  const existingData = $page.data?.preloadedActivity || [];
  let merged = undefined as
    | (Attendance | PeriodAttendance | GradeWithData | PostedGrade)[]
    | undefined;

  onMount(() => {
    (async () => {
      const activity = await $page.data.activity;
      merged = activity.merged!;
      if (!merged || (window as any).loadingActivity) return;
      (window as any).loadingActivity = true;
      merged.forEach((item, idx) => {
        if (item.type !== "grade") return;
        const existing = existingData.find((existing) => existing.id === item.id);
        if (!existing || !existing.lastLoaded || existing.lastLoaded !== item.grade.trim())
          merged![idx] = { ...item, scoring: 0 };
        else merged![idx] = { ...item, scoring: existing.data };
      });

      const res = await requests.stream(
        "/api/aspen/assignment/all",
        merged
          .filter((item) => item.type === "grade" && typeof item.scoring === "number")
          .map((item) => ({
            assignment: item,
            studentID: activity.raw["recent-activity-list"]["recent-activity"][0].$.studentoid
          })),
        (steps, total, id, data) => {
          try {
            const item = merged!.find((item) => (item as any).id === id);
            if (!item || item.type !== "grade") return;
            if (data || data === null) {
              merged![merged!.indexOf(item)] = { ...item, scoring: data };
            } else {
              merged![merged!.indexOf(item)] = { ...item, scoring: steps / total };
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
  });
</script>

<svelte:head>
  <title>Activity | {$page.data.env.name}</title>
</svelte:head>
<div class=" my-10 flex w-full flex-1 flex-col gap-2 border-l-4 border-slate-600">
  {#if !merged}
    {#each Array.from({ length: 60 }) as _}
      <div class="my-2 flex items-center gap-3">
        <Skeleton class="ml-3 h-4" style="width: {Math.random() * 150 + 75 + 90}px" />
        <Skeleton class="h-4 flex-1" />
        <Skeleton class="h-4 w-24" />
      </div>
    {/each}
  {:else}
    {#each merged as item, idx}
      <div class="flex min-h-8 items-center gap-3">
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

          <div class="h-[2px] flex-1 bg-slate-600" />
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
          <div class="h-[2px] flex-1 bg-slate-600" />
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
            <div class="text-sm text-slate-400 -ml-2">Excused</div>
          {:else}
						<div class="text-sm text-slate-400 -ml-2">Unexcused</div>
					{/if}

          <div class="h-[2px] flex-1 bg-slate-600" />
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
					<div class="h-[2px] flex-1 bg-slate-600" />
				{/if}
        <div class="hidden text-slate-400 sm:block">{item.date}</div>
        <div class="text-slate-400 sm:hidden">
          {item.date.split("-")[1]}/{item.date.split("-")[2]}
        </div>
      </div>
    {/each}
  {/if}
  <div class="ml-4 text-sm text-slate-400">
    <Fa icon={faInfoCircle} class="float-left mr-2 mt-[3px]" />
    Activity only goes back 60 days. To see more, visit
    <a href="/home/grades" class="underline">your grades</a>.
  </div>
</div>
