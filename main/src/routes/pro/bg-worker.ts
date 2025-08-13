export interface WorkerMessageMap {
  init: { canvas: { width: number; height: number } };
  mouse: { x: number; y: number };
  mouseControls: boolean;
  canvas: { width: number; height: number };
}

export interface BGUpdate {
  connections: { x1: number; y1: number; x2: number; y2: number; strength: number }[];
  points: { x: number; y: number; r: number }[];
}

const initBG = (data: WorkerMessageMap["init"]) => {
  const canvas = data.canvas;

  const scale = (canvas.width * canvas.height) / (1.8 * 10 ** 6);
  const gravity = -2;
  const initialSpeed = 0.5;
  const exitMargin = 150;
  const mousePower = 1 / 30;
  let mouseControls = true;
  const mousePos = { x: 0, y: 0 };

  const dots: { x: number; y: number; r: number; vx: number; vy: number }[] = [];
  const numDots = 200;
  for (let i = 0; i < numDots; i++) {
    dots.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 5 * scale,
      vx: Math.random() * initialSpeed - initialSpeed / 2,
      vy: Math.random() * initialSpeed - initialSpeed / 2
    });
  }

  const connectionDistance = scale * 225;

  let looping = true;
  const fps = 60;
  const mspf = 1000 / fps;

  const update = () => {
    if (!looping) return;

    const res: BGUpdate = {
      connections: [],
      points: []
    };

    for (let i = 0; i < numDots; i++) {
      for (let j = i + 1; j < numDots; j++) {
        const dot1 = dots[i];
        const dot2 = dots[j];

        const dx = dot1.x - dot2.x;
        const dy = dot1.y - dot2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // apply gravity
        const force = gravity / Math.max(distance ** 2, 5000);
        dot1.vx += (force * (dot2.x - dot1.x)) / distance;
        dot1.vy += (force * (dot2.y - dot1.y)) / distance;
        dot2.vx += (force * (dot1.x - dot2.x)) / distance;
        dot2.vy += (force * (dot1.y - dot2.y)) / distance;

        if (distance < connectionDistance) {
          res.connections.push({
            x1: dot1.x,
            y1: dot1.y,
            x2: dot2.x,
            y2: dot2.y,
            strength: 1 - distance / connectionDistance
          });
        }
      }
    }

    for (const dot of dots) {
      if (mouseControls) {
        // move dots slightly away from mouse exponentially decreasing with distance
        const dx = dot.x - mousePos.x;
        const dy = dot.y - mousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          const force = ((100 - distance) / 100) * mousePower;
          dot.vx += dx * force * 0.01;
          dot.vy += dy * force * 0.01;
        }
      }

      // cap velocity
      const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
      if (speed > 0.7) {
        dot.vx *= 0.7 / speed;
        dot.vy *= 0.7 / speed;
      }

      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x + dot.r + exitMargin < 0) dot.x = canvas.width + dot.r + exitMargin;
      if (dot.x - dot.r - exitMargin > canvas.width) dot.x = -dot.r - exitMargin;
      if (dot.y + dot.r + exitMargin < 0) dot.y = canvas.height + dot.r + exitMargin;
      if (dot.y - dot.r - exitMargin > canvas.height) dot.y = -dot.r - exitMargin;
      res.points.push({ x: dot.x, y: dot.y, r: dot.r });
    }

    self.postMessage(res);

    setTimeout(update, mspf);
  };
  update();

  self.addEventListener("message", (e: MessageEvent) => {
    switch (e.data.type) {
      case "mouse":
        mousePos.x = e.data.data.x;
        mousePos.y = e.data.data.y;
        break;
      case "mouseControls":
        mouseControls = e.data.data;
        break;
      case "canvas":
        canvas.width = e.data.data.width;
        canvas.height = e.data.data.height;
        break;
      default:
        console.warn("Unknown message", e.data.type, e.data.data);
    }
  });
};

const initMSGHandler = (e: MessageEvent) => {
  if (e.data.type === "init") {
    initBG(e.data.data);
    self.removeEventListener("message", initMSGHandler);
  }
};
self.addEventListener("message", initMSGHandler);
