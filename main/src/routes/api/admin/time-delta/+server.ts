import { updateOrInsert } from "@zoron/common/database";
import { api } from "@zoron/common/server";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();
  if (session?.user?.role !== "admin") return api.error("Forbidden", 403);

  const { delta } = await request.json();
  if (!delta || typeof delta !== "number")
    return api.error("Invalid timeDelta", 400);
  await updateOrInsert(
    "app",
    { name: "timeDelta" },
    { name: "timeDelta", data: delta }
  );

  return api.json({ delta });
};
