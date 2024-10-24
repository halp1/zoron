import { api } from "$lib/server";
import { generateSchedule } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email) throw api.error("Not authenticated", 401);
  if (!session.user.aspen)
    return api.error("No Aspen credentials, please update your account at /account/update", 401);

  try {
    return api.json(await generateSchedule(session));
  } catch {
    throw api.error('Failed to generate schedule', 500);
  }
};
