import type { aspen } from "$lib/aspen";
import type { Assignment } from "$lib/aspen/types";
import { adapter } from "$lib/auth";
import { streamPromise } from "$lib/server";

import type { Session } from "@auth/sveltekit";

import { assignment } from "../";
import type { RequestHandler } from "./$types";

const processBatch = async (
  session: Session,
  assignments: { assignment: Assignment; studentID: string }[],
  stream: Awaited<ReturnType<typeof streamPromise<(aspen.Types.AssignmentScore | null)[]>>>
) => {
  if (!session.user?.aspen)
    return stream.error("No Aspen credentials, please update your account at /account/update", 401);
  const queue = [...assignments];
  const results: (aspen.Types.AssignmentScore | null)[] = [];
  const internalResults: { id: string; data: aspen.Types.AssignmentScore | null }[] = [];
  const inProgress = new Set();
  const batchSize = 20;

  async function processOne(item: { assignment: Assignment; studentID: string }) {
    try {
      let t = 0;
      const result = await assignment(
        session,
        item.assignment,
        item.studentID,
        (step, total) => {
          stream.tick({ step, total, id: item.assignment.id });
          t = total;
        },
        true
      );
      stream.tick({ step: t, total: t, id: item.assignment.id, data: result });
      internalResults.push({ id: item.assignment.id, data: result });
      return result;
    } catch (error) {
      stream.tick({ step: 0, total: 0, id: item.assignment.id, data: null });
      internalResults.push({ id: item.assignment.id, data: null });
      return null;
    } finally {
      inProgress.delete(item);
      if (queue.length > 0) {
        const next = queue.shift()!;
        inProgress.add(next);
        results.push(await processOne(next));
      } else if (inProgress.size === 0) {
        stream.end(results);
        // upload results to db
        const current = session.user!.activity || [];
        const merged = current
          .filter((a) => !internalResults.some((b) => a.id === b.id))
          .concat(internalResults);

        adapter.updateUser!({ id: session.user?.id!, activity: merged });
      }
    }
  }

  // Start initial batch
  const initialBatch = queue.splice(0, batchSize);

  for (const item of initialBatch) {
    inProgress.add(item);
    processOne(item).then((result) => results.push(result));
  }

  return stream.response();
};

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const stream = await streamPromise<(aspen.Types.AssignmentScore | null)[]>();
  const session = await auth();
  if (!session?.user?.email) return stream.error("Unauthorized", 401);
  if (!session.user.aspen)
    return stream.error("No Aspen credentials, please update your account at /account/update", 401);

  const body = await request.json();
  if (!(body instanceof Array)) return stream.error("Invalid body", 400);
  for (const item of body) {
    if (!item.assignment) return stream.error("No assignment provided", 400);
    if (!item.studentID) return stream.error("No student ID provided", 400);
  }

  return processBatch(session, body, stream);
};
