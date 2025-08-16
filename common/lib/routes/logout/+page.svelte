<script lang="ts">
  import { Footer } from "@zoron/common/components";

  import { signOut } from "@auth/sveltekit/client";
</script>

<div class="flex h-screen flex-col">
  <main class="flex w-full flex-1 items-center justify-center px-3">
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-3xl bg-slate-800 p-6"
    >
      <button
        class="btn-full btn-outlined border-red-500"
        onclick={() => signOut({ callbackUrl: "/", redirect: true })}
      >
        Log out
      </button>
    </div>
  </main>
  <Footer />
</div>
