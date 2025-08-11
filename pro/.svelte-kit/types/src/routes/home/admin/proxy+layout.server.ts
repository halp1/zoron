// @ts-nocheck
import { error } from "@sveltejs/kit";
import { query, transformID } from "@zoron/common/database";

import type { LayoutServerLoad } from "./$types";

export const load = async ({ locals: { auth } }: Parameters<LayoutServerLoad>[0]) => {
  const session = await auth();

  if (session?.user?.role !== "admin") return error(403, "Forbidden");

  return {};
};
