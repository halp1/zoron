import { adapter } from "@zoron/common/auth";
import { api } from "@zoron/common/server";
import type { Settings } from "@zoron/common/types";

import _ from "lodash";

import type { RequestHandler } from "./$types";
import { defaultSettings } from "./defaults";
import type { User } from "@auth/sveltekit";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email) return api.error("Unauthorized", 401);
  const body: DeepPartial<Settings> = await request.json();
  const settingsToUpdate: Settings = _.merge(
    defaultSettings,
    session.user.settings || {}
  );
  if (typeof body?.notifications?.attendance === "boolean")
    settingsToUpdate.notifications.attendance = body.notifications.attendance;
  if (typeof body?.notifications?.grades === "boolean")
    settingsToUpdate.notifications.grades = body.notifications.grades;
  if (
    typeof body?.home?.default === "string" &&
    ["home", "schedule", "grades", "activity"].includes(body.home.default)
  ) {
    settingsToUpdate.home.default = body.home.default;
  }
  if (typeof body?.home?.hideGPA === "boolean")
    settingsToUpdate.home.hideGPA = body.home.hideGPA;
  if (
    typeof body?.social?.schedule === "string" &&
    ["all", "friends", "none"].includes(body.social.schedule)
  ) {
    settingsToUpdate.social.schedule = body.social.schedule;
  }

  await adapter.updateUser!({
    id: session.user.id!,
    settings: settingsToUpdate
  } satisfies User as any);

  return api.json(settingsToUpdate);
};
