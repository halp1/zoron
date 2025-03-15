import { adapter, auth, trimUser, verifyPassword } from "$lib/auth";
import { query, remove, transformID } from "$lib/database";
import { api } from "$lib/server";

import { AUTH_SECRET } from "$env/static/private";
import "@auth/sveltekit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
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

  const token = {
    sub: user.id.toString(),
    user: trimUser(user)
  };

  const jwt = await auth.jwt.encode({
    salt: auth.cookies.sessionToken.name,
    secret: AUTH_SECRET,
    token
  });

  const response = api.json({ user });
  const cookieOptions = auth.cookies.sessionToken.options;

  response.headers.set(
    "set-cookie",
    `${auth.cookies.sessionToken.name}=${jwt}; Domain=${cookieOptions.domain}; Path=${cookieOptions.path}; HttpOnly=${cookieOptions.httpOnly}; SameSite=${cookieOptions.sameSite}; Secure=${cookieOptions.secure}`
  );

  return response;
};
