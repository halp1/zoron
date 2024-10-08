<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { requests } from "$lib/web";
  import toast from "svelte-french-toast";
  if (!$page.data.session || !$page.data.session.user) {
    toast.error("Sign in to create a Push", { position: "bottom-right" });

    goto("/login");
  }

  const handleSubmission = async (
    e: SubmitEvent & {
      currentTarget: EventTarget & HTMLFormElement;
    }
  ) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get("name") as string;
    if (!name || name.length === 0) {
      toast.error("Please enter a name", { position: "bottom-right" });
      return;
    }

    try {
      const r = await requests.post<{ id: string; key: string }>("/api/create", { name });
      if (!("success" in r)) throw r.message;
      res = r;
    } catch (e) {
      console.error(e);
      toast.error(
        "Failed to create push notification. Make sure you are logged in and connected to the internet.",
        { position: "bottom-right" }
      );
    }
  };

  let res: {
    id: string;
    key: string;
  } | null = null;
</script>

<div class="flex h-screen w-screen flex-col items-center justify-center">
  {#if !res}
    <form on:submit={handleSubmission} class="flex w-96 flex-col gap-5">
      <input
        class="w-full rounded-lg border-2 border-dashed border-orange-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
        name="name"
        placeholder="Push Name"
        required
      />
      <button class="btn-full w-full" type="submit"> Create </button>
    </form>
  {:else}
    <div class=" w-80 rounded-3xl border-2 border-slate-200 p-10">
      Invite others to subscribe here: <a href="https://push.haelp.dev/subscribe/{res.id}"
        >https://push.haelp.dev/subscribe/{res.id}</a
      >

      Your secret key: <code class="rounded-sm bg-slate-700">{res.key}</code>
    </div>
  {/if}
</div>
