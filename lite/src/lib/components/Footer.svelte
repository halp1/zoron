<script lang="ts">
  import { page } from "$app/state";

  import { requests, toast } from "$lib/web";

  interface Props {
    fixed?: boolean;
    className?: string;
    hideable?: boolean;
  }

  let { fixed = false, className = "", hideable = false }: Props = $props();
  let hidden = $state(page.data.hideFooter);
</script>

{#if !hideable || !hidden}
  <div
    class="{fixed
      ? 'fixed bottom-0 left-0'
      : 'relative'} flex w-screen flex-wrap items-center gap-3 bg-slate-800 p-3 {className}"
  >
    <div class="w-full sm:w-auto">
      Copyright &copy; Joshua Liu {new Date().getFullYear()}
    </div>

    <div class="-my-2 flex flex-col items-end text-sm sm:ml-auto">
      <a href="/privacy" class="underline">Privacy</a>
      <div class="-mt-1 flex gap-2">
        {#if hideable}
          <button
            class="text-sm underline sm:ml-auto"
            onclick={async () => {
              hidden = true;
              const res = await requests.post("/api/hideFooter");
              if (res.success === false) {
                toast.error("An error occured while hiding the footer");
              }
            }}
          >
            Hide this
          </button>
        {/if}
        <a href="/tos" class="underline">Terms</a>
      </div>
    </div>
  </div>
{/if}
