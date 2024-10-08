<script lang="ts">
  import { page } from "$app/stores";
  import BubbleButton from "$lib/components/BubbleButton.svelte";
  import { signIn } from "@auth/sveltekit/client";
</script>

<main
  class="relative flex h-screen w-screen flex-col items-center justify-center bg-repeat"
  style=""
>
  <!-- {#if $page.data.session && $page.data.session.user}
		<div class="text-3xl">Hello, {$page.data.session.user.email}</div>
		<span>Manage your account <a href="/account" class="underline">here</a>.</span>
	{:else}
		<a href="/auth/signin" class="btn-full">Log in</a>
	{/if} -->
  <div class="flex items-center gap-10 text-8xl">
    <img src="/favicon.svg" alt="icon" class="w-28" />Push
  </div>
  <div class="mt-10 text-3xl">The easiest way to notify anyone, anytime, anywhere.</div>
  <div class="mt-10 flex items-center gap-10">
    <BubbleButton type="a" href="/login">Sign up</BubbleButton>
    <div class="h-10 w-1 bg-white" />
    <BubbleButton type="a" href="/docs">Explore the API</BubbleButton>
  </div>
</main>

<style>
  main::after {
		z-index: -1;
    content: "";
    background-image: url("/icon.png");
		background-size: 120px 120px;
		background-position: -60px -60px;
    filter: grayscale(100%) opacity(.1) blur(2px);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
</style>
