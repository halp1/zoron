import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email) return redirect(302, "/login");
  if (!session.user.aspen) return redirect(302, "/account/update");
  return {};
};
