<script lang="ts">
  import { requests, toast } from "$lib/web";
  import Fa from "svelte-fa";
  import { faInfoCircle, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
    import { page } from "$app/stores";

  let password = "";
  let confirm = "";

  let submitting = false;

  const submit = async (e: { preventDefault: () => void }) => {
    if (submitting) return toast.error("Please wait for the previous request to finish.");
    e.preventDefault();

    if (password !== confirm || password.length === 0 || confirm.length === 0)
      return toast.error("Passwords do not match.");

    const { dismiss } = toast.loading("Verifying credentials...");
    submitting = true;

    const res = await requests.post<any>("/api/account/password", {
      password
    });
    dismiss();
    submitting = false;
    if (!res.success) return toast.error("An error occurred while updating password: " + res.error);
    else {
      toast.success(`Your password has been updated.`);
      // requires a hard refresh to update the session
      location.href = "/account";
    }
  };

  let showPassword = false;
</script>

<svelte:head>
  <title>Update your credentials | {$page.data.env.name}</title>
</svelte:head>

<main class="flex h-screen w-screen flex-col items-center justify-center">
  <img src="/favicon.png" alt="Site icon" class="mb-3 w-32" />
  <h1 class="mb-10 text-4xl">Update your password</h1>
  <form class="flex w-96 flex-col gap-2" on:submit={submit}>
    <input
      on:keydown={(e) => {
        if (e.key === "Enter") {
          submit(e);
        }
      }}
      class="w-full rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
      bind:value={password}
      placeholder="Enter your new password"
      {...{ type: showPassword ? "text" : "password" }}
      autocomplete="off"
      required
    />
    <div class="relative">
      <input
        on:keydown={(e) => {
          if (e.key === "Enter") {
            submit(e);
          }
        }}
        class="w-full rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
        bind:value={confirm}
        placeholder="Confirm your new password"
        {...{ type: showPassword ? "text" : "password" }}
        autocomplete="off"
        required
      />
      <button
        class="btn-circle absolute right-2 top-1/2 -translate-y-1/2"
        on:click={(e) => {
          e.preventDefault();
          showPassword = !showPassword;
        }}><Fa icon={showPassword ? faEyeSlash : faEye} /></button
      >
    </div>
    <div
      class="mb-2 overflow-hidden text-sm text-red-600 transition-all"
      style="height: {confirm.length > 0 && confirm !== password ? '20px' : '0px'}"
    >
      Passwords do not match
    </div>
    <div class="mb-3 text-sm text-slate-400">
      <Fa icon={faInfoCircle} class="float-left mr-2 mt-[3px]" />
      If you ever lose your password, you will always be able to recover your account via your email.
    </div>
    <button
      class="btn-full btn-outlined"
      disabled={password.length === 0 || confirm.length === 0 || confirm !== password || submitting}
      type="submit"
    >
      Update
    </button>
  </form>
</main>
