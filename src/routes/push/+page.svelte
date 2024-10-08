<script lang="ts">
  import { page } from "$app/stores";
  import { requests } from "$lib/web";
  import { signIn } from "@auth/sveltekit/client";
  import { faBullhorn, faPencil, faPaperPlane as faSend } from "@fortawesome/free-solid-svg-icons";
  import toast from "svelte-french-toast";
  import { faAdd, faTrash } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  let data: {
    id: string;
    title: string;
    image?: string;
    content?: string;
    url?: string;
    actions: { title: string; action: string }[];
  } = { id: "", title: "", url: "", actions: [] };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  let sending = false;

  const handleSubmission = async (
    e: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
  ) => {
    e.preventDefault();
    try {
      if (data.url === "") data.url = undefined;
      if (data.url && !isValidUrl(data.url))
        return toast.error("Invalid URL", { position: "bottom-right" });
      sending = true;
      const r = await requests.post("/api/push/" + data.id, {
        key: $page.data.account.items.find((i) => i._id === data.id)?.key || "",
        data: {
          title: data.title,
          options: {
            body: data.content,
            icon: data.image,
            actions: data.actions
          },
          url: data.url
        }
      });
      if (!("success" in r)) throw r.message;
      toast.success("Push sent!", { position: "bottom-right" });
    } catch (e) {
      console.error(e);
      toast.error(
        "Failed to create push notification. Make sure you are logged in and connected to the internet.",
        { position: "bottom-right" }
      );
    }
    sending = false;
  };

  $: invalidInput =
    !data.id ||
    !data.title ||
    (data.url && data.url !== "" && !isValidUrl(data.url)) ||
    data.actions.some((action) => action.title.trim() === "" || !isValidUrl(action.action));
</script>

<main class="flex h-screen w-screen flex-col items-center justify-center">
  <div class="relative flex flex-col gap-4">
    {#if $page.data.session && $page.data.session.user}
      <div class="flex items-center gap-5 text-3xl">
        <Fa icon={faBullhorn} /> Send an announcement
      </div>
      {#if $page.data.account.items.length === 0}
        <span
          >You have no push groups. You can create one <a href="/create" class="underline">here</a
          >.</span
        >
      {:else}
        <form on:submit={handleSubmission} class="justify-start">
          <label
            class="flex w-full justify-center rounded-xl border-2 border-slate-600 p-3 text-xl"
          >
            Select a Push Group: <select bind:value={data.id} class="bg-transparent text-white">
              {#each $page.data.account.items as item}
                <option value={item._id} style="color:black; background-color:transparent;"
                  >{item.name}</option
                >
              {/each}
            </select>
          </label>
          <div
            class="mt-4 flex items-center rounded-3xl border-2 border-slate-400 bg-slate-700 p-3"
          >
            <!-- image -->
            {#if data.image}
              <img src={data.image} class="h-24 w-24 rounded-full" alt="Sample notification icon" />
            {:else}
              <button
                class="flex h-24 w-24 items-center justify-center rounded-full bg-slate-600 text-4xl transition-colors hover:bg-slate-500"
                on:click={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const text = prompt(
                    "Enter the URL of the image you want to use as the notification icon."
                  );
                  if (!text || text.trim() === "") return;
                  // test url
                  try {
                    const res = await fetch(text);
                    if (res.headers.get("Content-Type")?.startsWith("image/")) {
                      data.image = text;
                    } else {
                      toast.error("Invalid URL", { position: "bottom-right" });
                    }
                  } catch (e) {
                    data.image = text;
                    return;
                  }
                }}
              >
                <Fa icon={faPencil} size="xs" />
              </button>
            {/if}
            <!-- title + content -->
            <div class="ml-3 flex flex-col gap-2">
              <input
                class="rounded-full border-2 border-dashed border-slate-400 bg-slate-600 px-3 text-xl outline-none focus-within:border-solid"
                type="text"
                name="title"
                placeholder="Title (required)"
                bind:value={data.title}
                required
              />
              <textarea
                class="rounded-3xl border-2 border-dashed border-slate-400 bg-slate-600 p-3 text-xl outline-none focus-within:border-solid"
                name="content"
                placeholder="Content (optional)"
                bind:value={data.content}
              ></textarea>
            </div>
          </div>
          <input
            class="mt-3 w-full rounded-full border-2 border-dashed border-slate-400 bg-transparent px-3 py-1 text-xl outline-none focus-within:border-solid {data.url !==
              '' &&
            data.url &&
            !isValidUrl(data.url)
              ? 'border-red-600'
              : ''}"
            type="url"
            name="url"
            placeholder="URL to open on click (optional)"
            bind:value={data.url}
          />
          <div class="mt-2 text-xl">Actions</div>
          <button
            class="btn-circle"
            on:click={(e) => {
              e.preventDefault();
              if (data.actions.length >= 2) {
                data.actions.length = 2;
                toast.error("You may not have more than 2 actions", { position: "bottom-right" });
              } else {
                data.actions = [...data.actions, { title: "", action: "" }];
              }
            }}><Fa icon={faAdd} /></button
          >
          {#each data.actions as action, idx}
            <div class="flex items-center">
              <input
                class="w-28 rounded-full border-2 border-dashed border-slate-400 bg-slate-600 px-3 outline-none focus-within:border-solid"
                type="text"
                placeholder="Name"
                bind:value={action.title}
                required
              />:
              <input
                class="mx-auto rounded-full border-2 border-dashed border-slate-400 bg-slate-600 px-3 outline-none focus-within:border-solid"
                type="text"
                placeholder="URL"
                bind:value={action.action}
                required
              />
              <button
                class="btn-circle"
                on:click={(e) => {
                  e.preventDefault();
                  data.actions = [...data.actions.slice(0, idx), ...data.actions.slice(idx + 1)];
                }}
              >
                <Fa icon={faTrash} />
              </button>
            </div>
          {/each}
          <button
            class="btn-full mt-3 w-full"
            disabled={invalidInput || sending ? true : false}
            type="submit"><Fa icon={faSend} />{sending ? "Sending..." : "Send"}</button
          >
        </form>
      {/if}
    {:else}
      <button
        class="btn-full"
        on:click={async () => {
          signIn();
        }}
      >
        Log in
      </button>
    {/if}
  </div>
</main>
