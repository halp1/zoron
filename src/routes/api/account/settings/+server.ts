import type { Settings } from "$lib/types";
import { api } from "$lib/server";
import { adapter } from "../../../../auth";
import type { RequestHandler } from "./$types";
import _ from "lodash";
import { defaultSettings } from "./defaults";

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.email) return api.error("Unauthorized", 401);
  const body = await request.json();
  const settingsToUpdate: Settings = _.merge(defaultSettings, session.user.settings || {});
  if (typeof body?.notifications?.attendance === "boolean")
    settingsToUpdate.notifications.attendance = body.notifications.attendance;
  if (typeof body?.notifications?.grades === "boolean")
    settingsToUpdate.notifications.grades = body.notifications.attendance;

  await adapter.updateUser!({ id: session.user.id!, settings: settingsToUpdate });

  return api.json(settingsToUpdate);
};
