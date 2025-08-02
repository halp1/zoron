import { adapter, auth } from "$lib/auth";
import { query, remove, transformID } from "$lib/database";
import { api } from "$lib/server";

import "@auth/sveltekit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email, name, token: t } = await request.json();
  if (!t) return api.error("Missing token", 400);

  const match = await query({ collection: "impersonate", query: { token: t } });
  if (!match.length) return api.error("Invalid token", 400);
  remove("impersonate", { token: t });

  if ((!email || email === "") && (!name || name === ""))
    return api.error("Missing target", 400);

  const user = await (email?.length
    ? adapter.getUserByEmail!(email)
    : adapter.getUser!(
        transformID((await query({ collection: "users", query: { name } }))[0])
          ._id
      ));
  if (!user) {
    return api.error("Invalid target", 404);
  }

  const response = api.json({ user });
  const cookieOptions = auth.cookies.sessionToken.options;

  const session = await adapter.createSession!({
    sessionToken:
      Math.random().toString(36).substring(2) +
      "-" +
      Math.random().toString(36).substring(2),
    userId: user.id,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
  });

  cookies.set(auth.cookies.sessionToken.name, session.sessionToken, {
    domain: cookieOptions.domain,
    path: cookieOptions.path,
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure
  });

  return response;
};
