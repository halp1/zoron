import { aspen } from "$lib/aspen";
import { adapter } from "$lib/auth";

import type { Session } from "@auth/sveltekit";

export const classDetail = async (
  session: Session,
  secret: string,
  args: Omit<Parameters<typeof aspen.classDetail>[0], "cookie">
) => {
  if (!session.user?.email || !session.user.aspen)
    throw new Error("Not authenticated");
  try {
    if (!session?.user?.session?.cookie) throw new Error();
    return await aspen.classDetail({
      cookie: session.user.session.cookie,
      ...args
    });
  } catch {
    const { username, password } = aspen.decrypt(secret, session.user.aspen);
    const apsenSession = await aspen.authenticate(username, password);

    await adapter.updateUser!({
      id: session.user.id!,
      session: {
        cookie: apsenSession.cookie,
        token: apsenSession.token
      }
    });

    return await aspen.classDetail({
      cookie: apsenSession.cookie,
      ...args
    });
  }
};
