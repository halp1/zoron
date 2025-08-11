import { adapter } from "@zoron/common/auth";
import { api } from "@zoron/common/server";

import _ from "lodash";

import { defaultSettings } from "../settings/defaults";
import type { RequestHandler } from "./$types";

export interface AccountUpdateRes {
  name: string;
}

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();

  if (!session || !session.user || !session.user.id)
    return api.error("Not authorized", 401);

  const data: { fullName: string } = await request.json();

  if (
    !data.fullName ||
    typeof data.fullName !== "string" ||
    data.fullName.trim().length < 2
  )
    return api.error("Full name must be at least 2 characters", 400);

  try {
    const trimmedName = data.fullName.trim();

    await adapter.updateUser!({
      id: session.user.id,
      name: trimmedName,
      settings: _.merge(defaultSettings, session.user.settings || {}),
      devices: [],
      activity: undefined,
      schedule: undefined
    });

    return api.json<AccountUpdateRes>({
      name: trimmedName
    });
  } catch (e: any) {
    return api.error(e.message, 500);
  }
};
