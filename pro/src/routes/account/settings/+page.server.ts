import { redirect } from "@sveltejs/kit";

import { adapter } from "@zoron/common/auth";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();

  if (!session?.user?.aspen) return redirect(302, "/account");

  return {
    devices: (await adapter.getUser!(session.user.id!))?.devices || []
  };
};
