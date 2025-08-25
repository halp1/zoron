<script lang="ts">
  import { run } from "svelte/legacy";
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import type { aspen } from "@zoron/common/aspen";
  import { randomPlaceholderImage } from "@zoron/common/assets/placeholders";
  import { ScheduleBlock, Swipeable } from "@zoron/common/components";
  import { motion } from "@zoron/common/motion";
  import type { Block, CalendarEvent } from "@zoron/common/types";
  import { requests, toast, zoron } from "@zoron/common/web";
  import { theme } from "@zoron/common/web/theme";

  import type { User } from "@auth/sveltekit";

  import Fa from "svelte-fa";

  import {
    faCalendar,
    faChevronLeft,
    faChevronRight,
    faClose,
    faListUl,
    faRotateRight
  } from "@fortawesome/free-solid-svg-icons";

  import { DatePicker } from "date-picker-svelte";
  import _ from "lodash";

  import "./schedule.css";

  const { clamp } = _;

  let schedule = $derived($zoron.schedule as User["schedule"]);

  const uploadSchedule = async () => {
    if (updating) return toast.error("Schedule is already updating");

    let file: File;

    // Check if File System Access API is supported
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({
        types: [
          { accept: { "application/pdf": [".pdf"] }, description: "PDF files" }
        ]
      });
      file = await handle.getFile();
    } else {
      // Fallback to input element
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf,.pdf";
      input.multiple = false;

      const fileSelected = new Promise<File>((resolve, reject) => {
        input.onchange = () => {
          const selectedFile = input.files?.[0];
          if (selectedFile) {
            resolve(selectedFile);
          } else {
            reject(new Error("No file selected"));
          }
        };
        input.oncancel = () => {
          reject(new Error("File selection cancelled"));
        };
      });

      input.click();
      file = await fileSelected;
    }

    const base64Content = await file
      .arrayBuffer()
      .then((buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer))));

    updating = true;
    const currentDate = new Date();
    const cuttoff = new Date(2026, 0, 25);
    const semester = currentDate >= cuttoff ? 2 : 1;

    const { dismiss } = toast.loading("Generating schedule...");
    const res = await requests.post("/api/aspen/schedule/gen", {
      semester,
      schedule: base64Content
    });
    if (res.success === true) {
      history.go(0);
      toast.success("Schedule updated successfully");
    } else toast.error(res.error);
    dismiss();
    updating = false;
  };

  const getLoadingText = (percentage: number) =>
    `Generating schedule (${percentage}%)...`;
  const updateSchedule = async () => {
    if (updating) return toast.error("Schedule is already updating");
    updating = true;
    const currentDate = new Date();
    const cuttoff = new Date(2026, 0, 25);
    const semester = currentDate >= cuttoff ? 2 : 1;

    const { dismiss, update } = toast.loading(getLoadingText(0));
    const res = await requests.stream(
      "/api/aspen/schedule/gen",
      { semester },
      (step, total) => update(getLoadingText(Math.round((step / total) * 100)))
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

  const blockSchedule = [
    ["A1", "B1", "C1", "D1", "E1", "F1"],
    ["E2", "F2", "G1", "H1", "R", "D2"],
    ["B2", "A2", "G2", "H2", "I", "C2"],
    ["A3", "B3", "C3", "D3", "E3", "F3"],
    ["E4", "F4", "G3", "H3", "I", "D4"],
    ["B4", "A4", "G4", "H4", "I", "C4"]
  ];

  const insertLunches = (schedule: aspen.Types.Schedule.Schedule) => {
    const courseColorMap = new Map<string, string>();
    courseColorMap.set("lunch", "bg-gray-400");
    courseColorMap.set("free", "bg-gray-400");
    courseColorMap.set("I-block", "bg-cyan-400");
    courseColorMap.set("custom", "bg-gray-400");
    for (const course of schedule.schedule) {
      if (course === null) continue;
      if (course.course === null) continue;
      if (courseColorMap.has(course.course)) continue;
      courseColorMap.set(
        course.course,
        colors[courseColorMap.size % colors.length]
      );
    }
    const newSchedule: Block[] = schedule.schedule.slice().map((item, idx) =>
      item === null
        ? [2, 4, 5].includes(Math.floor(idx / 6)) && idx % 6 === 4
          ? { type: "I-block", color: courseColorMap.get("I-block")! }
          : {
              type: "free",
              color: courseColorMap.get("free")!,
              block: blockSchedule[Math.floor(idx / 6)][idx % 6]
            }
        : { ...item, type: "block", color: courseColorMap.get(item.course)! }
    );
    for (let i = 6 - 1; i >= 0; i--) {
      const lunch = schedule.lunches[i];
      const index = i * 6 + (lunch === 1 ? 2 : lunch === 2 ? 3 : 4);
      newSchedule.splice(index, 0, {
        type: "lunch",
        color: courseColorMap.get("lunch")!
      });
    }

    return newSchedule;
  };

  let mode: "full" | "day" = $state("day");

  const now = () => new Date(Date.now() + ($zoron.constants?.timeDelta || 0));

  let dayViewDay: Date = $state(now());
  let selectedDay: number = $state(0);
  let generated = $derived(
    schedule
      ? transpose(insertLunches(schedule), 6, 7)
      : (null as any as Block[])
  );

  let datePickerOpen = $state(false);

  let exportModalOpen = $state(false);
  let exportChoice: null | "choobs" = $state(null);

  let updating = $state(false);

  const generateBlocks = (date: Date, calendar: CalendarEvent) => {
    if (!schedule) return { day: "", blocks: [] };
    const currentDayEvents = calendar.items.filter((event) => {
      const eventStartDate = new Date(
        event.start.dateTime || event.start.date!
      );
      const isFullDayEvent = !event.start.dateTime && !event.end.dateTime;

      return (
        (eventStartDate.getDate() === date.getDate() &&
          eventStartDate.getMonth() === date.getMonth() &&
          eventStartDate.getFullYear() === date.getFullYear()) ||
        isFullDayEvent
      );
    });
    const day = currentDayEvents.find(
      (event) =>
        event.summary.toLowerCase().includes("day") ||
        event.summary.toLowerCase().includes("all") ||
        event.summary.toLowerCase().includes("grade 9 only")
    )?.summary!;
    if (!day) return { day: "", blocks: [] };
    const allEvents = currentDayEvents
      .filter(
        (event) =>
          !event.summary.toLowerCase().includes("day") &&
          !event.summary.toLowerCase().includes("all blocks") &&
          !event.summary.toLowerCase().includes("grade 9 only")
      )
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
        progression: calculateProgression(event.start, event.end),
        timeToStart: calculateTimeToStart(event.start)
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
                : day.includes("Day 6")
                  ? 6
                  : 0) - 1;

    const today = (
      dayNumber === -1
        ? $zoron.schedule!.schedule!
        : $zoron.schedule!.schedule!.slice(dayNumber * 6, (dayNumber + 1) * 6)
    ).map((item, idx) =>
      item === null
        ? [2, 4, 5].includes(Math.floor(idx / 6)) && idx % 6 === 4
          ? null
          : {
              block: blockSchedule[Math.max(dayNumber, 0)][idx],
              schedule: null
            }
        : item
    );
    const blocks = today
      .filter((block) => block?.block || block?.schedule)
      .map((block) => block!.block || block!.schedule)
      .map((item) => (item === "HR" ? "Advisory" : item))
      .map((item, idx) =>
        (idx < 2 || idx > 3) && item ? item.replace("$", "") : item
      );

    const blockNames = [
      "Lunch 1",
      "Lunch 2",
      "Lunch 3",
      ..."ABCDEFGH"
        .split("")
        .flatMap((c) =>
          new Array(6)
            .fill(null)
            // prettier is fucking with the $ sign again
            .map((_, i) => [`${c}${i + 1}`, `${c}\u0024${i + 1}`])
        )
        .flat(),
      "I-block",
      "Advisory"
    ];

    const filtered = allEvents.filter(
      (event) =>
        !blockNames.includes(event.name) ||
        blocks.includes(event.name) ||
        event.name === "I-block"
    );

    const unmerged = filtered
      .map((event) => ({
        ...event,
        class: generated.find(
          (b) =>
            ((b as any).block?.replace("$", "") || b.type).trim() ===
              event.name ||
            ((b as any).block || b.type).trim() === event.name ||
            ((b as any).schedule?.trim() === "HR" && event.name === "Advisory")
        ) || {
          type: "other" as const,
          color: "bg-gray-600" as const,
          block: event.name
        }
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const blockEvents: typeof unmerged = [];
    for (let i = 0; i < unmerged.length; i++) {
      const event = unmerged[i];
      const last = blockEvents.at(-1);
      if (
        !last ||
        event.class.type !== "block" ||
        last.class.type !== "block" ||
        event.class.course !== last.class.course
      ) {
        blockEvents.push(event);
      } else {
        last.end = event.end;

        Object.assign(last, {
          progression: calculateProgression(event.start, event.end),
          timeToStart: calculateTimeToStart(event.start)
        });

        // now *define* a true getter for .duration on `last`
        Object.defineProperty(last, "duration", {
          enumerable: true,
          configurable: true,
          get() {
            return (this.end.getTime() - this.start.getTime()) / 1000 / 60;
          }
        });
      }
    }

    if (
      day.toLowerCase().includes("half day") ||
      day.toLowerCase().includes("half-day")
    ) {
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
          last.duration =
            (last.end.getTime() - last.start.getTime()) / 1000 / 60;
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
      const lunchData =
        allEvents.find((event) =>
          event.name.includes(`Lunch ${targetLunch}`)
        ) || allEvents.find((event) => event.name.includes("Lunch"))!;
      return {
        day,
        blocks: [
          ...blockEvents.filter(
            (b) => b.class.type !== "other" || b.class.block !== "Lunch"
          ),
          {
            ...lunchData,
            class: {
              type: "lunch" as const,
              lunch: lunchData.name.includes((targetLunch || -1).toString())
                ? targetLunch
                : 0
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
        calendarId:
          "lexingtonma.org_qud45cvitftvgc317tsd2vqctg@group.calendar.google.com",
        singleEvents: true,
        timeZone: "America/New_York",
        maxResults: 20,
        timeMin: `${key}T04:00:00-04:00`,
        timeMax: `${key}T23:59:59-04:00`,
        key: "AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs"
      }
    );

    if (!res.success)
      toast.error(
        "A network error occurred while trying to load the schedule."
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
        : ((now().getTime() - start.getTime()) /
            (end.getTime() - start.getTime())) *
          100;

  const calculateTimeToStart = (start: Date): number | null =>
    // @ts-ignore
    now().getTime() < start.getTime() &&
    now().getTime() >= start.getTime() - 60 * 5 * 1000
      ? Math.round((start.getTime() - now().getTime()) / 1000 / 60)
      : null;

  let dayCache = $state(new Map<string, Awaited<ReturnType<typeof loadDay>>>());
  let day: Awaited<ReturnType<typeof loadDay>> | null = $state(null);
  let dayKey = $state(0);
  run(() => {
    mode === "day" &&
      $zoron.schedule &&
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
  });

  const dateToTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  let key = $state(0);

  onMount(() => {
    let frame: number;
    const tick = async () => {
      key++;
      if (mode === "day" && day) {
        for (let i = 0; i < day.blocks.length; i++) {
          day.blocks[i].progression = calculateProgression(
            day.blocks[i].start,
            day.blocks[i].end
          );
          day.blocks[i].timeToStart = calculateTimeToStart(day.blocks[i].start);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // keybinds
    const keydown = async (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        (
          document.querySelector("#day-transition") as HTMLDivElement
        ).style.transform =
          "translateX(100vw)" +
          (document.querySelector("#day-transition") as HTMLDivElement).style
            .transform;
        await new Promise((r) => setTimeout(r, 200));

        dayViewDay = new Date(dayViewDay.getTime() - 1000 * 60 * 60 * 24);
        swipeDirection = "right";
      } else if (e.key === "ArrowRight") {
        (
          document.querySelector("#day-transition") as HTMLDivElement
        ).style.transform =
          "translateX(-100vw)" +
          (document.querySelector("#day-transition") as HTMLDivElement).style
            .transform;
        await new Promise((r) => setTimeout(r, 200));
        dayViewDay = new Date(dayViewDay.getTime() + 1000 * 60 * 60 * 24);
        swipeDirection = "left";
      }
    };

    const touch = () => {
      datePickerOpen = false;
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("touchstart", touch);
    window.addEventListener("mousedown", touch);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("touchstart", touch);
      window.removeEventListener("mousedown", touch);
    };
  });

  let swipeDirection: "left" | "right" = $state("left");

  let swipeStart: {
    x: number;
    y: number;
  } | null = $state(null);

  let swipeVelocity = $state(0);
  let lastSwipeY = $state(0);

  let dayViewRef: HTMLDivElement | null = $state(null);

  $effect(() => {
    const touchStart = (
      e: TouchEvent & {
        currentTarget: EventTarget & HTMLDivElement;
      }
    ) => {
      e.currentTarget.parentElement!.scrollTop = 0;
      e.preventDefault();
      swipeStart = {
        x: e.touches[0].clientX,
        y:
          e.touches[0].clientY -
          parseInt(e.currentTarget.getAttribute("data-swipe") || "0")
      };
      e.currentTarget.style.transition = "none";

      lastSwipeY = swipeStart.y;
    };
    const touchMove = (
      e: TouchEvent & {
        currentTarget: EventTarget & HTMLDivElement;
      }
    ) => {
      e.currentTarget.parentElement!.scrollTop = 0;
      if (!swipeStart) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const deltaX = x - swipeStart.x;
      const deltaY = y - swipeStart.y;
      swipeVelocity = y - lastSwipeY;
      lastSwipeY = y;
      if (Math.abs(deltaX) > 50 && deltaY < 50) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
      }
      e.currentTarget.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) scale(${Math.max(0, (1000 - Math.abs(deltaX)) / 1000)})`;
    };
    const touchEnd = (
      e: TouchEvent & {
        currentTarget: EventTarget & HTMLDivElement;
      }
    ) => {
      e.currentTarget.parentElement!.scrollTop = 0;
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
        const clamped = clamp(
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
    };

    const scrollHandler = (
      e: WheelEvent & { currentTarget: HTMLDivElement }
    ) => {
      // reset transform
      (e.currentTarget.children[0] as HTMLDivElement).style.transform =
        "translateY(0px) scale(1)";
    };

    dayViewRef?.addEventListener("touchstart", touchStart as any, {
      passive: false
    });
    dayViewRef?.addEventListener("touchmove", touchMove as any, {
      passive: false
    });
    dayViewRef?.addEventListener("touchend", touchEnd as any, {
      passive: false
    });
    dayViewRef?.parentElement?.addEventListener("wheel", scrollHandler as any, {
      passive: false
    });

    let frame: number;
    const tick = () => {
      console.log(swipeVelocity);
      if (swipeVelocity > 0) {
        swipeVelocity -= Math.min(1, swipeVelocity);
      } else if (swipeVelocity < 0) {
        swipeVelocity += Math.min(1, -swipeVelocity);
      }

      if (swipeVelocity != 0 && dayViewRef && !swipeStart) {
        const currentYTransform = getComputedStyle(dayViewRef).transform;
        const matrix = new DOMMatrix(currentYTransform);
        matrix.translateSelf(0, swipeVelocity * 10);
        matrix.e = 0;
        console.log(matrix.toString());
        dayViewRef.style.transform = matrix.toString();
      }
      frame = requestAnimationFrame(tick);
    };

    // frame = requestAnimationFrame(tick);
    return () => {
      dayViewRef?.removeEventListener("touchstart", touchStart as any);
      dayViewRef?.removeEventListener("touchmove", touchMove as any);
      dayViewRef?.removeEventListener("touchend", touchEnd as any);
      dayViewRef?.parentElement?.removeEventListener(
        "wheel",
        scrollHandler as any
      );
      // cancelAnimationFrame(frame)	;
    };
  });

  let windowWidth = $state(
    typeof window === "undefined" ? 767 : window.innerWidth
  );
  let isMobile = $derived(windowWidth < 768);
  onMount(() => {
    const handleResize = () => {
      windowWidth = window.innerWidth;
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });
</script>

<svelte:head>
  <title>Schedule | {page.data.env.name}</title>
</svelte:head>

{#if !schedule}
  <div class="flex h-full flex-col items-center justify-center gap-3">
    <div
      class="text-2xl"
      in:fly|global={{
        delay: 250,
        duration: 1000,
        opacity: 0,
        y: -20,
        easing: motion.transitions.spring(400, 20)
      }}
    >
      Your schedule has not been loaded
    </div>
    <button
      class="btn-full btn-outlined text-base"
      onclick={page.data.env.pro ? updateSchedule : uploadSchedule}
      in:fly|global={{
        delay: 350,
        duration: 1000,
        opacity: 0,
        y: -20,
        easing: motion.transitions.spring(400, 20)
      }}>{page.data.env.pro ? "Load" : "Upload"} Schedule</button
    >
    <div
      class="flex max-w-96 flex-wrap items-center justify-center gap-1 px-3 text-slate-600"
    >
      {#each "Your schedule pdf will be parsed automatically, so you don't have to input anything manually!".split(" ") as word, idx}
        <span
          in:fly|global={{
            delay: 450 + idx * 30,
            duration: 1000,
            opacity: 0,
            x: -20,
            easing: motion.transitions.spring(400, 20)
          }}>{word}</span
        >
      {/each}
    </div>
  </div>
{:else}
  <div
    class="relative flex h-full flex-col-reverse items-center gap-3 px-10 md:flex-row md:pt-0"
  >
    <div
      class="backdrop-blur-xs fixed z-10 mb-4 flex items-center gap-3 rounded-full border-white p-2 md:left-6 md:top-1/2 md:mb-0 md:-translate-y-1/2 md:flex-col"
      class:border-2={$theme === "amoled"}
      in:fly|global={{
        delay: 200,
        duration: 1000,
        opacity: 0,
        x: isMobile ? 0 : -20,
        y: isMobile ? 20 : 0,
        easing: motion.transitions.spring(300, 30)
      }}
    >
      <button
        class="btn-circle relative border-2 bg-black {$theme === 'amoled'
          ? 'border-white'
          : 'border-slate-600'} {mode === 'day'
          ? $theme === 'amoled'
            ? 'invert'
            : 'bg-blue-600 hover:bg-blue-400'
          : ''}"
        onclick={() => {
          mode = "day";
        }}
        title="Single day view"
      >
        <Fa
          icon={faListUl}
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </button>
      <button
        ontouchstart={(e) => e}
        class="btn-circle relative border-2 bg-black {$theme === 'amoled'
          ? 'border-white'
          : 'border-slate-600'} {mode === 'full'
          ? $theme === 'amoled'
            ? 'invert'
            : 'bg-blue-600 hover:bg-blue-400'
          : ''}"
        onclick={() => {
          mode = "full";
          datePickerOpen = false;
        }}
        title="Full schedule view"
      >
        <Fa
          icon={faCalendar}
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </button>
      <!-- <button
        class="btn-circle relative border-2 {$theme === "amoled" ? "border-white" : "border-slate-600"}"
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
        class="btn-circle relative border-2 {$theme === 'amoled'
          ? 'border-white'
          : 'border-slate-600'}"
        onclick={page.data.env.pro ? updateSchedule : uploadSchedule}
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
      <div class="flex flex-1 flex-col md:ml-16 md:min-h-full">
        <div
          class="mt-[env(safe-area-inset-top)] py-2 text-center text-slate-600"
          in:fly|global={{
            delay: 200,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(300, 30)
          }}
        >
          Click a class to see who you share it with.
        </div>
        <div
          class="custom-scroll hidden flex-1 justify-center overflow-auto pb-10 md:flex"
        >
          <div class="grid min-h-full grid-cols-6 border-0 border-slate-800">
            {#each generated as block, i}
              <ScheduleBlock
                index={i}
                {block}
                className="border-b-4 border-r-4 {i <= 5
                  ? 'border-t-4'
                  : ''} {i % 6 === 0 ? 'border-l-4' : ''}"
                lunch={schedule.lunches[i % 6]}
                day={i % 6}
              />
            {/each}
          </div>
        </div>
        <Swipeable
          className="md:hidden flex-1 relative w-full"
          onswipe={(e) => {
            const applyChange = () => {
              if (e === "left") selectedDay = (selectedDay + 1) % 6;
              else selectedDay = (selectedDay + 5) % 6;
            };

            if (!document.startViewTransition) return applyChange();
            document.startViewTransition(() => {
              swipeDirection = e;
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
              {#each generated.filter((_, i) => i % 6 === selectedDay) as block, idx}
                <ScheduleBlock
                  index={idx}
                  {block}
                  className="border-2 border-slate-800 row-span-2"
                  freeFontSize="text-2xl"
                  day={selectedDay}
                  lunch={schedule.lunches[selectedDay]}
                />
              {/each}
            </div>
          {/key}
        </Swipeable>
      </div>
    {:else}
      <div
        class="relative mx-auto flex h-full w-80 flex-col items-center gap-5 overflow-x-visible md:h-full md:flex-none"
      >
        <div
          class="absolute left-1/2 top-0 z-10 mt-5 flex w-96 -translate-x-1/2 flex-col items-center gap-5 rounded-2xl border-2 border-white bg-black/20 p-2 pt-0 backdrop-blur-sm"
        >
          <div
            class="-mb-3 mt-3 text-xl text-slate-400"
            in:fly|global={{
              delay: 250,
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
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
          <div
            class="text-sm text-slate-500"
            in:fly|global={{
              delay: 350,
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            {#key key}
              School clocks are {Math.abs(
                ($zoron.constants?.timeDelta || 0) / 1000
              ).toFixed(0)} seconds
              {($zoron.constants?.timeDelta || 0) < 0 ? "behind" : "ahead"}: {now().toLocaleTimeString()}
            {/key}
          </div>

          {#if !day}
            <div
              in:fly|global={{
                delay: 450,
                duration: 1000,
                opacity: 0,
                y: -20,
                easing: motion.transitions.spring(400, 20)
              }}
            >
              loading...
            </div>
          {:else}
            <div class="relative flex w-full justify-center gap-2">
              <button
                in:fly|global={{
                  delay: 450,
                  duration: 1000,
                  opacity: 0,
                  y: -20,
                  easing: motion.transitions.spring(400, 20)
                }}
                class="btn-circle border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'}"
                onclick={async () => {
                  (
                    document.querySelector("#day-transition") as HTMLDivElement
                  ).style.transform =
                    "translateX(100vw)" +
                    (
                      document.querySelector(
                        "#day-transition"
                      ) as HTMLDivElement
                    ).style.transform;
                  await new Promise((r) => setTimeout(r, 200));

                  dayViewDay = new Date(
                    dayViewDay.getTime() - 1000 * 60 * 60 * 24
                  );
                  swipeDirection = "right";
                }}
              >
                <Fa icon={faChevronLeft} />
              </button>
              <button
                in:fly|global={{
                  delay: 520,
                  duration: 1000,
                  opacity: 0,
                  y: -20,
                  easing: motion.transitions.spring(400, 20)
                }}
                class="btn-circle border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'}"
                onclick={async () => {
                  const target = now();

                  const direction = target < dayViewDay ? "left" : "right";
                  (
                    document.querySelector("#day-transition") as HTMLDivElement
                  ).style.transform =
                    `translateX(${direction === "left" ? "" : "-"}100vw)` +
                    (
                      document.querySelector(
                        "#day-transition"
                      ) as HTMLDivElement
                    ).style.transform;
                  await new Promise((r) => setTimeout(r, 200));

                  dayViewDay = target;
                  swipeDirection = direction === "left" ? "right" : "left";
                }}
              >
                <Fa icon={faRotateRight} />
              </button>
              <div
                class="mx-auto text-center text-2xl"
                in:fly|global={{
                  delay: 600,
                  duration: 1000,
                  opacity: 0,
                  y: -20,
                  easing: motion.transitions.spring(400, 20)
                }}
              >
                {#if !day.day || day.blocks.length === 0}
                  No school
                {:else}
                  {day.day}
                {/if}
              </div>
              <button
                in:fly|global={{
                  delay: 675,
                  duration: 500,
                  opacity: 0,
                  y: -20,
                  easing: motion.transitions.spring(400, 20)
                }}
                class="btn-circle border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'}"
                onclick={async () => {
                  datePickerOpen = !datePickerOpen;
                }}
              >
                <Fa icon={faCalendar} />
              </button>{#if datePickerOpen}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div
                  class="absolute right-0 top-10 z-10 {$theme === 'amoled'
                    ? 'invert'
                    : ''}"
                  transition:fly|global={{
                    delay: 0,
                    duration: 1000,
                    opacity: 0,
                    y: -30,
                    easing: motion.transitions.spring(300, 20)
                  }}
                  onmousedown={(e) => {
                    e.stopPropagation();
                  }}
                  ontouchstart={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <DatePicker
                    on:select={async (event: any) => {
                      datePickerOpen = false;

                      const target = event.detail;

                      const direction = target < dayViewDay ? "left" : "right";
                      (
                        document.querySelector(
                          "#day-transition"
                        ) as HTMLDivElement
                      ).style.transform =
                        `translateX(${direction === "left" ? "" : "-"}100vw)` +
                        (
                          document.querySelector(
                            "#day-transition"
                          ) as HTMLDivElement
                        ).style.transform;
                      await new Promise((r) => setTimeout(r, 200));

                      dayViewDay = target;
                      swipeDirection = direction === "left" ? "right" : "left";
                    }}
                  />
                </div>
              {/if}
              <button
                in:fly|global={{
                  delay: 750,
                  duration: 1000,
                  opacity: 0,
                  y: -20,
                  easing: motion.transitions.spring(400, 20)
                }}
                class="btn-circle border-2 {$theme === 'amoled'
                  ? 'border-white'
                  : 'border-slate-600'}"
                onclick={async () => {
                  (
                    document.querySelector("#day-transition") as HTMLDivElement
                  ).style.transform =
                    "translateX(-100vw)" +
                    (
                      document.querySelector(
                        "#day-transition"
                      ) as HTMLDivElement
                    ).style.transform;
                  await new Promise((r) => setTimeout(r, 200));
                  dayViewDay = new Date(
                    dayViewDay.getTime() + 1000 * 60 * 60 * 24
                  );
                  swipeDirection = "left";
                }}
              >
                <Fa icon={faChevronRight} />
              </button>
            </div>
          {/if}
        </div>

        {#if day}
          {#key dayKey}
            <div
              id="day-transition"
              class="no-scroll overflow-x-visible overflow-y-scroll"
              style="padding: 0 10000px 0 10000px; margin: 0 -10000px 0 -10000px;"
            >
              <div
                class="flex min-h-[60vh] min-w-[336px] flex-col items-center gap-5 animate-in-{swipeDirection} pb-20 pt-44 md:pb-5"
                style="transition: inherit;"
                bind:this={dayViewRef}
              >
                {#if day.day && day.blocks.length !== 0}
                  {#each day.blocks as block}
                    <div
                      id={block.progression ? "progression" : ""}
                      style={block.class?.type === "lunch"
                        ? "border: double 3px transparent; background-clip: padding-box, border-box; background-image: linear-gradient(#263048E5, #263048E5), linear-gradient(45deg, #fc4778e5, #3952f5e5); background-origin: border-box;"
                        : block.class?.type === "free"
                          ? "border: double 3px transparent; background-clip: padding-box, border-box; background-image: linear-gradient(#263048E5, #263048E5), linear-gradient(45deg, #dc2626e5, #eab308e5); background-origin: border-box;"
                          : ""}
                      class="w-80 rounded-xl border-2 {$theme === 'amoled'
                        ? 'bg-black/90'
                        : 'bg-[#263048]/90'} relative shadow-xl backdrop-blur-xl {block
                        .class?.type === 'block'
                        ? block.class.color.replace('bg', 'border')
                        : block.class?.type === 'I-block'
                          ? 'border-cyan-400'
                          : 'border-slate-600'}"
                    >
                      <div
                        class="rounded-xl p-5"
                        class:bg-black={$theme === "amoled"}
                        class:bg-slate-800={$theme === "zoron"}
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
                                    : block.class.lunch === 3
                                      ? "Third"
                                      : ""}
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

                        <div class="italic">
                          {dateToTime(block.start)} - {dateToTime(block.end)}
                        </div>
                        <div class="italic">
                          {block.duration} minutes
                          {#if block.timeToStart}
                            <span class="ml-1"></span>
                            Starts in {Math.floor(
                              block.timeToStart / 1000 / 60
                            )}:{Math.floor(
                              ((block.timeToStart / 1000 / 60) % 1) * 60
                            )
                              .toString()
                              .padStart(2, "0")}
                          {/if}
                          {#if block.progression},
                            <span class="ml-1"></span>
                            {Math.floor(
                              block.duration -
                                (block.progression / 100) * block.duration
                            )}:{Math.floor(
                              ((block.duration -
                                (block.progression / 100) * block.duration) %
                                1) *
                                60
                            )
                              .toString()
                              .padStart(2, "0")} remaining
                          {/if}
                        </div>
                        {#if block.progression}
                          <div
                            class="relative mt-2 flex h-6 items-center border-2 {$theme ===
                            'amoled'
                              ? 'bg-black'
                              : 'bg-slate-800'} text-sm {block.class?.type ===
                            'block'
                              ? block.class.color.replace('bg', 'border')
                              : block.class?.type === 'I-block'
                                ? 'border-cyan-400'
                                : 'border-slate-600'}"
                          >
                            <div class="z-10 pl-2">
                              {block.progression.toFixed(0)}%
                            </div>
                            <div
                              class="absolute left-0 top-0 h-full {block.class
                                ?.type === 'block'
                                ? block.class.color
                                : 'bg-slate-600'}"
                              style="width: {block.progression}%"
                            ></div>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="rounded-3xl bg-slate-700 p-3 backdrop-blur-3xl">
                    <img
                      src={randomPlaceholderImage()}
                      class="h-80 w-80"
                      alt="placeholder"
                    />
                  </div>
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
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed bottom-0 left-0 right-0 top-0 grid place-items-center bg-slate-900/90 backdrop-blur-xl"
    onclick={({ currentTarget, target }) => {
      if (currentTarget === target) {
        exportModalOpen = false;
        exportChoice = null;
      }
    }}
  >
    <div
      class="relative flex flex-col items-center rounded-lg bg-slate-800 p-5"
    >
      <button
        class="btn-circle absolute right-2 top-2"
        onclick={() => {
          exportModalOpen = false;
          exportChoice = null;
        }}><Fa icon={faClose} /></button
      >
      <div class="text-2xl">Export Calendar</div>
      <div class="text-sm text-slate-400">
        Use this calendar on other sites, imported automatically.
      </div>
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
