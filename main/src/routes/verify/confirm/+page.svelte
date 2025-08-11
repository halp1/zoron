<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  import { Footer } from "@zoron/common/components";
  import { requests, toast } from "@zoron/common/web";
</script>

<div class="flex h-screen flex-col">
  <main class="flex w-full flex-1 items-center justify-center px-3">
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-3xl bg-slate-800 p-6"
    >
      <div class="text-center text-2xl">
        This isn't the same browser you started to log in from.
      </div>
      <div class="text-center text-base">
        You might be trying to log in on another browser.
      </div>
      <div class="relative flex items-center justify-center gap-3">
        <button
          class="btn-full btn-outlined border-green-400 text-base"
          onclick={async () => {
            const q = page.url.searchParams.get("target");
            if (!q) {
              toast.error("No target URL found");
              goto("/");
            } else {
              const target = decodeURIComponent(q);

              try {
                await requests.post("/api/verify/init");

                window.location.href = target;
              } catch {
                toast.error("Error redirecting to target URL");
              }
            }
          }}
        >
          Keep logging in here
        </button>
        <div class="h-8 w-1 bg-slate-600"></div>
        <button
          class="btn-full btn-outlined border-yellow-400 text-base"
          onclick={() => {
            const q = page.url.searchParams.get("target");
            if (!q) {
              toast.error("No target URL found");
              goto("/");
            } else {
              const target = decodeURIComponent(q);

              navigator.clipboard.writeText(target);
              toast.success("Copied link to clipboard");
            }
          }}
        >
          Copy link for another browser
        </button>
      </div>
      <div class="text-slate-400">
        If you weren't trying to log in, <a href="/" class="underline"
          >go home.</a
        >
      </div>
    </div>
  </main>
  <Footer />
</div>
