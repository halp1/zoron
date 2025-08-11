import type { Session } from "@auth/sveltekit";
import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";

export const classes = async (
  session: Session,
  secret: string,
  options?: aspen.Types.ClassOptions
) => {
  if (!session.user?.email || !session.user.aspen)
    throw new Error("Not authenticated");
  try {
    if (!session?.user?.session?.cookie) throw new Error();
    return await aspen.classes(session.user.session.cookie, options);
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

    return await aspen.classes(apsenSession.cookie, options);
  }
};
