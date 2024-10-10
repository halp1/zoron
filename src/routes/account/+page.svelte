<script lang="ts">
  import { page } from "$app/stores";
  import { signIn } from "@auth/sveltekit/client";
  import { onMount } from "svelte";
  import { getDeviceInfo, type Device } from "$lib/web";


  let device: Device | null = null;
  onMount(() => {
    (async () => {
      device = await getDeviceInfo();
    })();
  });

</script>

<main>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    {#if $page.data && $page.data.session && $page.data.session.user}
      <div class="relative flex flex-col sm:w-[450px]">
        <div class="mx-auto border-b-2 border-slate-600 pb-1 text-3xl">
          Hello, {$page.data.session.user.name}.
        </div>
      </div>
    {:else}
      <button
        class="btn-full"
        on:click={async () => {
          signIn();
        }}
      >
        Log in
      </button>
    {/if}
  </div>
</main>
