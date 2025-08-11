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
    <span
      class="shine-text relative overflow-visible text-8xl font-bold tracking-wider text-yellow-200 shadow-yellow-200/50"
      style="text-shadow: 0 0 20px rgba(255, 255, 153, 0.5); animation: glow-pulse 2s ease-in-out infinite alternate;"
    >
      PRO
    </span>
  </div>
  <div class="mt-10 text-center text-3xl">
		Make Aspen Great Again.™
  </div>
  <div class="mt-10 flex items-center gap-10">
    <BubbleButton type="a" href="/register">Get Started</BubbleButton>
    <span class="-mx-3">or</span>
    <BubbleButton type="a" href="/login">Log in</BubbleButton>
  </div>
</main>

<style>
  .shine-text::before {
    content: "LITE";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      transparent 40%,
      rgba(255, 255, 255, 0.8) 50%,
      transparent 60%,
      transparent 100%
    );
    background-size: 200% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    animation: shine 3s infinite;
  }

  @keyframes shine {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: -100% 0;
    }
  }

  @keyframes glow-pulse {
    from {
      text-shadow: 0 0 20px rgba(255, 255, 153, 0.5);
    }
    to {
      text-shadow: 0 0 30px rgba(255, 255, 153, 0.8);
    }
  }
</style>
