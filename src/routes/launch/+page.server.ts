import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) return redirect(302, "/login");
  if (!session.user.aspen) return redirect(302, "/account/update");
  return {};
};
