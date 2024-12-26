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
    faRotateRight,
    faChevronLeft,
    faChevronRight
  } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import choobs from "../../../assets/choobs.png";
  import { Collapsible, Swipeable, ScheduleBlock } from "$lib/components";
  import { updateChoobsSchedule } from "./choobs";
  import type { CalendarEvent, Block } from "$lib/types";
  import "./schedule.css";
  import { onMount } from "svelte";
  import type { User } from "@auth/sveltekit";
  import { fade } from "svelte/transition";
  import _ from "lodash";

  $: schedule = $page.data.schedule as User["schedule"];

  const getLoadingText = (percentage: number) => `Generating schedule (${percentage}%)...`;
  const updateSchedule = async () => {
    if (updating) return toast.error("Schedule is already updating");
    updating = true;
    const currentDate = new Date();
    const jan25_2024 = new Date(2025, 0, 25);
    const semester = currentDate >= jan25_2024 ? 2 : 1;

    const { dismiss, update } = toast.loading(getLoadingText(0));
    const res = await requests.stream("/api/aspen/schedule/gen", { semester }, (step, total) =>
      update(getLoadingText(Math.round((step / total) * 100)))
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
    // "bg-lime-400",
    // "bg-teal-400"
  ];
  // @ts-expect-error for the tailwind
  "border-red-400" ||
    "border-blue-400" ||
    "border-purple-400" ||
    "border-orange-400" ||
    "border-green-400" ||
    "border-yellow-400" ||
    "border-pink-400" ||
    "border-indigo-400";
  ("border-lime-400");
  ("border-teal-400");

  const insertLunches = (schedule: aspen.Types.Schedule.Schedule) => {
    const courseColorMap = new Map<string, string>();
    courseColorMap.set("lunch", "bg-gray-400");
    courseColorMap.set("free", "bg-gray-400");
    courseColorMap.set("I-block", "bg-cyan-400");
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
            ? { type: "I-block", color: courseColorMap.get("I-block")! }
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

  let mode: "full" | "day" = "day";

  const now = () => new Date(Date.now() + ($page.data.constants?.timeDelta || 0));

  let dayViewDay: Date = now();
  let selectedDay: number = 0;
  $: generated = schedule ? transpose(insertLunches(schedule), 6, 7) : (null as any as Block[]);

  let exportModalOpen = false;
  let exportChoice: null | "choobs" = null;

  let updating = false;

  const generateBlocks = (date: Date, calendar: CalendarEvent) => {
    if (!schedule) return { day: "", blocks: [] };
    const currentDayEvents = calendar.items.filter((event) => {
      const eventStartDate = new Date(event.start.dateTime || event.start.date!);
      const isFullDayEvent = !event.start.dateTime && !event.end.dateTime;

      return (
        (eventStartDate.getDate() === date.getDate() &&
          eventStartDate.getMonth() === date.getMonth() &&
          eventStartDate.getFullYear() === date.getFullYear()) ||
        isFullDayEvent
      );
    });
    const day = currentDayEvents.find((event) => event.summary.includes("Day"))?.summary!;
    if (!day) return { day: "", blocks: [] };
    const allEvents = currentDayEvents
      .filter((event) => !event.summary.includes("Day"))
      .map((event) => ({
        name: event.summary.trim(),
        start: new Date(event.start.dateTime || event.start.date!),
        end: new Date(event.end.dateTime || event.end.date!)
      }))
      .map((event) => ({
        ...event,
        get duration() {
          // @ts-expect-error ts is buggin
          return (this.end.getTime() - this.start.getTime()) / 1000 / 60;
        },
        progression: calculateProgression(event.start, event.end)
      }));
    if (allEvents.length === 0) return { day, blocks: [] };

    const dayNumber =
      (day.includes("Day 1")
        ? 1
        : day.includes("Day 2")
          ? 2
          : day.includes("Day 3")
            ? 3
            : day.includes("Day 4")
              ? 4
              : day.includes("Day 5")
                ? 5
                : 6) - 1;

    const today = $page.data.schedule!.schedule!.slice(dayNumber * 6, (dayNumber + 1) * 6);
    const blocks = today
      .filter((block) => block?.block || block?.schedule)
      .map((block) => block!.block || block!.schedule)
      .map((item) => (item === "HR" ? "Advisory" : item))
      .map((item, idx) => ((idx < 2 || idx > 3) && item ? item.replace("$", "") : item));

    const filtered = allEvents.filter(
      (event) => blocks.includes(event.name) || event.name === "I-block"
    );

    const blockEvents = filtered.map((event) => ({
      ...event,
      class: generated.find(
        (b) =>
          ((b as any).block?.replace("$", "") || b.type).trim() === event.name ||
          ((b as any).block || b.type).trim() === event.name ||
          ((b as any).schedule?.trim() === "HR" && event.name === "Advisory")
      ) || {
        type: "other" as const,
        color: "bg-gray-400" as const,
        block: event.name
      }
    }));
    if (day.includes("Half Day")) {
      const last = blockEvents.at(-1);
      if (
        !last ||
        (last.class.type === "block" &&
          "room" in last.class &&
          !Number.isNaN(parseInt(last.class.room)) &&
          parseInt(last.class.room) < 500)
      ) {
        if (last) {
          last.end = new Date(last.end.getTime() - 1000 * 60 * 30);
          last.duration = (last.end.getTime() - last.start.getTime()) / 1000 / 60;
        }
        // second lunch
        return {
          day,
          blocks: [
            ...blockEvents,
            {
              ...allEvents.find((event) => event.name.includes("Lunch 2"))!,
              class: { type: "lunch" as const, lunch: 2 as const }
            }
          ].sort((a, b) => a.start.getTime() - b.start.getTime())
        };
      }

      // first lunch
      last.start = new Date(last.start.getTime() + 1000 * 60 * 30);
      last.duration = (last.end.getTime() - last.start.getTime()) / 1000 / 60;
      return {
        day,
        blocks: [
          ...blockEvents,
          {
            ...allEvents.find((event) => event.name.includes("Lunch 1"))!,
            class: {
              type: "lunch" as const,
              lunch: 1 as const
            }
          }
        ].sort((a, b) => a.start.getTime() - b.start.getTime())
      };
    } else {
      const targetLunch = schedule?.lunches[dayNumber];
      return {
        day,
        blocks: [
          ...blockEvents,
          {
            ...allEvents.find((event) => event.name.includes(`Lunch ${targetLunch}`))!,
            class: {
              type: "lunch" as const,
              lunch: targetLunch
            }
          }
        ].sort((a, b) => a.start.getTime() - b.start.getTime())
      };
    }
  };
  const loadDay = async (date: Date) => {
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      .toISOString()
      .split("T")[0];

    const res = await requests.get<CalendarEvent>(
      "https://www.googleapis.com/calendar/v3/calendars/lexingtonma.org_qud45cvitftvgc317tsd2vqctg%40group.calendar.google.com/events",
      {
        calendarId: "lexingtonma.org_qud45cvitftvgc317tsd2vqctg@group.calendar.google.com",
        singleEvents: true,
        timeZone: "America/New_York",
        maxResults: 20,
        timeMin: `${key}T04:00:00-04:00`,
        timeMax: `${key}T23:59:59-04:00`,
        key: "AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs"
      }
    );

    if (!res.success) throw res.error;
    return generateBlocks(date, res.data);
  };

  const calculateProgression = (start: Date, end: Date): number | null =>
    // @ts-ignore
    now().getTime() < start.getTime()
      ? null
      : now().getTime() > end.getTime()
        ? null
        : ((now().getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;

  let dayCache = new Map<string, Awaited<ReturnType<typeof loadDay>>>();
  let day: Awaited<ReturnType<typeof loadDay>> | null = null;
  let dayKey = 0;
  $: mode === "day" &&
    $page.data.schedule &&
    typeof window !== "undefined" &&
    (async () => {
      if (dayCache.has(dayViewDay.toISOString())) {
        day = dayCache.get(dayViewDay.toISOString())!;
        dayKey++;
        return;
      }
      const d = await loadDay(dayViewDay);
      day = d;
      dayKey++;
      dayCache.set(dayViewDay.toISOString(), d);

      // load day to left and right
      const left = new Date(dayViewDay.getTime() - 1000 * 60 * 60 * 24);
      const right = new Date(dayViewDay.getTime() + 1000 * 60 * 60 * 24);
      if (!dayCache.has(left.toISOString())) {
        const d = await loadDay(left);
        dayCache.set(left.toISOString(), d);
      }
      if (!dayCache.has(right.toISOString())) {
        const d = await loadDay(right);
        dayCache.set(right.toISOString(), d);
      }
    })();

  const dateToTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  let key = 0;

  onMount(() => {
    let frame: number;
    const tick = async () => {
      key++;
      if (mode === "day" && day) {
        for (let i = 0; i < day.blocks.length; i++) {
          day.blocks[i].progression = calculateProgression(day.blocks[i].start, day.blocks[i].end);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    setTimeout(
      () => document.getElementById("progression")?.scrollIntoView({ behavior: "smooth" }),
      300
    );

    // keybinds
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        dayViewDay = new Date(dayViewDay.getTime() - 1000 * 60 * 60 * 24);
        swipeDirection = "right";
      } else if (e.key === "ArrowRight") {
        dayViewDay = new Date(dayViewDay.getTime() + 1000 * 60 * 60 * 24);
        swipeDirection = "left";
      }
    };
    window.addEventListener("keydown", keydown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", keydown);
    };
  });

  let swipeDirection: "left" | "right" = "left";

  let swipeStart: {
    x: number;
    y: number;
  } | null = null;
</script>

{#if !schedule}
  <div class="flex h-full flex-col items-center justify-center gap-3">
    <div class="text-2xl">Your schedule has not been loaded</div>
    <button class="btn-full btn-outlined text-base" on:click={updateSchedule}>Load Schedule</button>
    <div class="flex max-w-96 flex-wrap items-center justify-center gap-1 px-3 text-slate-600">
      {#each "Once your schedule is loaded, it can updated once every 24 hours via the {icon} button".split(" ") as word}
        {#if word === "{icon}"}
          <Fa icon={faRotateRight} />
        {:else}
          <span>{word}</span>
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <div class="relative flex h-full flex-col-reverse items-center gap-3 md:flex-row md:pt-0">
    <div
      class="-mb-3 hidden items-center gap-3 rounded-full bg-slate-800 p-2 md:mb-0 md:flex md:flex-col"
    >
      <button
        class="btn-circle relative border-2 border-slate-600 {mode === 'day'
          ? 'bg-blue-600 hover:bg-blue-400'
          : ''}"
        on:click={() => {
          mode = "day";
        }}
        title="Single day view"
      >
        <Fa
          icon={faCalendarDay}
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </button>
      <button
        class="btn-circle relative border-2 border-slate-600 {mode === 'full'
          ? 'bg-blue-600 hover:bg-blue-400'
          : ''}"
        on:click={() => {
          mode = "full";
        }}
        title="Full schedule view"
      >
        <Fa
          icon={faCalendarDays}
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </button>
      <!-- <button
        class="btn-circle relative border-2 border-slate-600"
        on:click={() => {
          exportModalOpen = true;
        }}
        title="Export schedule"
      >
        <Fa
          icon={faFileExport}
          class="absolute left-1/2 top-1/2 ml-[2px] -translate-x-1/2 -translate-y-1/2"
        />
      </button> -->
      <button
        class="btn-circle relative border-2 border-slate-600"
        on:click={updateSchedule}
        disabled={updating}
        title="Refresh schedule"
      >
        <Fa
          icon={faRotateRight}
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </button>
    </div>
    {#if mode === "full"}
      <div
        class="custom-scroll hidden min-h-full flex-1 justify-center overflow-auto py-10 md:flex"
      >
        <div class="grid min-h-full grid-cols-6 border-4 border-slate-800">
          {#each generated as block, i}
            <ScheduleBlock
              {block}
              className="{i >= 42 - 6 ? '' : 'border-b-4'} {i % 6 === 5 ? '' : 'border-r-4'}"
            />
          {/each}
        </div>
      </div>
      <Swipeable
        className="md:hidden flex-1 relative w-full"
        on:swipe={(e) => {
          const applyChange = () => {
            if (e.detail === "left") selectedDay = (selectedDay + 1) % 6;
            else selectedDay = (selectedDay + 5) % 6;
          };

          if (!document.startViewTransition) return applyChange();
          document.startViewTransition(() => {
            swipeDirection = e.detail;
            applyChange();
            return new Promise((r) => setTimeout(r, 150));
          });
        }}
      >
        {#key selectedDay}
          <div
            class="day-anim-{swipeDirection} grid h-full w-full"
            style="grid-template-rows: repeat(15, minmax(0, 1fr));"
          >
            <div class="-mb-1 text-center text-xl">Day {selectedDay + 1}</div>
            {#each generated.filter((_, i) => i % 6 === selectedDay) as block}
              <ScheduleBlock
                {block}
                className="border-2 border-slate-800 row-span-2"
                freeFontSize="text-2xl"
              />
            {/each}
          </div>
        {/key}
      </Swipeable>
    {:else}
      <div class="mx-auto flex h-full w-80 flex-col items-center gap-5 overflow-x-visible">
        <div class="-mb-3 mt-3 text-xl text-slate-400">
          {dayViewDay.toLocaleDateString("en-US", { weekday: "long" })},
          {[
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ][dayViewDay.getMonth()]}
          {dayViewDay.getDate()}{(() => {
            switch (dayViewDay.getDate()) {
              case 1:
                return "st";
              case 2:
                return "nd";
              case 3:
                return "rd";
              default:
                return "th";
            }
          })()}, {dayViewDay.getFullYear()}
        </div>
        <div class="text-sm text-slate-500">
          {#key key}
            School clocks are {Math.abs(($page.data.constants?.timeDelta || 0) / 1000).toFixed(0)} seconds
            {($page.data.constants?.timeDelta || 0) < 0 ? "behind" : "ahead"}: {now().toLocaleTimeString()}
          {/key}
        </div>

        {#if !day}
          loading...
        {:else}
          <div class="flex w-full justify-center">
            <button
              class="btn-circle border-2 border-slate-600"
              on:click={async () => {
                // @ts-expect-error
                document.querySelector("#day-transition").style.transform =
                  // @ts-expect-error
                  "translateX(100vw)" + document.querySelector("#day-transition").style.transform;
                await new Promise((r) => setTimeout(r, 200));

                dayViewDay = new Date(dayViewDay.getTime() - 1000 * 60 * 60 * 24);
                swipeDirection = "right";
              }}
            >
              <Fa icon={faChevronLeft} />
            </button>
            <div class="mx-auto text-center text-2xl">
              {#if !day.day || day.blocks.length === 0}
                No school
              {:else}
                {day.day}
              {/if}
            </div>
            <button
              class="btn-circle border-2 border-slate-600"
              on:click={async () => {
                // @ts-expect-error
                document.querySelector("#day-transition").style.transform =
                  // @ts-expect-error
                  "translateX(-100vw)" + document.querySelector("#day-transition").style.transform;
                await new Promise((r) => setTimeout(r, 200));
                dayViewDay = new Date(dayViewDay.getTime() + 1000 * 60 * 60 * 24);
                swipeDirection = "left";
              }}
            >
              <Fa icon={faChevronRight} />
            </button>
          </div>
          {#key dayKey}
            <div
              id="day-transition"
              class="no-scroll overflow-x-visible overflow-y-scroll"
              style="padding: 0 10000px 0 10000px; margin: 0 -10000px 0 -10000px;"
            >
              <div
                class="flex min-h-[60vh] min-w-[336px] flex-col items-center gap-5 pb-5 pr-2 animate-in-{swipeDirection}"
                style="transition: inherit;"
                on:touchstart={(e) => {
                  e.preventDefault();
                  swipeStart = {
                    x: e.touches[0].clientX,
                    y:
                      e.touches[0].clientY -
                      parseInt(e.currentTarget.getAttribute("data-swipe") || "0")
                  };
                  e.currentTarget.style.transition = "none";
                }}
                on:touchmove={(e) => {
                  if (!swipeStart) return;
                  const x = e.touches[0].clientX;
                  const y = e.touches[0].clientY;
                  const deltaX = x - swipeStart.x;
                  const deltaY = y - swipeStart.y;
                  if (Math.abs(deltaX) > 50 && deltaY < 50) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                  e.currentTarget.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) scale(${Math.max(0, (1000 - Math.abs(deltaX)) / 1000)})`;
                }}
                on:touchend={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.transition = "inherit";
                  if (!swipeStart) return;
                  const x = e.changedTouches[0].clientX;
                  const y = e.changedTouches[0].clientY;
                  const deltaX = x - swipeStart.x;
                  const deltaY = y - swipeStart.y;
                  if (Math.abs(deltaX) > 100) {
                    if (deltaX > 0) {
                      dayViewDay = new Date(dayViewDay.getTime() - 1000 * 60 * 60 * 24);
                      swipeDirection = "right";
                      e.currentTarget.style.transform = `translateX(100vw) translateY(${deltaY}px) scale(0)`;
                    } else {
                      dayViewDay = new Date(dayViewDay.getTime() + 1000 * 60 * 60 * 24);
                      swipeDirection = "left";
                      e.currentTarget.style.transform = `translateX(-100vw) translateY(${deltaY}px) scale(0)`;
                    }
                  } else {
                    const clamped = _.clamp(
                      deltaY,
                      -(
                        (e.currentTarget.parentElement?.scrollHeight || 0) -
                        (e.currentTarget.parentElement?.offsetHeight || 0)
                      ),
                      0
                    );
                    e.currentTarget.style.transform = `translateY(${clamped}px) scale(1)`;
                    e.currentTarget.setAttribute("data-swipe", clamped.toString());
                  }
                  swipeStart = null;
                }}
              >
                {#if day.day && day.blocks.length !== 0}
                  {#each day.blocks as block}
                    <div
                      id={block.progression ? "progression" : ""}
                      style={block.class?.type === "lunch"
                        ? "border: double 3px transparent; background-clip: padding-box, border-box; background-image: linear-gradient(#263048E5, #263048E5), linear-gradient(45deg, #fc4778e5, #3952f5e5); background-origin: border-box;"
                        : ""}
                      class="w-80 rounded-xl border-2 bg-[#263048] bg-opacity-90 p-5 shadow-xl backdrop-blur-xl {block
                        .class?.type === 'block'
                        ? block.class.color.replace('bg', 'border')
                        : block.class?.type === 'I-block'
                          ? 'border-cyan-400'
                          : 'border-slate-600'}"
                    >
                      <div class="flex items-center">
                        <div>
                          {#if block.class?.type === "block"}
                            {block.class.description}
                          {:else if block.class.type === "free"}
                            Free
                          {:else if block.class.type === "I-block"}
                            I Block
                          {:else if block.class.type === "lunch"}
                            {#if "lunch" in block.class}
                              {block.class.lunch === 1
                                ? "First"
                                : block.class.lunch === 2
                                  ? "Second"
                                  : "Third"}
                            {/if}
                            Lunch
                          {:else}
                            {"block" in block ? block.block : block.name}
                          {/if}
                        </div>
                        <div class="ml-auto">
                          {#if block.class?.type === "block"}
                            Room: <strong>{block.class.room}</strong>
                          {/if}
                        </div>
                      </div>

                      <div class="italic">{dateToTime(block.start)} - {dateToTime(block.end)}</div>
                      <div class="italic">
                        {block.duration} minutes
                        {#if now().getTime() - block.start.getTime() < 0 && now().getTime() - block.start.getTime() >= -1000 * 60 * 5}
                          <span class="ml-1"></span>
                          Starts in {Math.floor(
                            (block.start.getTime() - now().getTime()) / 1000 / 60
                          )}:{Math.floor(
                            (((block.start.getTime() - now().getTime()) / 1000 / 60) % 1) * 60
                          )
                            .toString()
                            .padStart(2, "0")}
                        {/if}
                        {#if block.progression},
                          <span class="ml-1"></span>
                          {Math.floor(
                            block.duration - (block.progression / 100) * block.duration
                          )}:{Math.floor(
                            ((block.duration - (block.progression / 100) * block.duration) % 1) * 60
                          )
                            .toString()
                            .padStart(2, "0")} remaining
                        {/if}
                      </div>
                      {#if block.progression}
                        <div
                          class="relative mt-2 flex h-6 items-center border-2 bg-slate-800 text-sm {block
                            .class?.type === 'block'
                            ? block.class.color.replace('bg', 'border')
                            : block.class?.type === 'I-block'
                              ? 'border-cyan-400'
                              : 'border-slate-600'}"
                        >
                          <div class="z-10 pl-2">{block.progression.toFixed(0)}%</div>
                          <div
                            class="absolute left-0 top-0 h-full {block.class?.type === 'block'
                              ? block.class.color
                              : 'bg-slate-600'}"
                            style="width: {block.progression}%"
                          ></div>
                        </div>
                      {/if}
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          {/key}
        {/if}
      </div>
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

<style>
  .day-anim-left {
    view-transition-name: schedule-in-out-left;
  }

  .day-anim-right {
    view-transition-name: schedule-in-out-right;
  }

  @keyframes slide-in-left {
    from {
      transform: translateX(-100vw);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-in-right {
    from {
      transform: translateX(100vw);
    }
    to {
      transform: translateX(0);
    }
  }

  .animate-in-left {
    animation: slide-in-right 0.3s;
  }
  .animate-in-right {
    animation: slide-in-left 0.3s;
  }
</style>
