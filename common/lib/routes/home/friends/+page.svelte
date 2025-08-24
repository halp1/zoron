<script lang="ts">
  import { fly } from "svelte/transition";

  import { untrack } from "svelte";

  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  import type { aspen } from "@zoron/common/aspen";
  import { ScheduleBlock, Swipeable } from "@zoron/common/components";
  import { motion } from "@zoron/common/motion";
  import type { Block, Relationship } from "@zoron/common/types";
  import { requests, toast } from "@zoron/common/web";
  import { theme } from "@zoron/common/web/theme";

  import Fa from "svelte-fa";

  import {
    faArrowLeft,
    faCheck,
    faChevronLeft,
    faChevronRight,
    faClose,
  } from "@fortawesome/free-solid-svg-icons";

  const users = page.data.users!.sort((a, b) => {
    // Sort by name alphabetically
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  let relationships = $state(
    (page.data.session!.user!.relationships ?? [])
      .map((rel) => ({
        ...rel,
        userData: users.find((user) => user.id === rel.user),
      }))
      .filter(
        (r): r is { userData: (typeof users)[number] } & Relationship => !!r.userData
      )
  );

  let friend = $state<{
    user: string;
    type: "friend";
    since: Date;
    userData: (typeof users)[number];
    data:
      | {
          status: "loading";
        }
      | {
          status: "loaded";
          schedule: aspen.Types.Schedule.Schedule;
        }
      | {
          status: "error";
          reason: string;
        };
  } | null>(null);

  let search = $state("");
  let selected = $state(0);

  let matches = $derived(
    users
      .filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))
      .filter((user) => user.id !== page.data.session?.user?.id)
      .filter((user) => !relationships.find((u) => u.user === user.id))
      .sort(
        (a, b) =>
          a.name.toLowerCase().indexOf(search.toLowerCase()) -
            b.name.toLowerCase().indexOf(search.toLowerCase()) || // Sort by position of search term in name
          (a.name < b.name ? -1 : 1) // Fallback to alphabetical order
      )
  );

  $effect(() => {
    untrack(() => selected);
    if (selected > matches.length - 1 && matches.length > 0) {
      selected = matches.length - 1;
    } else if (selected < 0) {
      selected = 0;
    } else if (selected > 0 && matches.length === 0) {
      selected = 0;
    }
  });

  let focused = $state(false);

  class actions {
    static request = async (user: (typeof users)[number]) => {
      focused = false;
      search = "";
      selected = 0;

      const res = await requests.post<{
        message: string;
        created: Relationship;
      }>("/api/social/request", { id: user.id });

      if (res.success === false) {
        toast.error(res.error);
      } else {
        relationships = [...relationships, { ...res.data.created, userData: user }];
        toast.success(res.data.message);
      }
    };

    static remove = async (user: (typeof users)[number]) => {
      const res = await requests.post<{
        message: string;
      }>("/api/social/remove", { id: user.id });

      if (res.success === false) {
        toast.error(res.error);
      } else {
        relationships = relationships.filter((rel) => rel.user !== user.id);
        
        toast.success(res.data.message);
      }
    };

    static accept = async (user: (typeof users)[number]) => {
      const res = await requests.post<{
        message: string;
        created: Relationship;
      }>("/api/social/accept", { id: user.id });

      if (res.success === false) {
        toast.error(res.error);
      } else {
        relationships = [
          ...relationships.filter((rel) => rel.user !== user.id), // Remove the old request
          { ...res.data.created, userData: user }, // Add the new accepted relationship
        ];
        toast.success(res.data.message);
      }
    };
  }

  // schedule viewing
  let selectedDay = $state(0);
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
    "bg-indigo-400",
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
      newSchedule.splice(index, 0, {
        type: "lunch",
        color: courseColorMap.get("lunch")!,
      });
    }

    return newSchedule;
  };

  let generated = $derived(
    friend?.data.status === "loaded" && friend.data.schedule
      ? transpose(insertLunches(friend.data.schedule), 6, 7)
      : null
  );

  let showFriend = $state(false);
</script>

<svelte:head>
  <title>Friends | {page.data.env.name}</title>
</svelte:head>

