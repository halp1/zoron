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
      | number;
  }
  let merged = $page.data.activity?.merged as (GradeWithData | Attendance)[] | undefined;
</script>

{#if merged}
  {#each merged as item, idx}
    <div class="flex items-center gap-3">
      {#if item.type === "grade"}
        <div class="border-x-4 border-x-slate-600 px-2">
          <span class="text-green-300">Grade</span> - {item.class}
        </div>
        {item.assignment}:
        <div class="flex h-8 items-center justify-center border-4 border-slate-600 px-2">
          {#if !item.scoring || typeof item.scoring === "number"}
            {item.grade}
          {:else if item.scoring.scored.toString().trim() === item.grade.trim()}
            {item.grade} / {item.scoring.total} ({item.scoring.percentage}%)
          {:else}
            {item.grade} ({item.scoring.scored} / {item.scoring.total} - {item.scoring.percentage}%)
          {/if}
        </div>

        <div class="ml-auto" />
        {#if typeof item.scoring === "number"}
          <div class="relative ml-2 h-2 w-12 overflow-hidden rounded-full bg-slate-600">
            <div
              class="absolute left-0 top-0 h-full bg-green-300"
              style="width: {item.scoring * 100}%"
            ></div>
          </div>
        {/if}
        <div class="flex items-center gap-2">
          {#if !item.scoring && typeof item.scoring !== "number"}
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
{/if}
