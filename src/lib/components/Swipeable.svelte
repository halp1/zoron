<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher<{ swipe: "left" | "right" }>();

  export let className = "";

  const DEADZONE = 50;
  let startX: number | null = null;
  let startY: number | null = null;
  let touch: number | null = null;
  let endX: number | null = null;
  let endY: number | null = null;

  const touchStart = (event: TouchEvent) => {
		if (touch) return;
    const t = event.targetTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    touch = t.identifier;
		event.preventDefault();
  };

  const touchMove = (event: TouchEvent) => {
    if (!startX || !startY) {
      return;
    }

    const t = [...event.targetTouches].find((t) => t.identifier === touch);

    if (!t) return;

    event.preventDefault();

    endX = t.clientX;
    endY = t.clientY;
  };

  const touchEnd = (event: TouchEvent) => {
    if (
      !startX ||
      !startY ||
      !endX ||
      !endY ||
      ![...event.targetTouches].find((t) => t.identifier === touch)
    ) {
      return;
    }

    event.preventDefault();

    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DEADZONE) {
      dispatch("swipe", dx > 0 ? "right" : "left");
    }

    startX = startY = endX = endY = touch = null;
  };

  onMount(() => {
    window.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("touchend", touchEnd, { passive: false });

    return () => {
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", touchEnd);
    };
  });
</script>

<div class={className} on:touchstart={touchStart}>
  <slot />
</div>
