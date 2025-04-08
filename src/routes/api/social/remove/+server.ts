import { adapter } from "$lib/auth";
import { api } from "$lib/server";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.name)
    throw api.error("Unauthorized", 401);

  const body = await request.json();

  if (!body.id) throw api.error("Missing id", 400);

  const user = await adapter.getUser!(body.id);

  if (!user) throw api.error("User not found", 404);

  const existing = user?.relationships?.find(
    (rel) => rel.user === session!.user!.id
  );

  if (!existing || existing.type !== "block") {
    adapter.updateUser!({
      id: user?.id!,
      relationships:
        user?.relationships?.filter((rel) => rel.user !== session!.user!.id) ??
        []
    });
  }
  const self = (await adapter.getUser!(session.user.id))!;

  const relationshipType = self.relationships?.find(
    (rel) => rel.user === body.id
  )?.type;

  adapter.updateUser!({
    id: session.user.id,
    relationships:
      self.relationships?.filter((rel) => rel.user !== body.id) ?? []
  });

  return api.json({
    message:
      (relationshipType === "block"
        ? "Unblocked"
        : relationshipType === "request-outgoing"
          ? "Cancelled friend request for"
          : relationshipType === "request-incoming"
            ? "Rejected friend request from"
            : relationshipType === "friend"
              ? "Unfriended"
              : "Removed relationship with") +
      " " +
      user.name
  });
};
