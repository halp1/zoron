import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const account = await event.locals.auth();
  if (!account || !account.user) return redirect(307, "/login");
  if (!account.user.name || !account.user.subscriptions) return redirect(307, "account/complete");
  return {};
};
