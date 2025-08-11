import { adapter } from "@zoron/common/auth";
import { api } from "@zoron/common/server";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals: { auth }, params }) => {
  const session = await auth();

  if (!session?.user?.id) throw api.error("Unauthorized", 401);

  const user = await adapter.getUser!(params.id);

  if (!user) throw api.error("User not found", 404);

  const setting = user.settings?.social.schedule ?? "all";

  if (setting === "none")
    throw api.error(
      "This user does not allow others to view their schedule",
      403
    );

  if (setting === "friends") {
    if (
      user.relationships?.find(
        (relationship) => relationship.user === session!.user!.id
      )?.type !== "friend"
    )
      throw api.error(
        "You must be this user's friend to view their schedule",
        403
      );
  }

  if (user.schedule) return api.json(user.schedule);
  else throw api.error("This user has not loaded their schedule", 404);
};
