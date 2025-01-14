import { aspen } from "$lib/aspen";
import { adapter } from "$lib/auth";
import { query, transformID } from "$lib/database";
import { api } from "$lib/server";
import type { AppState } from "$lib/web";

import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

export const GET: RequestHandler = async ({ locals: { auth }, cookies }) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id || !cookies.get("secret"))
    return api.error("Not authenticated", 401);
  if (!session.user.aspen) return api.error("Missing credentials", 401);
  const user = await adapter.getUser!(session.user.id);
  const credentials = aspen.decrypt(cookies.get("secret")!, session.user.aspen);
  const aspenSession = await aspen.authenticate(credentials.username, credentials.password);

  const response = api.json<AppState>({
    schedule: user?.schedule,
    constants: {
      timeDelta: transformID(
        (
          await query<{ name: "timeDelta"; data: number }>({
            collection: "app",
            query: { name: "timeDelta" }
          })
        )[0] || { name: "timeDelta", data: 0, _id: new ObjectId() }
      ).data
    },
    preloadedActivity: user?.activity || [],
    session: {
      cookie: aspenSession.cookie,
      token: aspenSession.token
    },
    classes: (await aspen.classes(aspenSession.cookie)).classes,
    activity: await aspen.activity(aspenSession.cookie)
  });

  cookies.set("active-session", session.user.aspen, {
    path: "/",
    expires: new Date(Date.now() + 2000)
  });

  return response;
};
