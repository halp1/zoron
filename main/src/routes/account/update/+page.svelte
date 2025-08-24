<script lang="ts">
  import { page } from "$app/state";

  import { account } from "@zoron/common/api";
  import { requests, toast } from "@zoron/common/web";
  import { theme } from "@zoron/common/web/theme";

  import Fa from "svelte-fa";

  import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

  let fullName = $state("");

  let attempts = $state(0);
  const maxAttempts = 3;

  const validFullName = (name: string) => name.trim().length >= 2;

  let submitting = $state(false);

  const submit = async (e: { preventDefault: () => void }) => {
    if (submitting)
      return toast.error("Please wait for the previous request to finish.");
    e.preventDefault();

    if (attempts++ >= maxAttempts) {
      return toast.error(
        "You have reached the maximum number of attempts. Please try again later (~1 hour)."
      );
    }

    if (!validFullName(fullName)) {
      return toast.error(
        "Please enter a valid full name (at least 2 characters)."
      );
    }

    const { dismiss } = toast.loading("Updating your information...");
    submitting = true;

    try {
      await account.updateProfile({ fullName: fullName.trim() });
      toast.success("Information updated successfully!");
      location.href = "/account";
    } catch (error: any) {
      toast.error(
        "An error occurred while updating: " + (error.message || error)
      );
    } finally {
      dismiss();
      submitting = false;
    }
  };
</script>

<svelte:head>
  <title>Update your information | {page.data.env.name}</title>
</svelte:head>

<main class="flex h-screen w-screen flex-col items-center justify-center">
  <img src="/favicon.png" alt="Site icon" class="mb-3 w-32" />
  <h1 class="mb-10 text-4xl">Update your information</h1>
  <form class="flex w-96 flex-col gap-2" onsubmit={submit}>
    <input
      onkeydown={(e) => {
        if (e.key === "Enter") {
          submit(e);
        }
      }}
      class="w-full rounded-lg border-2 border-dashed {$theme === 'amoled'
        ? 'border-white'
        : 'border-blue-400'} bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
      bind:value={fullName}
      placeholder="Enter your full name"
      autocomplete="name"
      required
    />
    <div
      class="mb-2 overflow-hidden text-sm text-red-600 transition-all"
      style="height: {fullName.length === 0 || validFullName(fullName)
        ? '0px'
        : '20px'}"
    >
      Please enter a valid full name (at least 2 characters).
    </div>
    <div class="mb-3 text-sm text-slate-400">
      <Fa icon={faInfoCircle} class="float-left mr-2 mt-[3px]" />
      Your information is stored securely on the server. You will always have the
      option to permanently delete your account and the data associated with it.
    </div>
    <button
      class="btn-full btn-outlined"
      disabled={!validFullName(fullName) || submitting}
      type="submit"
    >
      Update
    </button>
  </form>
</main>
