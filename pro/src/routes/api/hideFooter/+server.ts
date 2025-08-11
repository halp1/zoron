import { api } from "@zoron/common/server";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async () => {
  const response = api.json();
  response.headers.set("Set-Cookie", "hide-footer=1; path=/; max-age=31536000");
  return response;
};
