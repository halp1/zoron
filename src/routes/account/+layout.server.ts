import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const account = await event.locals.auth();
  if (!account || !account.user) return redirect(307, "/login");
  if (!account.user.password) {
    if (new URL(event.request.url).pathname.includes("/password")) return {};
    return redirect(307, "/account/password");
  }
  if (
    (!account.user.name || !account.user.aspen) &&
    !new URL(event.request.url).pathname.includes("/update")
  )
    return redirect(307, "/account/update");
  return {};
};
