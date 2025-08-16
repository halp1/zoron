import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "../../../../main/.svelte-kit/types/src/routes/verify/$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  if (session?.user?.email) redirect(302, "/home");
};
