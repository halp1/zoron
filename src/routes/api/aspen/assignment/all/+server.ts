import type { aspen } from "$lib/aspen";
import type { Assignment } from "$lib/aspen/types";
import { streamPromise } from "$lib/server";
import type { Session } from "@auth/sveltekit";



import { assignment } from "../";
import type { RequestHandler } from "./$types";


const  processBatch = async(
  session: Session,
  assignments: { assignment: Assignment; studentID: string }[],
  stream: any
) => {
  const queue = [...assignments];
  const inProgress = new Set();
  const batchSize = 5;

  async function processOne(item: { assignment: Assignment; studentID: string }) {
    try {
      let t = 0;
      const result = await assignment(session, item.assignment, item.studentID, (step, total) => {
        stream.tick({ step, total, id: item.assignment.id });
        t = total;
      });
      stream.tick({ step: t, total: t, id: item.assignment.sscid, data: result });
      return result;
    } catch (error) {
      return null;
    } finally {
      inProgress.delete(item);
      if (queue.length > 0) {
        const next = queue.shift()!;
        inProgress.add(next);
        processOne(next);
      }
    }
  }

  // Start initial batch
  const initialBatch = queue.splice(0, batchSize);
  const results = [];

  for (const item of initialBatch) {
    inProgress.add(item);
    results.push(processOne(item));
  }

  // Wait for all assignments to complete
  const allResults = await Promise.all(results);
  stream.end(allResults);
}

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

  processBatch(session, body, stream);

  return stream.response();
};