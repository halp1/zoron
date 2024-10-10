import { aspen } from "$lib/aspen";
import { api } from "$lib/web/api";
import type { RequestHandler } from "./$types";
import type { Session } from "$lib/types";
import { adapter } from "../../../../auth";

export interface AccountUpdateRes {
  email: string;
  name: { first: string; last: string };
  session: Session;
}

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();

  if (!session || !session.user || !session.user.id) api.error("Not authorized", 401);
  const data: { username: string; password: string } = await request.json();
  if (!data.username || typeof data.username !== "string" || data.username.length === 0)
    return api.error("Missing username", 400);
  if (!data.password || typeof data.password !== "string" || data.password.length === 0)
    return api.error("Missing password", 400);

  try {
    const account = await aspen.authenticate(data.username, data.password);
    const email = await aspen.email(account.cookie);
    if (email !== session?.user?.email) {
      return api.error(
        `This is not your account (email mismatch: ${email} vs ${session?.user?.email})`,
        401
      );
    }

    const encrypted = aspen.encrypt(email, data.username, data.password);

    await adapter.updateUser!({
      id: session.user.id!,
      name: `${account.name.first} ${account.name.last}`,
      aspen: encrypted,
      session: { cookie: account.cookie, token: account.token },
      subscriptions: []
    });

    return api.json<AccountUpdateRes>({
      email,
      session: { cookie: account.cookie, token: account.token },
      name: account.name
    });
  } catch (e: any) {
    return api.error(e.message, 401);
  }
};
