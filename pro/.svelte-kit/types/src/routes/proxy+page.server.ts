// @ts-nocheck
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load = async ({ locals: { auth } }: Parameters<PageServerLoad>[0]) => {
  const session = await auth();
  if (session?.user) {
    if (session.user.aspen) return redirect(302, "/home");
    else return redirect(302, "/account");
  }
  return {};
};
