// @ts-nocheck
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load = async ({ locals: { auth } }: Parameters<PageServerLoad>[0]) => {
  if (!(await auth())?.user?.email) return redirect(302, "/login");
  return {};
};
