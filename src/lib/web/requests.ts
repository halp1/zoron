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
}
