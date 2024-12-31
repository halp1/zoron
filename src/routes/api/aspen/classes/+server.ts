import { autoCatchAsync } from "$lib";
import { api } from "$lib/server";

import { classes } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request, cookies }) => {
  const session = await auth();
  if (!session?.user?.email || !cookies.get("secret")) return api.error("Unauthorized", 401);
  if (!session.user.aspen)
    return api.error("No Aspen credentials, please update your account at /account/update", 401);

  const body = await autoCatchAsync(() => request.json());
  if (
    body &&
    (!["current", "previous"].includes(body.year) || ![0, 1, 2, 3, 4].includes(body.term))
  )
    return api.error("Invalid year or term", 400);
  try {
    return api.json(await classes(session, cookies.get("secret")!, body));
  } catch {
    return api.error("Failed to get activity", 500);
  }
};
