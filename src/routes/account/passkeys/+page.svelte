<script lang="ts">
import { addPasskey, usePasskey } from "$lib/auth/webauthn/browser";
import { page } from "$app/stores";
import { toast } from "$lib/web";

let loading = false;
let testing = false;

const handleAddPasskey = async () => {
  loading = true;
  
  try {
    const result = await usePasskey();
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
  }
};

const handleTestPasskey = async () => {
  testing = true;
  
  try {
    const userId = await usePasskey();
    if (userId) {
      toast.success("Passkey authentication successful!");
    } else {
      toast.error("Passkey authentication failed");
    }
  } catch (e) {
    toast.error((e as Error).message);
  } finally {
    testing = false;
  }
};

// Get passkeys from the session data
$: passkeys = $page.data?.passkeys ?? [];
</script>

<main class="flex h-screen w-screen flex-col items-center justify-center p-4">
  <div class="w-full max-w-md space-y-6">
    <h1 class="text-2xl font-bold text-center">Manage Passkeys</h1>

    <div class="bg-white shadow rounded-lg p-6 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Your Passkeys</h2>
        <button
          on:click={handleAddPasskey}
          disabled={loading}
          class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Passkey'}
        </button>
      </div>

      {#if passkeys.length === 0}
        <p class="text-gray-500 text-center py-4">
          You haven't added any passkeys yet.
        </p>
      {:else}
        <ul class="divide-y divide-gray-200">
          {#each passkeys as passkey}
            <li class="py-4">
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-medium">Device Type: {passkey.deviceType}</p>
                  <p class="text-sm text-gray-500">
                    Backed up: {passkey.backedUp ? 'Yes' : 'No'}
                  </p>
                  {#if passkey.transports}
                    <p class="text-sm text-gray-500">
                      Transports: {passkey.transports.join(', ')}
                    </p>
                  {/if}
                </div>
                <button
                  on:click={handleTestPasskey}
                  disabled={testing}
                  class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-4"
                >
                  {testing ? 'Testing...' : 'Test Passkey'}
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="text-center text-sm text-gray-500">
      <p>
        Passkeys are a secure alternative to passwords. They use biometric authentication 
        or your device's screen lock to protect your account.
      </p>
    </div>
  </div>
</main>
