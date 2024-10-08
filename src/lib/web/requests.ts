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
  ): Promise<({ success: true } & T) | { message: string }> => {
    return await request("POST", uri, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json());
  };
}
