<script lang="ts">
  import { page } from "$app/state";
</script>

<svelte:head>
  <title>Update your credentials | {page.data.env.name}</title>
</svelte:head>

<main class="relative flex h-screen w-screen">
  <div class="flex-1 border-r-2 border-slate-600 px-10 py-10">
    <div class="text-center text-4xl">Friends</div>
  </div>
  <div class="flex flex-1 flex-col border-l-2 border-slate-600 px-10">
    <div class="border-d-2 flex-1 border-slate-600 py-10">
      <div class="text-center text-4xl">Add friends</div>
    </div>
    <div class="flex-1 border-t-2 border-slate-600 py-10">
      <div class="text-center text-4xl">Friend Requests</div>
    </div>
  </div>
</main>
