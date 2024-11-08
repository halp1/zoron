<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher<{ swipe: "left" | "right" }>();

  export let className = "";
  export let style = "";

  const DEADZONE = 50;
  let startX: number | null = null;
  let startY: number | null = null;
  let touch: number | null = null;
  let endX: number | null = null;
  let endY: number | null = null;

  const touchStart = (event: TouchEvent) => {
    if (touch) return;
    const t = event.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    touch = t.identifier;
    event.preventDefault();
  };

  const touchMove = (event: TouchEvent) => {
    if (!startX || !startY) {
      return;
    }

    const t = [...event.changedTouches].find((t) => t.identifier === touch);

    if (!t) return;

    event.preventDefault();

    endX = t.clientX;
    endY = t.clientY;
  };

  const touchEnd = (event: TouchEvent) => {
    if (
      startX === null ||
      startY === null ||
      endX === null ||
      endY === null ||
      ![...event.changedTouches].find((t) => t.identifier === touch)
    ) {
      return;
    }

    event.preventDefault();

    const dx = endX - startX;
    const dy = endY - startY;
    console.log(dx, dy);

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DEADZONE) {
      dispatch("swipe", dx > 0 ? "right" : "left");
    }

    startX = startY = endX = endY = touch = null;
  };

  onMount(() => {
    document.addEventListener("touchmove", touchMove, { passive: false });
    document.addEventListener("touchend", touchEnd, { passive: false });
    document.addEventListener("touchcancel", touchEnd, { passive: false });

    return () => {
      document.removeEventListener("touchmove", touchMove);
      document.removeEventListener("touchend", touchEnd);
      document.removeEventListener("touchcancel", touchEnd);
    };
  });
</script>

<div {style} class={className} on:touchstart={touchStart}>
  <slot />
</div>
