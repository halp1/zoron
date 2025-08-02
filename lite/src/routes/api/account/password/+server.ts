import { adapter, hashPassword, auth as libAuth } from "$lib/auth";
import { api } from "$lib/server";

import crypto from "node:crypto";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({
  locals: { auth },
  request,
  cookies
}) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id)
    return api.error("Not authenticated", 401);
  const body = await request.json();
  const password = body.password;
  if (!password || password.length === 0)
    return api.error("No password provided", 400);
  const { hash, salt } = await hashPassword(password);
  await adapter.updateUser!({
    id: session.user.id,
    password: { hash, salt },
    aspen: undefined
  });

  const cookieOptions = libAuth.cookies.sessionToken.options;
  cookies.set(
    "secret",
    crypto.createHash("sha512").update(password).digest("hex"),
    {
      path: cookieOptions.path,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      domain: cookieOptions.domain,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      httpOnly: cookieOptions.httpOnly
    }
  );
  return api.json({ success: true });
};
