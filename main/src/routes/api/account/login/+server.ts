import { adapter, auth, verifyPassword } from "@zoron/common/auth";
import { api } from "@zoron/common/server";

import "@auth/sveltekit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email, password, secret } = await request.json();

  if (
    !email ||
    !password ||
    !secret ||
    email === "" ||
    password === "" ||
    secret === ""
  ) {
    return api.error("Missing email or password", 400);
  }

  const user = await adapter.getUserByEmail!(email);
  if (!user) {
    return api.error("Invalid email.", 404);
  }
  if (!user.password) {
    return api.error(
      "No password set. You can set your password at /account/password",
      404
    );
  }

  const valid = await verifyPassword(
    password,
    user.password.salt,
    user.password.hash
  );
  if (!valid) {
    return api.error("Invalid password.", 401);
  }

  const session = await adapter.createSession!({
    sessionToken:
      Math.random().toString(36).substring(2) +
      "-" +
      Math.random().toString(36).substring(2),
    userId: user.id,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
  });

  const response = api.json({ user });
  const cookieOptions = auth.cookies.sessionToken.options;
  cookies.set(auth.cookies.sessionToken.name, session.sessionToken, {
    domain: cookieOptions.domain,
    path: cookieOptions.path,
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure
  });
  cookies.set("secret", secret, {
    path: cookieOptions.path,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    domain: cookieOptions.domain,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    httpOnly: cookieOptions.httpOnly
  });

  console.log(
    "setcookie!",
    auth.cookies.sessionToken.name,
    session.sessionToken
  );

  return response;
};
