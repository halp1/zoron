<script lang="ts">
  import { untrack } from "svelte";

  import { page } from "$app/state";

  import type { aspen } from "$lib/aspen";
  import type { Relationship } from "$lib/types";
  import { requests, toast } from "$lib/web";

  import Fa from "svelte-fa";

  import { faCheck, faClose } from "@fortawesome/free-solid-svg-icons";

  const users = page.data.users!.sort((a, b) => {
    // Sort by name alphabetically
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  let relationships = $state(
    page.data
      .session!.user!.relationships!.map((rel) => ({
        ...rel,
        userData: users.find((user) => user.id === rel.user)
      }))
      .filter(
        (r): r is { userData: (typeof users)[number] } & Relationship =>
          !!r.userData
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
        relationships = [
          ...relationships,
          { ...res.data.created, userData: user }
        ];
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
          { ...res.data.created, userData: user } // Add the new accepted relationship
        ];
        toast.success(res.data.message);
      }
    };
  }
</script>

<svelte:head>
  <title>Friends | {page.data.env.name}</title>
</svelte:head>

<main class="relative flex h-screen w-screen">
  <div class="flex-1 border-r-2 border-slate-600 px-10 py-10">
    <div class="text-center text-4xl">Friends</div>
    <div class="relative">
      <input
        bind:value={search}
        type="text"
        class="mt-5 flex w-full flex-1 rounded-lg border-2 border-slate-600 bg-slate-900 p-4 text-white outline-none"
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
                class="flex items-center p-2 hover:bg-slate-800 {idx !== 0
                  ? 'border-t-2 border-slate-600'
                  : ''} {selected === idx ? 'bg-slate-800' : 'bg-transparent'}"
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
            <div class="p-2 text-center text-sm text-slate-400">
              No matches found
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- <div class="w-full h-0.5 my-3 bg-slate-600 rounded-full"></div> -->
    <div class="mt-5 text-center text-2xl">Requests</div>
    <div class="flex items-stretch">
      <div class="flex-1">
        <div class="text-center text-xl">Incoming</div>
        {#each relationships.filter((rel) => rel.type === "request-incoming") as rel, idx (rel.user)}
          <div
            class="flex items-center border-slate-600 p-2 {idx !== 0
              ? 'border-t-2'
              : ''}"
          >
            <span>{rel.userData.name}</span>
            <div
              class="mx-2 flex-1 border-t-2 border-dashed border-slate-400"
            ></div>
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
          <div class="p-2 text-center text-sm text-slate-400">
            No incoming requests
          </div>
        {/if}
      </div>
      <div class="mx-2 mt-2 w-0.5 rounded-full bg-slate-600"></div>
      <div class="flex-1">
        <div class="text-center text-xl">Outgoing</div>
        {#each relationships.filter((rel) => rel.type === "request-outgoing") as rel, idx (rel.user)}
          <div
            class="flex items-center border-slate-600 p-2 {idx !== 0
              ? 'border-t-2'
              : ''}"
          >
            <span>{rel.userData.name}</span>
            <div
              class="mx-2 flex-1 border-t-2 border-dashed border-slate-400"
            ></div>
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
          <div class="p-2 text-center text-sm text-slate-400">
            No outgoing requests
          </div>
        {/if}
      </div>
    </div>
    <div class="mt-5 text-center text-2xl">Friends</div>
    <div
      class="grid gap-3 {relationships.filter((rel) => rel.type === 'friend')
        .length === 0
        ? 'grid-cols-1'
        : 'grid-cols-1 md:grid-cols-2'}"
    >
      {#each relationships.filter((rel) => rel.type === "friend") as rel, idx (rel.user)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="flex cursor-pointer items-center rounded-full border-slate-600 p-2 hover:bg-white/5 {idx !==
          0
            ? 'border-t-2'
            : ''}"
          onclick={async () => {
            // @ts-expect-error
            friend = {
              ...rel,
              data: {
                status: "loading"
              }
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
          <div
            class="mx-2 flex-1 border-t-2 border-dashed border-slate-400"
          ></div>
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
  <div class="flex flex-1 flex-col">
    {#if !friend}
      <div class="m-auto text-center text-2xl">
        Select a friend to view details.
      </div>
    {:else}
      <div class="m-auto">
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
          <div class="text-center text-green-500">
            Schedule loaded successfully! (viewing a schedule is coming soon)
          </div>
        {/if}
      </div>
    {/if}
  </div>
</main>
