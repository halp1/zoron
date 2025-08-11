import { adapter } from "@zoron/common/auth/auth";
import { query, transformID } from "@zoron/common/database";

import { isRedirect, redirect } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({
  locals: { auth },
  request,
  cookies
}) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) return redirect(302, "/login");
  const user = await adapter.getUser!(session.user.id);
  return {
    app: {
      timeDelta: await query<{ name: "timeDelta"; data: number }>({
        collection: "app",
        query: { name: "timeDelta" }
      }).then(
        (result) =>
          transformID(
            result[0] || { name: "timeDelta", data: 0, _id: new ObjectId() }
          ).data
      ),
      schedule: user?.schedule!
    }
  };
};
