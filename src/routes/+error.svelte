<script lang="ts">
  import { page } from "$app/state";

  const error = page.error!;
  const status = page.status!;

  const customErrorMessages: { [k: number]: string } = {};

  const message =
    status in customErrorMessages
      ? customErrorMessages[status]
      : error.message || "Page not found";
</script>

<svelte:head>
  <title>{message} | {page.data.env.name}</title>
</svelte:head>

<main class="grid h-screen w-screen place-items-center">
  <div
    class="flex w-96 items-center justify-center rounded-3xl bg-slate-800 p-10"
  >
    <div class="text-center text-6xl">
      Error {status}
      <br />
      {message}
    </div>
  </div>
</main>
