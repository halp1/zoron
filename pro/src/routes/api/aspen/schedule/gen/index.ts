import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";

import type { Session } from "@auth/sveltekit";

export const generateSchedule = async (
  session: Session,
  secret: string,
  semester: aspen.Types.Schedule.Semester,
  onProgress?: aspen.Types.ProgressCallback
) => {
  if (!session.user?.email || !session.user.aspen)
    throw new Error("Not authenticated");
  try {
    if (!session?.user?.session?.cookie || !session.user.session.cookie)
      throw new Error();
    return await aspen.schedule.pdf(
      session.user.session.cookie,
      semester,
      onProgress
    );
  } catch {
    const total =
      aspen.constants.steps.authenticate + aspen.constants.steps.schedule.pdf;
    const { username, password } = aspen.decrypt(secret, session.user.aspen);
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

    return await aspen.schedule.pdf(
      aspenSession.cookie,
      semester,
      (step) =>
        onProgress &&
        onProgress(step + aspen.constants.steps.authenticate, total)
    );
  }
};
