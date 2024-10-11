import { aspen } from "$lib/aspen";
import type { Session } from "@auth/sveltekit";
import { adapter } from "../../../../auth";

export const activity = async (session: Session) => {
  if (!session.user?.email || !session.user.aspen) throw new Error("Not authenticated");
  try {
    if (!session?.user?.session?.cookie) throw new Error();
    return await aspen.activity(session.user.session.cookie);
  } catch {
    const { username, password } = aspen.decrypt(session.user.email, session.user.aspen);
    const apsenSession = await aspen.authenticate(username, password);

    await adapter.updateUser!({
      id: session.user.id!,
      session: {
        cookie: apsenSession.cookie,
        token: apsenSession.token
      }
    });

    return await aspen.activity(apsenSession.cookie);
  }
};
