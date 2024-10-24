<script lang="ts">
  import { requests, toast } from "$lib/web";

  let response = "";
</script>

<div class="flex h-full flex-col items-center justify-center gap-3">
  <button
    class="btn-full btn-outlined text-base"
    on:click={async () => {
      const res = await requests.post("/api/aspen/schedule/gen");
      if (res.success === true)
        response = typeof res.data === "string" ? res.data.trim() : JSON.stringify(res.data, null, 2);
      else toast.error(res.error);
    }}
  >
    Download
  </button>
  <code class="w-full flex-1 overflow-auto whitespace-pre rounded-lg bg-slate-800 shadow-2xl"
    >{response}</code
  >
</div>
