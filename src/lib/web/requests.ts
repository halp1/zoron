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
    const response = await fetch(uri, {
      method: 'POST',
      headers: { "Content-Type": "application/json"},
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
        const data: StreamAPI.Message<aspen.Types.Assignment> = JSON.parse(text);

        if (data.type === "error") return {}

      }
    }
  }
}
