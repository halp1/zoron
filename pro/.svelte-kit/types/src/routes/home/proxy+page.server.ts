// @ts-nocheck
import { isRedirect, redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load = async ({
  locals: { auth },
  cookies,
  request: { url }
}: Parameters<PageServerLoad>[0]) => {
  try {
    const session = await auth();
    const uri = new URL(url);
    const page = uri.searchParams.get("page");
    if (page !== "home") {
      if (session?.user?.settings?.home?.default) {
        return redirect(
          302,
          `/home/${session.user.settings.home.default === "home" ? "?page=home" : session.user.settings.home.default}`
        );
      }
    }
    return {};
  } catch (e) {
    if (isRedirect(e)) throw e;
    return {};
  }
};
