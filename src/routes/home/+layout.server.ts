import { adapter } from "$lib/auth";
import { query, transformID } from "$lib/database";

import { redirect } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) return redirect(302, "/login");
  if (!session.user.aspen) return redirect(302, "/account/update");

  return {
    schedule: (await adapter.getUser!(session.user.id))?.schedule,
    constants: {
      timeDelta: transformID(
        (
          await query<{ name: "timeDelta"; data: number }>({
            collection: "app",
            query: { name: "timeDelta" }
          })
        )[0] || { name: "timeDelta", data: 0, _id: new ObjectId() }
      ).data
    }
  };
};
