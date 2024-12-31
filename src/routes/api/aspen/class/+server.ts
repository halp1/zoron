import { api } from "$lib/server";

import { classDetail } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request, cookies }) => {
  const session = await auth();
  if (!session?.user?.email || !cookies.get("secret")) return api.error("Unauthorized", 401);
  if (!session.user.aspen)
    return api.error("No Aspen credentials, please update your account at /account/update", 401);
  const body = await request.json();
  const requiredArgs = ["classID"];
  if (!requiredArgs.every((arg) => arg in body))
    return api.error("Missing required arguments", 400);
  let assignments = body.assignments;

  try {
    return api.json(
      await classDetail(session, cookies.get("secret")!, { classID: body.classID, assignments })
    );
  } catch (e) {
    console.error(e);
    return api.error("Failed to get class detail", 500);
  }
};
