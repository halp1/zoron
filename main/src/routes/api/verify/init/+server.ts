import { auth } from "@zoron/common/auth";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = ({ cookies }) => {
  const cookieOptions = auth.cookies.sessionToken.options;

  cookies.set("zoron.register", "1", {
    path: cookieOptions.path,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    domain: cookieOptions.domain,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    httpOnly: cookieOptions.httpOnly
  });

  return new Response("", { status: 200 });
};
