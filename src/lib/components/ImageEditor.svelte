<script lang="ts">
  import { onMount, untrack } from "svelte";

  interface Props {
    image: HTMLImageElement;
    size?: number;
    onCrop: (dataUrl: string) => void;
  }

  let { image, onCrop }: Props = $props();

  let canvas: HTMLCanvasElement = $state(null as any);
  let ctx: CanvasRenderingContext2D = $derived(canvas?.getContext("2d")!);

  type Point = "tl" | "tr" | "bl" | "br" | "mr" | "ml" | "mt" | "mb" | "drag";

  let drag:
    | false
    | {
        start: {
          x: number;
          y: number;
        };
        point: Point;
      } = $state(false);

  const handleRadius = 10;
  const canvasSize = {
    width: 500,
    height: 500
  };

  let scale: number = $derived(
    Math.min(canvasSize.width / image.width, canvasSize.height / image.height)
  );

  let maxDimensions = $derived({
    x: {
      from: canvas.width / 2 - (image.width / 2) * scale,
      to: canvas.width / 2 + (image.width / 2) * scale
    },
    y: {
      from: canvas.height / 2 - (image.height / 2) * scale,
      to: canvas.height / 2 + (image.height / 2) * scale
    }
  });

  let frame = $state({
    center: { x: canvasSize.width / 2, y: canvasSize.height / 2 },
    // svelte-ignore state_referenced_locally
    size: Math.min(image.width, image.height) * scale
  });

  $effect(() => {
    untrack(() => frame);
    frame = {
      center: { x: canvasSize.width / 2, y: canvasSize.height / 2 },
      size: Math.min(image.width, image.height) * scale
    };
  });

  let handles: { [key in Point]: { x: number; y: number } } = $derived({
    tl: { x: frame.center.x - frame.size / 2, y: frame.center.y - frame.size / 2 },
    tr: { x: frame.center.x + frame.size / 2, y: frame.center.y - frame.size / 2 },
    bl: { x: frame.center.x - frame.size / 2, y: frame.center.y + frame.size / 2 },
    br: { x: frame.center.x + frame.size / 2, y: frame.center.y + frame.size / 2 },
    mr: { x: frame.center.x + frame.size / 2, y: frame.center.y },
    ml: { x: frame.center.x - frame.size / 2, y: frame.center.y },
    mt: { x: frame.center.x, y: frame.center.y - frame.size / 2 },
    mb: { x: frame.center.x, y: frame.center.y + frame.size / 2 },
    drag: { x: frame.center.x, y: frame.center.y }
  });

  function handleMouseDown(e: MouseEvent) {
    const canvasMouseX = e.clientX - canvas.getBoundingClientRect().left;
    const canvasMouseY = e.clientY - canvas.getBoundingClientRect().top;

    const handle = Object.entries(handles).find(([key, { x, y }]) => {
      const dx = x - canvasMouseX;
      const dy = y - canvasMouseY;
      return dx * dx + dy * dy < handleRadius * handleRadius;
    });

    if (handle) {
      drag = {
        start: { x: canvasMouseX, y: canvasMouseY },
        point: handle[0] as Point
      };
    } else {
      drag = {
        start: { x: canvasMouseX, y: canvasMouseY },
        point: "drag"
      };
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!drag) return;

    const canvasMouseX = e.clientX - canvas.getBoundingClientRect().left;
    const canvasMouseY = e.clientY - canvas.getBoundingClientRect().top;
    const dx = canvasMouseX - drag.start.x;
    const dy = canvasMouseY - drag.start.y;

    switch (drag.point) {
      case "drag": {
        frame.center.x += dx;
        frame.center.y += dy;
        drag.start.x = canvasMouseX;
        drag.start.y = canvasMouseY;
        break;
      }
      case "tl":
      case "tr":
      case "bl":
      case "br": {
        const newCorner = {
          x: canvasMouseX,
          y: canvasMouseY
        };
        frame.size =
          Math.max(Math.abs(frame.center.x - newCorner.x), Math.abs(frame.center.y - newCorner.y)) *
          2;
        break;
      }
      case "mr":
      case "ml": {
        const newEdge = {
          x: canvasMouseX,
          y: canvasMouseY
        };
        frame.size = Math.abs(frame.center.x - newEdge.x) * 2;
        break;
      }
      case "mt":
      case "mb": {
        const newEdge = {
          x: canvasMouseX,
          y: canvasMouseY
        };
        frame.size = Math.abs(frame.center.y - newEdge.y) * 2;
        break;
      }
    }

    if (frame.size > Math.min(canvasSize.width, canvasSize.height)) {
      frame.size = Math.min(canvasSize.width, canvasSize.height);
    } else if (frame.size < 75) {
      frame.size = 75;
    }

    frame.center.x = Math.max(
      maxDimensions.x.from + frame.size / 2,
      Math.min(maxDimensions.x.to - frame.size / 2, frame.center.x)
    );
    frame.center.y = Math.max(
      maxDimensions.y.from + frame.size / 2,
      Math.min(maxDimensions.y.to - frame.size / 2, frame.center.y)
    );
  }

  function handleMouseUp() {
    drag = false;
  }

  onMount(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    let f: number;

    const render = () => {
      if (!ctx) return requestAnimationFrame(render);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        canvasSize.width / 2 - (image.width / 2) * scale,
        canvasSize.height / 2 - (image.height / 2) * scale,
        image.width * scale,
        image.height * scale
      );

      // Fill the entire canvas with semi-transparent black
      ctx.fillStyle = `rgba(0, 0, 0, ${0.5})`;
      // draw 4 rounded corners
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvasSize.width, 0);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        frame.center.x - frame.size / 2,
        frame.center.y - frame.size / 2,
        frame.size,
        frame.size
      );

      Object.values(handles).forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      f = requestAnimationFrame(render);
    };

    f = requestAnimationFrame(render);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(f);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="cursor-move"
  width={canvasSize.width}
  height={canvasSize.height}
  onmousedown={handleMouseDown}
>
</canvas>

<button
  class="mt-2 w-full rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
  onclick={() => {
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = frame.size;
    cropCanvas.height = frame.size;
    const cropCtx = cropCanvas.getContext("2d")!;
    cropCtx.drawImage(
      image,
      (frame.center.x - frame.size / 2 - maxDimensions.x.from) / scale,
      (frame.center.y - frame.size / 2 - maxDimensions.y.from) / scale,
      frame.size / scale,
      frame.size / scale,
      0,
      0,
      frame.size,
      frame.size
    );
    onCrop(cropCanvas.toDataURL());
  }}
>
  Save
</button>
