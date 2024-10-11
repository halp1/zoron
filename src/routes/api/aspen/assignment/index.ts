import { aspen } from "$lib/aspen";
import type { Session } from "@auth/sveltekit";
import { adapter } from "../../../../auth";
import type { Assignment } from "$lib/aspen/types";

export const assignment = async (session: Session, assignment: Assignment, studentID: string) => {
  if (!session.user?.email || !session.user.aspen) throw new Error("Not authenticated");
  if (!assignment) throw new Error("No assignment provided");
  try {
    if (!session?.user?.session?.cookie || !session.user.session.cookie) throw new Error();
    return await aspen.assignment({
      cookie: session.user.session.cookie,
      token: session.user.session.token,
      assignment,
      studentID
    });
  } catch {
    const { username, password } = aspen.decrypt(session.user.email, session.user.aspen);
    const aspenSession = await aspen.authenticate(username, password);

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
      studentID
    });
  }
};
