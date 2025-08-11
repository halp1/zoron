// @ts-nocheck
import { isRedirect, redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

export const load = async ({
  locals: { auth },
  request,
  cookies
}: Parameters<LayoutServerLoad>[0]) => {
  try {
    const session = await auth();
    if (cookies.get("active-session")) {
      return {};
    }
    if (!session?.user?.email || !session.user.id)
      return redirect(302, "/login");
    if (!session.user.aspen) return redirect(302, "/account/update");

    const uri = new URL(request.url);
    const path = uri.pathname;

    redirect(302, "/launch?path=" + encodeURIComponent(path));
  } catch (e) {
    if (isRedirect(e)) throw e;
    return {};
  }
};
