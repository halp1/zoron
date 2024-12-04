<script lang="ts">
  import { addPasskey } from "$lib/auth/webauthn/browser";
  import { page } from "$app/stores";
  import { requests, toast } from "$lib/web";
  import { faArrowLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";

  let loading = false;
  let showNameDialog = false;
  let passkeyName = "";

  const handleAddPasskey = async () => {
    if (!passkeyName.trim()) {
      toast.error("Please enter a name for your passkey");
      return;
    }

    loading = true;
    showNameDialog = false;

    try {
      const result = await addPasskey(passkeyName);
      if (result) {
        toast.success("Passkey added successfully!");
        // Refresh the page to show the new passkey
        window.location.reload();
      } else {
        toast.error("Failed to add passkey");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      loading = false;
      passkeyName = "";
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    try {
      const res = await requests.post("/api/account/passkeys/delete", { passkeyId });
      if (res.success) {
        toast.success("Passkey deleted successfully!");
        window.location.reload();
      } else {
        toast.error("Failed to delete passkey");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // Get passkeys from the session data
  $: passkeys = $page.data?.passkeys ?? [];
</script>

<svelte:head>
  <title>Passkeys | {$page.data.env.name}</title>
</svelte:head>

<main>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    <div class="relative flex w-96 flex-col gap-3 rounded-2xl bg-slate-800 p-10">
      <a class="btn-circle absolute left-5 top-5" href="/account">
        <Fa icon={faArrowLeft} />
      </a>
      <div class="border-b-2 border-slate-600 pb-1 text-center text-4xl">Passkeys</div>
      <div class="flex flex-1 flex-col gap-3">
        <button
          on:click={() => (showNameDialog = true)}
          disabled={loading}
          class="btn-full btn-outlined w-full text-base"
        >
          {loading ? "Adding..." : "Add Passkey"}
        </button>

        <div class="flex flex-col items-stretch border-2 border-dashed border-slate-600 p-2">
          {#if passkeys.length === 0}
            <div class="text-center">No passkeys registered</div>
          {:else}
            {#each passkeys as passkey}
              <div class="flex items-center justify-between py-2">
                <div class="flex-1">
                  <p class="font-medium">{passkey.name}</p>
                  <p class="text-sm text-slate-400">
                    Device Type: {passkey.deviceType}
                  </p>
                  <p class="text-sm text-slate-400">
                    Backed up: {passkey.backedUp ? "Yes" : "No"}
                  </p>
                </div>
                <button class="btn-circle ml-2" on:click={() => handleDeletePasskey(passkey.id)}>
                  <Fa icon={faTrash} />
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>

{#if showNameDialog}
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="w-96 rounded-2xl bg-slate-800 p-10">
      <h2 class="mb-4 text-2xl">Name Your Passkey</h2>
      <input
        type="text"
        bind:value={passkeyName}
        placeholder="Enter a name for your passkey"
        class="mb-4 w-full rounded-lg border-2 border-dashed border-blue-400 bg-transparent px-5 py-3 outline-none focus-within:border-solid focus-within:outline-none"
      />
      <div class="flex justify-end gap-2">
        <button
          class="btn-full btn-outlined text-base"
          on:click={() => {
            showNameDialog = false;
            passkeyName = "";
          }}
        >
          Cancel
        </button>
        <button
          class="btn-full btn-outlined text-base"
          on:click={handleAddPasskey}
          disabled={!passkeyName.trim()}
        >
          Add
        </button>
      </div>
    </div>
  </div>
{/if}
