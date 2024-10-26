<script lang="ts">
  import { page } from "$app/stores";
import { requests, toast } from "$lib/web";

  $: schedule = ($page.data.session?.user || {}).schedule;

  const getLoadingText = (percentage: number) => `Generating schedule (${percentage}%)...`;
</script>

{#if !schedule}
<div class="flex h-full flex-col items-center justify-center gap-3">
  <button
    class="btn-full btn-outlined text-base"
    on:click={async () => {
      const { dismiss, update } = toast.loading("Generating schedule (0%)...");
      const res = await requests.stream("/api/aspen/schedule/gen", { semester: 1 }, (step, total) =>
        update(getLoadingText((step / total) * 100))
      );
      if (res.success === true) history.go(0);
      else toast.error(res.error);
      dismiss();
    }}
  >
    Download
  </button>
</div>
{:else}
{/if}