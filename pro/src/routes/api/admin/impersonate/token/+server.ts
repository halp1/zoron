import { insert } from "@zoron/common/database";
import { api } from "@zoron/common/server";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth } }) => {
  const session = await auth();
  if (session?.user?.role !== "admin") return api.error("Unauthorized", 401);
  const token = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  const response = api.json({ token });
  insert("impersonate", { token });
  return response;
};
