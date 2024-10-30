import { adapter, auth, verifyPassword } from "$lib/auth";
import { api } from "$lib/server";
import type { RequestHandler } from "./$types";
import {} from "@auth/sveltekit";

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

  const token = auth.session.generateSessionToken();
  await adapter.createSession!({
    userId: user.id,
    sessionToken: token,
    expires: new Date(Date.now() + auth.session.maxAge * 1000)
  });

  const response = api.json({ user });
  const cookieOptions = auth.cookies.sessionToken.options;
  response.headers.set(
    "set-cookie",
    `${auth.cookies.sessionToken.name}=${token}; Domain=${cookieOptions.domain}; Path=${cookieOptions.path}; HttpOnly=${cookieOptions.httpOnly}; SameSite=${cookieOptions.sameSite}; Secure=${cookieOptions.secure}`
  );

  return response;
};
