import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { activity } from "../api/aspen/activity";

export const load: LayoutServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email) return redirect(302, "/login");
  if (!session.user.aspen) return redirect(302, "/account/update");

  try {
    return { activity: await activity(session) };
  } catch {
    return { activity: null };
  }
};
