import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  if (session?.user) {
    if (session.user.name) return redirect(302, "/home");
    else return redirect(302, "/account");
  }
  return {};
};
