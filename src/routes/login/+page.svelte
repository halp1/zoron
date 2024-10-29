<script lang="ts">
  import { page } from "$app/stores";
  import { signIn } from "@auth/sveltekit/client";
  import toast from "svelte-french-toast";
  import { validEmail } from "$lib/email";
  import Footer from "$lib/components/Footer.svelte";
  import { Collapsible, Toggle } from "$lib/components";

  $: user = $page.data.session?.user;

  let email = "";
  let usePassword = false;
  let password = "";

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

    if (!usePassword) {
      await signIn("mailgun", {
        callbackUrl: location.origin + "/account",
        email
      });
    }
  };
</script>

<svelte:head>
  <title>Login | A+spen</title>
</svelte:head>

<main class="flex h-screen w-screen flex-col items-center justify-center px-5">
  {#if user}
    <div class="flex flex-col items-center justify-center gap-3 text-3xl">
      You are already logged in as {user.email}.
    </div>
    <a href="/account" class="text-xl underline">View account</a>
    <a href="/auth/signout" class="text-xl underline">Log out</a>
  {:else}
    <img src="/favicon.png" alt="Site icon" class="mb-3 w-32" />
    <h1 class="mb-10 text-center text-4xl">Log in to A+spen</h1>
    <form on:submit={handleSubmission} class="flex w-96 flex-col gap-2">
      <input
        class="w-full rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
        name="email"
        bind:value={email}
        placeholder="School Email"
        required
      />
      <div
        class="overflow-hidden text-sm text-red-600 transition-all"
        style="height: {validEmail(email) || email.length === 0 ? '0px' : '20px'}"
      >
        Please enter a valid lexingtonma.org email address.
      </div>
      <div class="flex items-center gap-2">
        <Toggle bind:checked={usePassword} color="bg-blue-400" /> Use Password
      </div>
      <Collapsible open={usePassword}>
        <input
          class="mb-3 w-full rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
          name="password"
          bind:value={password}
          placeholder="Password"
          type="password"
          required={usePassword}
        /></Collapsible
      >
      <button
        class="btn-full btn-outlined"
        disabled={!validEmail(email) && ((usePassword && password.length === 0) || false)}
        type="submit"
      >
        Log in with {usePassword ? "password" : "email"}
      </button>
    </form>
  {/if}
</main>
<Footer fixed />
