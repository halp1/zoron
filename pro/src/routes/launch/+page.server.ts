import { redirect } from "@sveltejs/kit";
import { auth as authLib } from "@zoron/common/auth";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth }, cookies }) => {
  const session = await auth();

  if (
    !session?.user?.email ||
    !session.user.id ||
    !session.user.password ||
    !session.user.aspen
  )
    return redirect(302, "/login");
  if (!cookies.get("secret")) {
    const cookieOptions = authLib.cookies.sessionToken.options;
    cookies.delete(authLib.cookies.sessionToken.name, {
      path: cookieOptions.path,
      domain: cookieOptions.domain,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      httpOnly: cookieOptions.httpOnly
    });
    return redirect(302, "/login?error=no-secret");
  }

  if (!session.user.aspen) return redirect(302, "/account/update");
  return {};
};
