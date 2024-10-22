import { autoCatch } from "$lib";
import type { aspen } from "$lib/aspen";
import type { StreamAPI } from "$lib/types";

export namespace requests {
  export const request = async (
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD",
    uri: string,
    options: { headers?: {}; body?: string } = {}
  ) => {
    return await fetch(uri, { method, headers: options.headers, body: options.body });
  };

  export const del = async <T = {}>(
    uri: string
  ): Promise<{ success: true; data: T } | { success: false; error: string }> => {
    try {
      const res = await request("DELETE", uri).then((r) => r.json());
      if ("message" in res) return JSON.parse(res.message);
      return res;
    } catch {
      return { success: false, error: "Network Error" };
    }
  };

  export const post = async <T = {}>(
    uri: string,
    data: Record<string, any>
  ): Promise<{ success: true; data: T } | { success: false; error: string }> => {
    try {
      const res = await request("POST", uri, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then((r) => r.json());
      if ("message" in res) return JSON.parse(res.message);
      return res;
    } catch {
      return { success: false, error: "Network Error" };
    }
  };

  export const stream = async <T = {}>(
    uri: string,
    data: Record<string, any>,
    onProgress?: aspen.Types.ProgressCallback
  ) => {
    try {
      const response = await fetch(uri, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done && reader) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const text = decoder.decode(value);
          const messages = text
            .trim()
            .split("\n")
            .map((item) => item.trim());
          for (const message of messages) {
            try {
              const data: StreamAPI.Message<T> = JSON.parse(message);

              if (data.type === "error")
                return { success: false as const, error: data.error, code: data.code };
              if (data.type === "progress" && onProgress) onProgress(data.step, data.total);
              if (data.type === "response") return { success: true as const, data: data.data };
            } catch (e) {
              console.error("Error parsing stream data: " + message);
              return { success: false as const, error: "System Error" };
            }
          }
        }
      }
      return { success: false as const, error: "System Error" };
    } catch (e) {
      console.error(e);
      return { success: false as const, error: "Network Error" };
    }
  };
}
