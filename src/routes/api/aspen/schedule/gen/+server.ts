import { adapter } from "$lib/auth";
import { streamPromise } from "$lib/server";

import { generateSchedule } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const stream = await streamPromise<Awaited<ReturnType<typeof generateSchedule>>>();
  const session = await auth();
  if (!session?.user?.email || !session.user.id) return stream.error("Not authenticated", 401);
  if (!session.user.aspen)
    return stream.error("No Aspen credentials, please update your account at /account/update", 401);
  if (
    session.user.schedule &&
    session.user.schedule.updated &&
    session.user.schedule.updated > Date.now() - 1000 * 60 * 60 * 24
  )
    return stream.error(
      "Schedule updated within the last 24 hours. You may only request a schedule refresh every 24 hours.",
      400
    );

  const body = await request.json();
  const semester = body.semester;
  if (!semester) return stream.error("No semester provided", 400);
  if (semester !== 1 && semester !== 2) return stream.error("Invalid semester", 400);

  generateSchedule(session, semester, stream.tick)
    .then((res) => {
      adapter.updateUser!({
        id: session!.user!.id!,
        schedule: { ...res, updated: Date.now() }
      });

      stream.end(res);
    })
    .catch(() => stream.error(`Failed to download schedule`, 500));

  return stream.response();
};
