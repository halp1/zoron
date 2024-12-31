<script lang="ts">
  import { toast } from "$lib/web";
  import { validEmail } from "$lib/email";
  import Footer from "$lib/components/Footer.svelte";
  import { requests } from "$lib/web";
  import { page } from "$app/state";
  import { usePasskey } from "$lib/auth/webauthn/browser";

  const encryptPassword = async (password: string) =>
    Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-512", new TextEncoder().encode(password)))
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  let email = $state("");
  let password = $state("");

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

    if (!password || password.length === 0) {
      toast.error("Please enter a password", { position: "bottom-right" });
      return;
    }

		const secret = await encryptPassword(password);

    const { dismiss } = toast.loading("Logging in...");
    const res = await requests.post("/api/account/login", { email, password, secret });
    dismiss();
    if (res.success) {
      localStorage.setItem("secret", secret);
      location.href = "/launch";
    } else {
      toast.error(res.error);
    }
  };

  const handlePasskeyLogin = async () => {
    const { dismiss } = toast.loading("Using passkey...");
    try {
      await usePasskey();
      location.href = "/home";
    } catch (error) {
      toast.error("Failed to use passkey: " + (error as Error).message);
    }
    dismiss();
  };
</script>

<svelte:head>
  <title>Login | {page.data.env.name}</title>
</svelte:head>

<main class="flex h-screen w-screen flex-col items-center justify-center px-5">
  <img src="/favicon.png" alt="Site icon" class="mb-3 w-32" />
  <h1 class="mb-10 text-center text-4xl">Log in to {page.data.env.name}</h1>
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
    <input
      class="mb-3 w-full rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
      name="password"
      bind:value={password}
      placeholder="Password"
      type="password"
      required
    />
    <button
      class="btn-full btn-outlined"
      disabled={!validEmail(email) || password.length === 0}
      type="submit"
    >
      Log in
    </button>
    <!-- <button class="btn-full btn-outlined mt-2" type="button" on:click={handlePasskeyLogin}>
      Log in with passkey
    </button> -->
    <div class="flex items-center">
      <a href="/forgor" class="text-slate-400 underline">Forgot password?</a>
      <a href="/register" class="ml-auto text-slate-400 underline">Register</a>
    </div>
  </form>
</main>
<Footer fixed />
