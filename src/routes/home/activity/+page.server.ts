import { redirect } from "@sveltejs/kit";

import { activity } from "../../api/aspen/activity";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  try {
    return { activity: await activity(session!) };
  } catch {
    return { activity: null };
  }
};
