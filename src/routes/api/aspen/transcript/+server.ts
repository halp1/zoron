import { api } from "$lib/server";

import { transcript } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({
  locals: { auth },
  request,
  cookies
}) => {
  const session = await auth();
  if (!session?.user?.email || !cookies.get("secret"))
    return api.error("Unauthorized", 401);
  if (!session.user.aspen)
    return api.error(
      "No Aspen credentials, please update your account at /account/update",
      401
    );

  try {
    return api.json(await transcript(session, cookies.get("secret")!));
  } catch (e) {
    console.error(e);
    return api.error("Failed to get transcript", 500);
  }
};
