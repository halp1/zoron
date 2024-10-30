<script lang="ts">
  import { page } from "$app/stores";
  import type { aspen } from "$lib/aspen";
  import { requests, toast } from "$lib/web";
  import {
    faCalendarDay,
    faCalendarDays,
    faFileExport,
    faClose,
    faInfoCircle,
    faRotateRight
  } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import choobs from "../../../assets/choobs.png";
  import { Collapsible } from "$lib/components";
  import { updateChoobsSchedule } from "./choobs";

  $: schedule = ($page.data.session?.user || {}).schedule;

  const getLoadingText = (percentage: number) => `Generating schedule (${percentage}%)...`;
  const updateSchedule = async () => {
    if (updating) return toast.error("Schedule is already updating");
    updating = true;
    const currentDate = new Date();
    const jan25_2024 = new Date(2024, 0, 25); // January is month 0 in JavaScript Date
    const semester = currentDate >= jan25_2024 ? 2 : 1;

    const { dismiss, update } = toast.loading("Generating schedule (0%)...");
    const res = await requests.stream("/api/aspen/schedule/gen", { semester }, (step, total) =>
      update(getLoadingText((step / total) * 100))
    );
    if (res.success === true) {
      history.go(0);
      toast.success("Schedule updated successfully");
    } else toast.error(res.error);
    dismiss();
    updating = false;
  };

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

  let mode: "full" | "day" = "full";

  let exportModalOpen = false;
  let exportChoice: null | "choobs" = null;

  let updating = false;
</script>

{#if !schedule}
  <div class="flex h-full flex-col items-center justify-center gap-3">
    <button class="btn-full btn-outlined text-base" on:click={updateSchedule}> Download </button>
  </div>
{:else}
  <div class="relative flex h-full items-center gap-3">
    <div class="flex flex-col items-center gap-3">
      <button
        class="btn-circle {mode === 'day' ? 'bg-blue-600 hover:bg-blue-400' : ''}"
        on:click={() => {
          mode = "day";
        }}
        title="Single day  view"
      >
        <Fa icon={faCalendarDay} />
      </button>
      <button
        class="btn-circle {mode === 'full' ? 'bg-blue-600 hover:bg-blue-400' : ''}"
        on:click={() => {
          mode = "full";
        }}
        title="Full schedule view"
      >
        <Fa icon={faCalendarDays} />
      </button>
      <button
        class="btn-circle"
        on:click={() => {
          exportModalOpen = true;
        }}
        title="Export schedule"
      >
        <Fa icon={faFileExport} />
      </button>
      <button
        class="btn-circle"
        on:click={updateSchedule}
        disabled={updating}
        title="Refresh schedule"
      >
        <Fa icon={faRotateRight} />
      </button>
    </div>
    {#if mode === "full"}
      <div class="custom-scroll flex min-h-full flex-1 justify-center overflow-auto">
        <div class="grid min-h-full grid-cols-6 border-4 border-slate-800">
          {#each transpose(insertLunches(schedule), 6, 7) as block, i}
            <div
              class="{i >= 42 - 6 ? '' : 'border-b-4'} {i % 6 === 5
                ? ''
                : 'border-r-4'} row-span-1 flex flex-col items-center gap-2 border-slate-800 py-2 {block.color} bg-opacity-50"
            >
              {#if block.type === "block"}
                <div
                  class="relative px-2 text-center text-sm font-bold"
                  style="word-wrap: break-word;"
                >
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
      </div>
    {:else}
      <div class="custom-scroll flex max-w-96 flex-col gap-5"></div>
    {/if}
  </div>
{/if}

{#if exportModalOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed bottom-0 left-0 right-0 top-0 grid place-items-center bg-slate-900 bg-opacity-20 backdrop-blur-xl"
    on:click={({ currentTarget, target }) => {
      if (currentTarget === target) {
        exportModalOpen = false;
        exportChoice = null;
      }
    }}
  >
    <div class="relative flex flex-col items-center rounded-lg bg-slate-800 p-5">
      <button
        class="btn-circle absolute right-2 top-2"
        on:click={() => {
          exportModalOpen = false;
          exportChoice = null;
        }}><Fa icon={faClose} /></button
      >
      <div class="text-2xl">Export Calendar</div>
      <div class="text-sm text-slate-400">
        Use this calendar on other sites, imported automatically.
      </div>
      <Collapsible open={exportChoice === null}>
        <div class="pb-3">
          <button
            on:click={() => {
              exportChoice = "choobs";
            }}
            class="btn-full btn-outlined mt-3 flex items-center justify-center gap-2 px-1 py-1 text-base"
          >
            <img src={choobs} class="h-8 rounded-lg" alt="choobs.app icon" />
            Export to choobs.app
          </button>
        </div>
      </Collapsible>
      <Collapsible open={exportChoice === "choobs"}>
        <form
          on:submit={async (e) => {
            e.preventDefault();
            if (!schedule?.schedule) return toast.error("Schedule not loaded");
            // @ts-expect-error chooobs not a property of target
            const password = e.target?.choobs?.value;
            if (!password || typeof password !== "string" || password.length <= 0)
              return toast.error("Password is required");
            if (!$page.data.session?.user?.email) return toast.error("User not logged in");
            const { dismiss } = toast.loading("Exporting schedule...");
            try {
              await updateChoobsSchedule(
                schedule.schedule,
                $page.data.session?.user?.email,
                password
              );
              toast.success("Schedule exported successfully");
              exportModalOpen = false;
              exportChoice = null;
              // @ts-expect-error choobs not a property of target
              e.target.choobs.value = "";
            } catch (e) {
              // @ts-expect-error e is unknown
              toast.error(`Failed to export schedule (${e.message})`);
            }
            dismiss();
          }}
          class="flex w-full flex-wrap items-center gap-2 pt-2"
        >
          <input
            class="min-w-72 rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-3 py-2 outline-none focus-within:border-solid focus-within:outline-none"
            name="choobs"
            placeholder="Enter your choobs.app password"
            type="password"
            autocomplete="off"
            required
          />
          <button class="btn-full btn-outlined border-blue-600 py-2 text-base">Export</button>
        </form>
        <div class="mx-auto w-96 py-2 text-sm text-slate-400">
          <Fa icon={faInfoCircle} class="float-left mr-2 mt-[3px]" />
          Your password is used once to write your schedule to your account. It is never sent to an server
          or stored.
        </div>
      </Collapsible>
    </div>
  </div>
{/if}
