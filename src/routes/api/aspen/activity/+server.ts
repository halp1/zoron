import { api } from "$lib/server";

import { activity } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, cookies }) => {
  const session = await auth();
  if (!session?.user?.email || !cookies.get("secret")) return api.error("Unauthorized", 401);
  if (!session.user.aspen)
    return api.error("No Aspen credentials, please update your account at /account/update", 401);
  try {
    console.log(cookies.get("secret"));
    return api.json(await activity(session, cookies.get("secret")!));
  } catch {
    return api.error("Failed to get activity", 500);
  }
};
