// @ts-nocheck
import { redirect } from "@sveltejs/kit";
import { adapter } from "@zoron/common/auth";
import { query, transformID } from "@zoron/common/database";

import type { PageServerLoad } from "./$types";

export const load = async ({ locals: { auth } }: Parameters<PageServerLoad>[0]) => {
  const session = await auth();
  if (!session?.user?.id) return redirect(302, "/login");
  return {
    users: (await query({ collection: "users", query: {} }))
      .map((user) => transformID(user))
      .map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image
      }))
      .filter((user) => user.name && user.email)
  };
};
