import { adapter, auth, trimUser, verifyPassword } from "$lib/auth";
import { api } from "$lib/server";

import { AUTH_SECRET } from "$env/static/private";
import "@auth/sveltekit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const { email, password } = await request.json();

  if (!email || !password || email === "" || password === "") {
    return api.error("Missing email or password", 400);
  }

  const user = await adapter.getUserByEmail!(email);
  if (!user) {
    return api.error("Invalid email.", 404);
  }
  if (!user.password) {
    return api.error("No password set. You can set your password at /account/password", 404);
  }

  const valid = await verifyPassword(password, user.password.salt, user.password.hash);
  if (!valid) {
    return api.error("Invalid password.", 401);
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
