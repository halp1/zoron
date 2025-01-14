import { fromCookie, fromCookies } from "$lib/auth";

import { isRedirect, redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth }, cookies, request: { url } }) => {
  try {
    // const session = await fromCookies(cookies);
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
