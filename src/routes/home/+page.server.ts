import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth }, request: { url } }) => {
  const uri = new URL(url);
  const session = await auth();
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
};
