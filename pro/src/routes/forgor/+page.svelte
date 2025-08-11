<script lang="ts">
  import { page } from "$app/state";

  import { Collapsible, Toggle } from "@zoron/common/components";
  import Footer from "@zoron/common/components/Footer.svelte";
  import { validEmail } from "@zoron/common/email";
  import { toast } from "@zoron/common/web";
  import { requests } from "@zoron/common/web";

  import { signIn } from "@auth/sveltekit/client";

  import Fa from "svelte-fa";

  import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

  let email = $state("");
  let agreed = $state(false);

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

    await requests.post("/api/verify/init");

    await signIn("mailgun", {
      email,
      redirect: true,
      callbackUrl: "/verify"
    });
  };
</script>

<svelte:head>
  <title>Account Recovery | {page.data.env.name}</title>
</svelte:head>

<main class="flex h-screen w-screen flex-col items-center justify-center px-5">
  <img src="/favicon.png" alt="Site icon" class="mb-3 w-32" />
  <h1 class="mb-10 text-center text-4xl">
    Recover your {page.data.env.name} account
  </h1>
  <form onsubmit={handleSubmission} class="flex w-96 flex-col gap-2">
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

    <div class="mb-1 text-sm text-slate-400">
      <Fa icon={faInfoCircle} class="float-left mr-2 mt-[3px]" />
      You will recieve an email with a link to log in to your account. Once you are
      logged in to your account, head to your account settings at /account and the
      click the "update password" buttton. If you have not set a password, this button
      may say "add password".
    </div>
    <div class="mb-1 text-sm text-slate-400">
      <Fa icon={faInfoCircle} class="float-left mr-2 mt-[3px]" />
      You will need to re-add your Aspen credentials after you have updated your
      password.
    </div>
    <div class="flex items-center gap-3">
      <Toggle
        color={agreed ? "bg-green-400" : "bg-red-400"}
        bind:checked={agreed}
        className="transition-colors"
      /> I understand
    </div>
    <button
      class="btn-full btn-outlined"
      disabled={!validEmail(email) || !agreed}
      type="submit"
    >
      Send Recovery Email
    </button>
    <div class="flex items-center">
      <a href="/login" class="text-slate-400 underline">Log in</a>
    </div>
  </form>
</main>
<Footer fixed />
