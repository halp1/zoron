<script lang="ts">
  import { page } from "$app/state";

  import { Collapsible, Toggle } from "$lib/components";
  import Footer from "$lib/components/Footer.svelte";
  import { validEmail } from "$lib/email";
  import { toast } from "$lib/web";
  import { requests } from "$lib/web";

  import { signIn } from "@auth/sveltekit/client";

  let email = $state("");

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
      callbackUrl: "/account/password"
    });
  };
</script>

<svelte:head>
  <title>Login | {page.data.env.name}</title>
</svelte:head>

<main class="flex h-screen w-screen flex-col items-center justify-center px-5">
  <img src="/favicon.png" alt="Site icon" class="mb-3 w-32" />
  <h1 class="mb-10 text-center text-4xl">
    Register your {page.data.env.name} account
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
    <button
      class="btn-full btn-outlined"
      disabled={!validEmail(email)}
      type="submit"
    >
      Register
    </button>
    <div class="flex items-center">
      <a href="/login" class="text-slate-400 underline">Log in</a>
    </div>
  </form>
</main>
<Footer fixed />
