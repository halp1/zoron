import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "../../../../main/.svelte-kit/types/src/routes/logout/$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  if (!(await auth())?.user?.email) return redirect(302, "/login");
  return {};
};
