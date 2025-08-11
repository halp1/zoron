import type { RequestHandler } from "@sveltejs/kit";
import { logger } from "@zoron/common/logs";
import { api } from "@zoron/common/server";

export const GET: RequestHandler = async ({ setHeaders, locals: { auth } }) => {
  const session = await auth();

  if (session?.user?.role !== "admin") throw api.error("Forbidden", 403);

  setHeaders({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  let handler: (message: string) => void;

  const stream = new ReadableStream({
    start(controller) {
      handler = <T>(data: T) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      logger.events.on("log", handler);
    },
    cancel() {
      if (handler) {
        logger.events.off("log", handler);
      }
    }
  });

  return new Response(stream, { headers: { "X-Accel-Buffering": "no" } });
};
