<script lang="ts">
  import { onNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import type { aspen } from "$lib/aspen";
  import type { Assignment, Attendance } from "$lib/aspen/types";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import { requests, toast } from "$lib/web";
  import { faDownload, faGraduationCap, faCalendarCheck } from "@fortawesome/free-solid-svg-icons";
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

  const existingData = $page.data.session?.user?.activity || [];

  let merged = $page.data.activity?.merged as (GradeWithData | Attendance)[] | undefined;
  onMount(() => {
    if (!merged || (window as any).loadingActivity) return;
    (window as any).loadingActivity = true;
    (async () => {
      merged.forEach((item, idx) => {
        if (item.type !== "grade") return;
        const existing = existingData.find((existing) => existing.id === item.id);
        if (!existing) merged[idx] = { ...item, scoring: 0 };
        else merged[idx] = { ...item, scoring: existing.data };
      });
      const res = await requests.stream(
        "/api/aspen/assignment/all",
        merged
          .filter((item) => item.type === "grade" && typeof item.scoring === "number")
          .map((item) => ({
            assignment: item,
            studentID:
              $page.data.activity.raw["recent-activity-list"]["recent-activity"][0].$.studentoid
          })),
        (steps, total, id, data) => {
          try {
            const item = merged.find((item) => item.id === id);
            if (!item || item.type === "attendance") return;
            if (data || data === null) {
              merged[merged.indexOf(item)] = { ...item, scoring: data };
            } else {
              merged[merged.indexOf(item)] = { ...item, scoring: steps / total };
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

    onNavigate(() => {
      (window as any).loadingActivity = false;
    });
  });
</script>

<svelte:head>
  <title>Activity | A+spen</title>
</svelte:head>
<div class="no-scroll flex w-full flex-1 flex-col gap-2 overflow-auto border-l-4 border-slate-600">
  {#if merged}
    {#each merged as item, idx}
      <div class="flex items-center gap-3">
        {#if item.type === "grade"}
          <div class="hidden border-r-4 border-slate-600 px-2 sm:block">
            <span class="text-green-300">Grade</span> -
            <a
              href="/home/grades#{encodeURIComponent(item.class)}"
              class="border-b-2 border-slate-600 border-opacity-0 text-blue-300 hover:border-opacity-100"
              >{item.class}</a
            >
          </div>
          <div class="flex pl-2 sm:hidden"><Fa icon={faGraduationCap} color="#4ade80" /></div>
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
          <!-- <div class="flex items-center gap-2">
            {#if item.scoring === undefined}
              <button
                class="btn-circle"
                on:click={async (e) => {
                  e.preventDefault();
                  if (
                    merged.filter((item) => "scoring" in item && typeof item.scoring === "number")
                      .length > 1
                  )
                    return toast.error("Slow down...");
                  item.scoring = 0;
                  const res = await requests.stream(
                    "/api/aspen/assignment",
                    {
                      assignment: item,
                      studentID:
                        $page.data.activity.raw["recent-activity-list"]["recent-activity"][0].$
                          .studentoid
                    },
                    (steps, total) => {
                      item.scoring = steps / total;
                    }
                  );
                  if (!res.success) {
                    item.scoring = undefined;
                    return toast.error(`Error loading assignment data: ${res.error}`);
                  }
                  // @ts-expect-error
                  merged[idx] = { ...item, scoring: res.data };
                }}
              >
                <Fa icon={faDownload} />
              </button>
            {/if}
          </div> -->
        {:else}
          <div class="hidden px-2 sm:block">
            <span class="text-yellow-300">Attendance</span> - {item.class}
          </div>
          <div class="flex px-2 sm:hidden"><Fa icon={faCalendarCheck} color="#fde047" /></div>

          <div class="">Period:</div>
          {item.period}
          <div class="">Code:</div>
          {item.code}
        {/if}
        <div class="ml-auto" />
        <div class="hidden text-slate-400 sm:block">{item.date}</div>
        <div class="text-slate-400 sm:hidden">
          {item.date.split("-")[1]}/{item.date.split("-")[2]}
        </div>
      </div>
    {/each}
  {/if}
</div>
