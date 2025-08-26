import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";

import type { Session } from "@auth/sveltekit";

export const transcript = async (
  session: Session,
  secret: string,
  args: Omit<Parameters<typeof aspen.transcript>[0], "cookie"> = {
    onProgress: () => {}
  }
) => {
  if (!session.user?.email || !session.user.aspen)
    throw new Error("Not authenticated");
  try {
    if (!session?.user?.session?.cookie) throw new Error();
    return await aspen.transcript({
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

    return await aspen.transcript({
      cookie: apsenSession.cookie,
      ...args
    });
  }
};
