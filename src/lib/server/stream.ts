import { autoCatch } from "$lib";
import type { StreamAPI } from "$lib/types";

export const streamPromise = <T = any>() =>
  new Promise<{
    controller: ReadableStreamDefaultController<any>;
    stream: ReadableStream;
    tick: (step: number, total: number) => void;
    end: (data: T) => void;
    error: (message: string, code: number) => Response;
    response: () => Response;
  }>((res) => {
    let controller: ReadableStreamDefaultController<any>;
    const stream = new ReadableStream({
      start: (c) => {
        controller = c;
      }
    });

    controller ??= new ReadableStreamDefaultController();

    const response = () => new Response(stream, { headers: { "Content-Type": "text/plain" } });
    res({
      controller,
      stream,
      tick: (step, total) =>
        autoCatch(() =>
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ type: "progress", step, total } satisfies StreamAPI.Progress) + "\n"
            )
          )
        ),
      end: (data) =>
        autoCatch(() => {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ type: "response", data } satisfies StreamAPI.Response<T>) + "\n"
            )
          );
          controller.close();
        }),
      error: (message, code) =>
        autoCatch(() => {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ type: "error", error: message, code } satisfies StreamAPI.Error) +
                "\n"
            )
          );
          controller.close();
          return response();
        }) || response(),
      response
    });
  });
