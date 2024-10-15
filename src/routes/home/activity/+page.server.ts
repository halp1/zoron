import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { activity } from "../../api/aspen/activity";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
const session = await auth();
  try {
    return { activity: await activity(session!) };
  } catch {
    return { activity: null };
  }
};
