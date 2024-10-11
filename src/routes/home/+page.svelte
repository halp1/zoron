<script lang="ts">
  import { page } from "$app/stores";
  import type { aspen } from "$lib/aspen";
  import type { Assignment, Attendance } from "$lib/aspen/types";
  import { requests, toast } from "$lib/web";
  import { faDownload } from "@fortawesome/free-solid-svg-icons";
  import { onMount } from "svelte";
  import Fa from "svelte-fa";
  import { writable } from "svelte/store";
  interface GradeWithData extends Assignment {
    scoring?:
      | {
          percentage: number;
          scored: number;
          total: number;
        }
      | true;
  }
  let merged = $page.data.activity?.merged as (GradeWithData | Attendance)[] | undefined;

  let activityContainer: HTMLDivElement | null = null;

  let scroll = 0;

  $: scrollHeight = activityContainer?.scrollHeight || 0.00001;
</script>

<main class="flex h-screen w-full flex-col items-center justify-center py-10">
  <div class="mb-10 text-4xl">Activity</div>
  {#if merged}
    <div
      bind:this={activityContainer}
      on:resize={(e) => {}}
      on:scroll={(e) => {
        scroll = e.currentTarget.scrollTop;
      }}
      class="no-scroll relative flex w-5/6 flex-1 flex-col gap-2 overflow-auto border-4 border-dashed border-slate-600 p-6"
    >
      <!-- <div
        class="absolute right-0 h-[16.6%] w-2 bg-slate-500"
        style="top: {scroll +
          (scroll /
            (scrollHeight - (activityContainer?.clientHeight ?? 0) * 0.166)) *
            (activityContainer?.getBoundingClientRect()?.height ??
              0 - (activityContainer?.clientHeight ?? 0) * 0.166)}px;"
      ></div> -->
      {#each merged as item, idx}
        <div class="flex items-center gap-3">
          {#if item.type === "grade"}
            <div class="border-x-4 border-x-slate-600 px-2">
              <span class="text-green-300">Grade</span> - {item.class}
            </div>
            {item.assignment}:
            <div class="flex h-8 items-center justify-center border-4 border-slate-600 px-2">
              {#if !item.scoring || item.scoring === true}
                {item.grade}
              {:else if item.scoring.scored.toString().trim() === item.grade.trim()}
                {item.grade} / {item.scoring.total} ({item.scoring.percentage}%)
              {:else}
                {item.grade} ({item.scoring.scored} / {item.scoring.total} - {item.scoring
                  .percentage}%)
              {/if}
            </div>

            <div class="ml-auto" />
            {#if item.scoring === true}
              <div class="text-slate-400">loading...</div>
            {/if}
            <div class="flex items-center gap-2">
              {#if !item.scoring}
                <button
                  class="btn-circle"
                  on:click={async (e) => {
                    e.preventDefault();
                    if (
                      merged.filter((item) => "scoring" in item && item.scoring === true).length > 1
                    )
                      return toast.error("Slow down...");
                    item.scoring = true;
                    const res = await requests.post("/api/aspen/assignment", {
                      assignment: item,
                      studentID:
                        $page.data.activity.raw["recent-activity-list"]["recent-activity"][0].$
                          .studentoid
                    });
                    if (!res.success) {
                      item.scoring = undefined;
                      return toast.error(`Error loading assignment data: ${res.error}`);
                    }
                    // @ts-expect-error no typescript arg
                    merged[idx] = { ...item, scoring: res.data };
                  }}
                >
                  <Fa icon={faDownload} />
                </button>
              {/if}
            </div>
            <div class="text-slate-400">{item.date}</div>
          {:else}
            <div class="border-x-4 border-x-slate-600 px-2">
              <span class="text-blue-300">Attendance</span> - {item.class}
            </div>

            <div class="">Period:</div>
            {item.period}
            <div class="">Code:</div>
            {item.code}

            <div class="ml-auto" />
            <div class="text-slate-400">{item.date}</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</main>
