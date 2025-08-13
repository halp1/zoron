import type { BGUpdate, WorkerMessageMap } from "./bg-worker";
import BGWorker from "./bg-worker?worker";

export const initBG = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d")!;

  const worker = new BGWorker();

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    worker.postMessage({
      type: "canvas",
      data: {
        width: canvas.width,
        height: canvas.height
      } satisfies WorkerMessageMap["canvas"]
    });
  };
  resize();
  window.addEventListener("resize", resize);
  worker.postMessage({
    type: "init",
    data: {
      canvas: { width: canvas.width, height: canvas.height }
    } satisfies WorkerMessageMap["init"]
  });

  document.addEventListener("mousemove", (e) => {
    worker.postMessage({
      type: "mouse",
      data: { x: e.clientX, y: e.clientY } satisfies WorkerMessageMap["mouse"]
    });
  });

  let state: BGUpdate = {
    connections: [],
    points: []
  };

  worker.addEventListener("message", (e) => {
    state = e.data;
  });

  let looping = true;
  const render = () => {
    if (!looping) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const connection of state.connections) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${connection.strength})`;
      ctx.beginPath();
      ctx.moveTo(connection.x1, connection.y1);
      ctx.lineTo(connection.x2, connection.y2);
      ctx.stroke();
    }

    for (const point of state.points) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);

  return {
    destroy: () => {
      looping = false;
    },
    enableMouse: () => {
      worker.postMessage({
        type: "mouseControls",
        data: true satisfies WorkerMessageMap["mouseControls"]
      });
    },
    disableMouse: () => {
      worker.postMessage({
        type: "mouseControls",
        data: false satisfies WorkerMessageMap["mouseControls"]
      });
    },
    pause: () => {
      looping = false;
    },
    unpause: () => {
      looping = true;
      requestAnimationFrame(render);
    },
		renderOnce: () => {
			const prev = looping;
			looping = true;
			render();
			looping = prev;
		}
  };
};
