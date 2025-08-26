import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";
import { api, streamPromise } from "@zoron/common/server";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({
  locals: { auth },
  request,
  cookies
}) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id || !cookies.get("secret"))
    throw api.error("Not authenticated", 401);

  const body = await request.json();
  const semester = body.semester;
  if (!semester) throw api.error("No semester provided", 400);
  if (semester !== 1 && semester !== 2)
    throw api.error("Invalid semester", 400);

  const content = body.schedule;
  const parsed = Buffer.from(content, "base64");

  const res = await aspen.schedule.parser.extract(parsed, semester);

  adapter.updateUser!({
    id: session!.user!.id!,
    schedule: { ...res, updated: Date.now() }
  });
  return api.json();
};
