import { api } from "$lib/web/api";
import { assignment } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email) return api.error("Unauthorized", 401);
  if (!session.user.aspen)
    return api.error("No Aspen credentials, please update your account at /account/update", 401);

  const body = await request.json();
  if (!body.assignment) return api.error("No assignment provided", 400);
  if (!body.studentID) return api.error("No student ID provided", 400);

  try {
    return api.json(await assignment(session, body.assignment, body.studentID));
  } catch (e: any) {
		return api.error(`Failed to get assignment (${e?.message || e})`, 500);
  }
};
