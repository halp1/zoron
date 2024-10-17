import type { aspen } from "$lib/aspen";
import { api, streamPromise } from "$lib/server";
import { assignment } from ".";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const stream = await streamPromise<aspen.Types.Assignment>();
  const session = await auth();
  if (!session?.user?.email) return stream.error("Unauthorized", 401);
  if (!session.user.aspen)
    return stream.error("No Aspen credentials, please update your account at /account/update", 401);

  const body = await request.json();
  if (!body.assignment) return stream.error("No assignment provided", 400);
  if (!body.studentID) return stream.error("No student ID provided", 400);

  assignment(session, body.assignment, body.studentID, stream.tick)
    .then((res) => stream.end(res))
    .catch((error) => stream.error(`Failed to get assignment (${error?.message || error})`, 500));
  return stream.response();
};
