<script lang="ts">
  import FingerprintJS from "@fingerprintjs/fingerprintjs";
  import { onMount } from "svelte";
  import { getDeviceInfo } from "$lib/web";

  import { page } from "$app/stores";
  import { signIn } from "@auth/sveltekit/client";
  import toast from "svelte-french-toast";

  $: user = $page.data.session?.user;

  const handleSubmission = async (
    e: SubmitEvent & {
      currentTarget: EventTarget & HTMLFormElement;
    }
  ) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get("email") as string;
    if (!email || email.length === 0) {
      toast.error("Please enter an email", { position: "bottom-right" });
      return;
    }

    await signIn("mailgun", {
      callbackUrl: location.origin + "/account",
      email
    });
  };
</script>

<main class="flex h-screen w-screen flex-col items-center justify-center">
  {#if user}
    <div class="text-3xl">
      You are already logged in as {user.email}.
    </div>
    <a href="/account" class="text-xl underline">View account</a>
    <a href="/auth/signout" class="text-xl underline">Log out</a>
  {:else}
    <form on:submit={handleSubmission} class="flex w-96 flex-col gap-5">
      <input
        class="w-full rounded-lg border-2 border-dashed border-orange-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
        name="email"
        placeholder="Email"
        required
      />
      <button class="btn-full w-full" type="submit"> Log in/Register </button>
    </form>
  {/if}
</main>
