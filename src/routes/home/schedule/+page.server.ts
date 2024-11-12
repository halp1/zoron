import { adapter } from "$lib/auth";

import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.id) return redirect(302, "/login");
  return {
    schedule: (await adapter.getUser!(session.user.id))?.schedule
  };
};
