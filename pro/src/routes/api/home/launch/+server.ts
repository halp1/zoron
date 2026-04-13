import type { RequestHandler } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

import { defaultSettings } from "@zoron/common/api/account/defaults";
import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";
import { cache } from "@zoron/common/cache";
import { update } from "@zoron/common/database";
import { insert, query, transformID } from "@zoron/common/database";
import { api } from "@zoron/common/server";
import type { AppState } from "@zoron/common/web";

import _ from "lodash";
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

  // make sure the user can auth correctly before doing anything else
  try {
    await a();
  } catch (e) {
    const networkOk = await fetch(
      "https://ma-lexington.myfollett.com/aspen-login/?deploymentId=ma-lexington"
    )
      .then(() => true)
      .catch(() => false);

    if (networkOk) {
      console.error("Authentication failed for user:", user!.email, e);
      adapter.updateUser!({
        id: session.user.id!,
        settings: {
          ..._.merge(defaultSettings, user!.settings),
          notifications: {
            attendance: false,
            grades: false
          }
        }
      });

      await update(
        "users",
        { _id: new ObjectId(session.user.id!) },
        { $unset: { session: "", aspen: "" } }
      );

      await insert("alerts", {
        userID: session.user.id!,
        type: "error",
        message:
          "Your Aspen credentials are no longer valid. Notifications have been disabled. Please update your password and then re-enable notifications.",
        date: new Date().toISOString()
      });
    } else {
      throw redirect(302, "/account/update");
      // console.error("Network error while authenticating user:", user!.email, e);
      // // Don't disable notifications since this is likely a temporary issue
      // return [];
    }
  }

  const data = await Promise.all([
    a().then((cookie) => aspen.announcements(cookie)),
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
    announcements: data[0],
    schedule: user?.schedule,
    constants: {
      timeDelta: data[1]
    },
    preloadedActivity: user?.activity || [],
    session: {
      cookie: data[2].cookie,
      token: data[2].token
    },
    classes: data[3],
    activity: data[4],
    transcript: data[5]
  });

  cookies.set("active-session", session.user.aspen, {
    path: "/",
    expires: new Date(Date.now() + 2000)
  });

  return response;
};
