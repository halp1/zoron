<script lang="ts">
  import { page } from "$app/stores";
  import type { aspen } from "$lib/aspen";
  import { requests, toast } from "$lib/web";

  $: schedule = ($page.data.session?.user || {}).schedule;

  const getLoadingText = (percentage: number) => `Generating schedule (${percentage}%)...`;
  const transpose = <T,>(arr: T[], width: number, height: number): T[] =>
    arr.map((_, i) => arr[(i % width) * height + Math.floor(i / width)]);

  const colors = [
    "bg-red-400",
    "bg-blue-400",
    "bg-purple-400",
    "bg-orange-400",
    "bg-green-400",
    "bg-yellow-400",
    "bg-pink-400",
    "bg-indigo-400"
  ];

  type Block =
    | ({
        type: "block";
        color: string;
      } & aspen.Types.Schedule.Course)
    | {
        type: "free";
        color: string;
      }
    | { type: "i-block"; color: string }
    | { type: "lunch"; color: string };

  const insertLunches = (schedule: aspen.Types.Schedule.Schedule) => {
    const courseColorMap = new Map<string, string>();
    courseColorMap.set("lunch", "bg-gray-400");
    courseColorMap.set("free", "bg-gray-400");
    courseColorMap.set("i-block", "bg-cyan-400");
    for (const course of schedule.schedule) {
      if (course === null) continue;
      if (course.course === null) continue;
      if (courseColorMap.has(course.course)) continue;
      courseColorMap.set(course.course, colors[courseColorMap.size % colors.length]);
    }
    const newSchedule: Block[] = schedule.schedule
      .slice()
      .map((item, idx) =>
        item === null
          ? [2, 4, 5].includes(Math.floor(idx / 6)) && idx % 6 === 4
            ? { type: "i-block", color: courseColorMap.get("i-block")! }
            : { type: "free", color: courseColorMap.get("free")! }
          : { ...item, type: "block", color: courseColorMap.get(item.course)! }
      );
    for (let i = 6 - 1; i >= 0; i--) {
      const lunch = schedule.lunches[i];
      const index = i * 6 + (lunch === 1 ? 2 : lunch === 2 ? 3 : 4);
      newSchedule.splice(index, 0, { type: "lunch", color: courseColorMap.get("lunch")! });
    }

    return newSchedule;
  };
</script>

{#if !schedule}
  <div class="flex h-full flex-col items-center justify-center gap-3">
    <button
      class="btn-full btn-outlined text-base"
      on:click={async () => {
        const { dismiss, update } = toast.loading("Generating schedule (0%)...");
        const res = await requests.stream(
          "/api/aspen/schedule/gen",
          { semester: 1 },
          (step, total) => update(getLoadingText((step / total) * 100))
        );
        if (res.success === true) history.go(0);
        else toast.error(res.error);
        dismiss();
      }}
    >
      Download
    </button>
  </div>
{:else}
  <div class="grid h-full grid-cols-6 border-4 border-slate-800">
    {#each transpose(insertLunches(schedule), 6, 7) as block, i}
      <div
        class="{i >= 42 - 6 ? '' : 'border-b-4'} {i % 6 === 5
          ? ''
          : 'border-r-4'} row-span-1 flex flex-col items-center gap-2 border-slate-800 py-2 {block.color} bg-opacity-50"
      >
        {#if block.type === "block"}
          <div class="relative px-2 text-center text-sm font-bold" style="word-wrap: break-word">
            {block.description}
          </div>
          <div class="mt-auto flex w-full items-center px-2 text-sm">
            <div class="mr-auto">Room <strong>{block.room}</strong></div>
            <div class="relative ml-auto inline-flex items-center gap-2">
              {#if block.block}
                {block.block}
              {/if}
            </div>
          </div>
        {:else}
          <div class="my-auto text-xl">
            {block.type === "lunch" ? "Lunch" : block.type === "i-block" ? "I Block" : "Free"}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
