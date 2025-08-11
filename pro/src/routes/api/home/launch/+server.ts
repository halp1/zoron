import type { RequestHandler } from "@sveltejs/kit";
import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";
import { cache } from "@zoron/common/cache";
import { query, transformID } from "@zoron/common/database";
import { api } from "@zoron/common/server";
import type { AppState } from "@zoron/common/web";
import { ObjectId } from "mongodb";

export const GET: RequestHandler = async ({ locals: { auth }, cookies }) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id || !cookies.get("secret"))
    return api.error("Not authenticated", 401);
  if (!session.user.aspen) return api.error("Missing credentials", 401);
  const user = await adapter.getUser!(session.user.id);
  const credentials = aspen.decrypt(cookies.get("secret")!, session.user.aspen);
  const a = () =>
    aspen
      .authenticate(credentials.username, credentials.password)
      .then(({ cookie }) => cookie);
  cache.setUser(session.user.id, cookies.get("secret")!);

  const data = await Promise.all([
    query<{ name: "timeDelta"; data: number }>({
      collection: "app",
      query: { name: "timeDelta" }
    }).then(
      (result) =>
        transformID(
          result[0] || { name: "timeDelta", data: 0, _id: new ObjectId() }
        ).data
    ),
    aspen.authenticate(credentials.username, credentials.password),
    a()
      .then((cookie) => aspen.classes(cookie))
      .then(({ classes }) => classes),
    a().then((cookie) => aspen.activity(cookie)),
    a().then((cookie) => aspen.transcript({ cookie, all: true }))
  ] as const);

  const response = api.json<AppState>({
    schedule: user?.schedule,
    constants: {
      timeDelta: data[0]
    },
    preloadedActivity: user?.activity || [],
    session: {
      cookie: data[1].cookie,
      token: data[1].token
    },
    classes: data[2],
    activity: data[3],
    transcript: data[4]
  });

  cookies.set("active-session", session.user.aspen, {
    path: "/",
    expires: new Date(Date.now() + 2000)
  });

  return response;
};
