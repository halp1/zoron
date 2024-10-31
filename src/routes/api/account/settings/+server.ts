import { adapter } from "$lib/auth";
import { api } from "$lib/server";
import type { Settings } from "$lib/types";

import _ from "lodash";

import type { RequestHandler } from "./$types";
import { defaultSettings } from "./defaults";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email) return api.error("Unauthorized", 401);
  const body: DeepPartial<Settings> = await request.json();
  const settingsToUpdate: Settings = _.merge(defaultSettings, session.user.settings || {});
  if (typeof body?.notifications?.attendance === "boolean")
    settingsToUpdate.notifications.attendance = body.notifications.attendance;
  if (typeof body?.notifications?.grades === "boolean")
    settingsToUpdate.notifications.grades = body.notifications.grades;
  if (
    typeof body?.home?.default === "string" &&
    ["home", "calendar", "grades", "activity"].includes(body.home.default)
  ) {
    settingsToUpdate.home.default = body.home.default;
  }

  await adapter.updateUser!({ id: session.user.id!, settings: settingsToUpdate });

  return api.json(settingsToUpdate);
};