<div class="relative h-screen overflow-hidden">
  <button
    class="btn-circle absolute left-4 top-4 z-50 border-2 border-slate-600"
    onclick={async () => {
      await goto("/account");
    }}
  >
    <Fa icon={faArrowLeft} />
  </button>
  <div
    class="relative flex h-full w-[200vw] md:w-auto md:!transform-none"
    style="transform: translateX(-{!showFriend ? 0 : 100}vw);"
  >
    <div class="h-full w-screen border-r-2 border-slate-600 px-10 pt-10 md:w-1/3">
      <div class="text-center text-4xl">Friends</div>
      <div class="relative">
        <input
          bind:value={search}
          type="text"
          class="mt-5 flex w-full flex-1 rounded-lg border-2 border-slate-600 {$theme ===
          'amoled'
            ? 'bg-black'
            : 'bg-slate-900'} p-4 text-white outline-none"
          onkeydown={async (event) => {
            if (event.key === "ArrowDown") {
              selected = (selected + 1) % matches.length;
              event.preventDefault(); // Prevent scrolling
            } else if (event.key === "ArrowUp") {
              selected = (selected - 1 + matches.length) % matches.length; // Navigate up
              event.preventDefault(); // Prevent scrolling
            } else if (event.key === "Enter") {
              if (!matches[selected]) return;
              actions.request(matches[selected]);
            }
          }}
          onfocus={() => {
            focused = true;
          }}
          onblur={() => {
            focused = false;
          }}
          placeholder="Add a friend..."
        />
        {#if focused}
          <div
            class="no-scroll absolute top-full mt-1 flex max-h-60 w-full flex-col overflow-y-auto rounded-lg border-2 border-slate-600 bg-slate-900 text-white"
          >
            {#if matches.length > 0}
              {#each matches as user, idx (user.id)}
                <button
                  class="flex items-center border-slate-600 p-2 {idx !== 0
                    ? 'border-t-2'
                    : ''} {selected === idx
                    ? `${$theme === 'amoled' ? 'bg-[#1f1f1f]' : 'bg-slate-800 hover:bg-slate-800'}`
                    : `${$theme === 'amoled' ? 'bg-black hover:bg-[#1f1f1f]' : 'bg-slate-800 hover:bg-slate-800'}`}"
                  onmousedown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  ontouchstart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onclick={() => {
                    actions.request(user);
                  }}
                >
                  {user.name}
                  <span class="ml-2 text-sm text-slate-400">({user.email})</span>
                </button>
              {/each}
            {:else}
              <div class="p-2 text-center text-sm text-slate-400">No matches found</div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- <div class="w-full h-0.5 my-3 bg-slate-600 rounded-full"></div> -->
      <div class="mt-5 text-center text-2xl">Requests</div>
      <div class="flex flex-col items-stretch md:flex-row">
        <div class="mt-4 flex-1 md:mt-0">
          <div class="text-center text-xl">Incoming</div>
          {#each relationships.filter((rel) => rel.type === "request-incoming") as rel, idx (rel.user)}
            <div
              class="flex items-center border-slate-600 p-2 {idx !== 0
                ? 'md:border-t-2'
                : ''}"
            >
              <span>{rel.userData.name}</span>
              <div class="mx-2 flex-1 border-t-2 border-dashed border-slate-400"></div>
              <button
                class="btn-circle cursor-pointer border-2 border-slate-600 text-red-500"
                onclick={() => {
                  actions.remove(rel.userData);
                }}
              >
                <Fa icon={faClose} />
              </button>
              <button
                class="btn-circle ml-1 cursor-pointer border-2 border-slate-600 text-green-500"
                onclick={() => {
                  actions.accept(rel.userData);
                }}
              >
                <Fa icon={faCheck} />
              </button>
            </div>
          {/each}

          {#if relationships.filter((rel) => rel.type === "request-incoming").length === 0}
            <div class="p-2 text-center text-sm text-slate-400">No incoming requests</div>
          {/if}
        </div>
        <div class="mx-2 mt-2 hidden w-0.5 rounded-full bg-slate-600 md:block"></div>
        <div class="flex-1">
          <div class="text-center text-xl">Outgoing</div>
          {#each relationships.filter((rel) => rel.type === "request-outgoing") as rel, idx (rel.user)}
            <div
              class="flex items-center border-slate-600 p-2 {idx !== 0
                ? 'md:border-t-2'
                : ''}"
            >
              <span>{rel.userData.name}</span>
              <div class="mx-2 flex-1 border-t-2 border-dashed border-slate-400"></div>
              <button
                class="btn-circle cursor-pointer border-2 border-slate-600 text-red-500"
                onclick={() => {
                  actions.remove(rel.userData);
                }}
              >
                <Fa icon={faClose} />
              </button>
            </div>
          {/each}
          {#if relationships.filter((rel) => rel.type === "request-outgoing").length === 0}
            <div class="p-2 text-center text-sm text-slate-400">No outgoing requests</div>
          {/if}
        </div>
      </div>
      <div class="mt-5 text-center text-2xl">Friends</div>
      <div
        class="grid gap-3 {relationships.filter((rel) => rel.type === 'friend').length ===
        0
          ? 'grid-cols-1'
          : 'grid-cols-1 md:grid-cols-2'}"
      >
        {#each relationships.filter((rel) => rel.type === "friend") as rel, idx (rel.user)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="flex cursor-pointer items-center rounded-full border-slate-600 p-2 hover:bg-white/5"
            onclick={async () => {
              showFriend = true;

              // @ts-expect-error
              friend = {
                ...rel,
                data: {
                  status: "loading",
                },
              };

              const res = await requests.get<aspen.Types.Schedule.Schedule>(
                `/api/social/schedules/${rel.user}`
              );
              if (res.success === false && friend)
                friend.data = { status: "error", reason: res.error };
              else if (res.success === true && friend)
                friend.data = { status: "loaded", schedule: res.data };
            }}
          >
            <span>{rel.userData.name}</span>
            <div class="mx-2 flex-1 border-t-2 border-dashed border-slate-400"></div>
            <button
              class="btn-circle cursor-pointer border-2 border-slate-600 text-red-500"
              onclick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                actions.remove(rel.userData);
              }}
            >
              <Fa icon={faClose} />
            </button>
          </div>
        {/each}
        {#if relationships.filter((rel) => rel.type === "friend").length === 0}
          <div class="p-2 text-center text-sm text-slate-400">
            No friends {":("}
          </div>
        {/if}
      </div>
    </div>
    <div class="relative flex w-screen flex-col md:w-2/3">
      <button
        class="btn-circle absolute left-4 top-4 border-2 border-slate-600 md:hidden"
        onclick={() => {
          showFriend = false;
        }}
      >
        <Fa icon={faArrowLeft} />
      </button>
      {#if !friend}
        <div class="m-auto text-center text-2xl">Select a friend to view details.</div>
      {:else}
        <div class=" mx-4 my-auto md:m-auto">
          <div class="text-center text-2xl">{friend.userData.name}</div>
          <div class="mt-1 text-center text-slate-400">
            {friend.userData.email}
          </div>
          {#if friend.data.status === "loading"}
            <div class="text-center text-slate-500">Loading schedule...</div>
          {:else if friend.data.status === "error"}
            <div class="text-center text-red-500">
              Error loading schedule: {friend.data.reason}
            </div>
          {:else}
            <div class="h-full">
              {#if generated}
                <div
                  class="custom-scroll hidden min-h-full flex-1 justify-center overflow-auto pt-10 md:flex"
                >
                  <div class="grid min-h-full grid-cols-6 border-0 border-slate-800">
                    {#each generated as block, i}
                      <ScheduleBlock
                        index={i}
                        {block}
                        className="border-b-4 border-r-4 {i <= 5 ? 'border-t-4' : ''} {i %
                          6 ===
                        0
                          ? 'border-l-4'
                          : ''}"
                        day={i % 6}
                        lunch={friend.data.schedule.lunches[i % 6]}
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

                    return applyChange();
                  }}
                >
                  {#key selectedDay}
                    <div
                      class="grid h-full w-full"
                      style="grid-template-rows: repeat(15, minmax(0, 1fr));"
                    >
                      <div
                        class="mb-1 mt-4 flex w-full items-center justify-center gap-4 text-center text-xl"
                      >
                        <button
                          class="btn-circle border-2 border-slate-600"
                          onclick={async () => {
                            selectedDay = (selectedDay + 5) % 6;
                          }}
                        >
                          <Fa icon={faChevronLeft} />
                        </button>
                        <div class="mx-auto">
                          Day {selectedDay + 1}
                        </div>
                        <button
                          class="btn-circle border-2 border-slate-600"
                          onclick={async () => {
                            selectedDay = (selectedDay + 1) % 6;
                          }}
                        >
                          <Fa icon={faChevronRight} />
                        </button>
                      </div>
                      {#each generated.filter((_, i) => i % 6 === selectedDay) as block, idx}
                        <ScheduleBlock
                          index={idx}
                          {block}
                          className="border-2 border-slate-800 row-span-2"
                          freeFontSize="text-2xl"
                          day={selectedDay}
                          lunch={friend.data.schedule.lunches[selectedDay]}
                        />
                      {/each}
                    </div>
                  {/key}
                </Swipeable>
              {:else}
                <div class="text-center text-slate-500">No schedule available</div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
