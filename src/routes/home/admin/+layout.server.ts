import { query, transformID } from "$lib/database";

import { error } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();

  if (session?.user?.role !== "admin") return error(403, "Forbidden");

  return {};
};
