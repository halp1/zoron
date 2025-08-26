<script lang="ts">
  import { page } from "$app/state";

  import { BubbleButton } from "@zoron/common/components";
</script>

<svelte:head>
  <title>{page.data.env.name}</title>
</svelte:head>

<main
  class="relative flex h-screen w-screen flex-col items-center justify-center bg-repeat px-5"
  style=""
>
  <div class="flex items-center gap-10 text-6xl sm:text-8xl">
    <img src="/favicon.png" alt="icon" class="w-28" />
    <div>{page.data.env.name}</div>
  </div>
  <div class="mt-10 text-center text-3xl">Make Scheduling Great Again.</div>
  <div class="mt-10 flex items-center gap-10">
    <BubbleButton type="a" href="/register">Get Started</BubbleButton>
    <span class="-mx-3">or</span>
    <BubbleButton type="a" href="/login">Log in</BubbleButton>
  </div>
  <div class="mt-10 text-center text-white">
    Used Zoron before? Log in with your existing account.
  </div>
</main>
