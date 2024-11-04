<script lang="ts">
  import { page } from "$app/stores";
  import { PWA } from "$lib/web";
  const name = $page.data?.session?.user?.name;
  const prompt = PWA.overridePrompt;
</script>

<svelte:head>
  <title>Home | A+spen</title>
</svelte:head>

<div class="flex h-full flex-col items-center">
  {#if name}
    <div class="text-center text-3xl">
      Hello, {name?.split(" ")[0]}.
    </div>
    {#if $prompt}
      <button
        class="btn-full btn-outlined mt-auto w-80 border-green-400 text-base"
        on:click={() => {
          $prompt?.prompt();
          PWA.hidePrompt();
        }}
      >
        Install A+spen
      </button>
    {/if}
  {:else}
    An error occurred.
  {/if}
</div>
