import { aspen } from "$lib/aspen";
import type { Assignment } from "$lib/aspen/types";
import { adapter } from "$lib/auth";

import type { Session } from "@auth/sveltekit";

export const assignment = async (
  session: Session,
  assignment: Assignment,
  studentID: string,
  onProgress?: aspen.Types.ProgressCallback,
  skipCache?: boolean
) => {
  if (!session.user?.email || !session.user.aspen) throw new Error("Not authenticated");
  if (!assignment) throw new Error("No assignment provided");
  try {
    if (!session?.user?.session?.cookie || !session.user.session.cookie || skipCache)
      throw new Error();
    return await aspen.assignment({
      cookie: session.user.session.cookie,
      token: session.user.session.token,
      assignment,
      studentID,
      onProgress
    });
  } catch {
    const total = aspen.constants.steps.authenticate + aspen.constants.steps.assignment;

    const { username, password } = aspen.decrypt(session.user.email, session.user.aspen);
    const aspenSession = await aspen.authenticate(
      username,
      password,
      (step) => onProgress && onProgress(step, total)
    );

    await adapter.updateUser!({
      id: session.user.id!,
      session: {
        cookie: aspenSession.cookie,
        token: aspenSession.token
      }
    });

    return await aspen.assignment({
      cookie: aspenSession.cookie,
      token: aspenSession.token,
      assignment,
      studentID,
      onProgress: (step) =>
        onProgress && onProgress(step + aspen.constants.steps.authenticate, total)
    });
  }
};
