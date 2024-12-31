<script lang="ts">
  import { requests, toast } from "$lib/web";
  import Fa from "svelte-fa";
  import { faInfoCircle, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
  import type { AccountUpdateRes } from "../../api/account/update/+server";
  import { page } from "$app/state";

  let username = $state("");
  let password = $state("");
  const validUsername = (username: string) => {
    const usernameWithoutNumbers = username.replace(/\d+$/, "");
    const numbersAtEnd = username.slice(usernameWithoutNumbers.length);
    return (
      username.startsWith("stu") &&
      usernameWithoutNumbers.length >= 5 &&
      /^\d{0,3}$/.test(numbersAtEnd)
    );
  };
  const validPassword = (password: string) =>
    password.length === 4 + 3 + 4 && /^[a-zA-Z]{4}\d{3}[a-zA-Z]{4}$/.test(password);

  let submitting = $state(false);

  const submit = async (e: { preventDefault: () => void }) => {
    if (submitting) return toast.error("Please wait for the previous request to finish.");
    e.preventDefault();

    if (!validUsername(username) || !validPassword(password)) {
      return toast.error("Your username or password is invalid.");
    }

    const { dismiss } = toast.loading("Verifying credentials...");
    submitting = true;

    const res = await requests.post<AccountUpdateRes>("/api/account/update", {
      username,
      password,
			secret: localStorage.getItem("password"),
    });
    dismiss();
    submitting = false;
    if (!res.success) return toast.error("An error occurred while logging in: " + res.error);
    else {
      toast.success(`Hello, ${res.data.name.first} ${res.data.name.last}`);
      // requires a hard refresh to update the session
      location.href = "/account";
    }
  };

  let showPassword = $state(false);
</script>

<svelte:head>
  <title>Update your credentials | {page.data.env.name}</title>
</svelte:head>

<main class="flex h-screen w-screen flex-col items-center justify-center">
  <img src="/favicon.png" alt="Site icon" class="mb-3 w-32" />
  <h1 class="mb-10 text-4xl">Update your credentials</h1>
  <form class="flex w-96 flex-col gap-2" onsubmit={submit}>
    <input
      onkeydown={(e) => {
        if (e.key === "Enter") {
          submit(e);
        }
      }}
      class="w-full rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
      bind:value={username}
      placeholder="Enter your Aspen username"
      autocomplete="off"
      required
    />
    <div class="relative">
      <input
        onkeydown={(e) => {
          if (e.key === "Enter") {
            submit(e);
          }
        }}
        class="w-full rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
        bind:value={password}
        placeholder="Enter your Aspen password"
        {...{ type: showPassword ? "text" : "password" }}
        autocomplete="off"
        required
      />
      <button
        class="btn-circle absolute right-2 top-1/2 -translate-y-1/2"
        onclick={(e) => {
          e.preventDefault();
          showPassword = !showPassword;
        }}><Fa icon={showPassword ? faEyeSlash : faEye} /></button
      >
    </div>
    <div
      class="mb-2 overflow-hidden text-sm text-red-600 transition-all"
      style="height: {(username.length === 0 || validUsername(username)) &&
      (password.length === 0 || validPassword(password))
        ? '0px'
        : '20px'}"
    >
      Your username or password is invalid.
    </div>
    <div class="mb-3 text-sm text-slate-400">
      <Fa icon={faInfoCircle} class="float-left mr-2 mt-[3px]" />
      Your information is encrypted and stored securely on the server. We will never send your credentials
      to a 3rd party. You will always have the option to permanently delete your account and the data
      associated with it.
    </div>
    <button
      class="btn-full btn-outlined"
      disabled={!validUsername(username) || !validPassword(password) || submitting}
      type="submit"
    >
      Update
    </button>
  </form>
</main>
