import { query, transformID } from "$lib/database";

import { error } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();

  if (session?.user?.role !== "admin") return error(403, "Forbidden");

  return {
    timeDelta: transformID(
      (
        await query<{ name: "timeDelta"; data: number }>({
          collection: "app",
          query: { name: "timeDelta" }
        })
      )[0] || { name: "timeDelta", data: 0, _id: new ObjectId() }
    )
  };
};
