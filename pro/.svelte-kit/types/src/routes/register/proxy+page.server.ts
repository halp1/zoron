// @ts-nocheck
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load = async ({ locals: { auth } }: Parameters<PageServerLoad>[0]) => {
  const session = await auth();
  if (session?.user?.email) return redirect(302, "/account");
  return {};
};
