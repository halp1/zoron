import { api } from "$lib/server";

import { classes } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email) return api.error("Unauthorized", 401);
  if (!session.user.aspen)
    return api.error("No Aspen credentials, please update your account at /account/update", 401);
  try {
    return api.json(await classes(session));
  } catch {
    return api.error("Failed to get activity", 500);
  }
};
