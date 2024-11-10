import { redirect } from "@sveltejs/kit";

import { activity } from "../../api/aspen/activity";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
	if (!session?.user?.email || !session.user.id) return redirect(302, "/login");
  try {
    return { activity: activity(session!) };
  } catch {
    return { activity: null };
  }
};
