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

  if (existing) {
    switch (existing.type) {
      case "block":
        throw api.error("This user has blocked you", 403);
      case "friend":
        throw api.error("You are already friends with this user", 409);
      case "request-incoming":
        throw api.error("You have already sent a request to this user", 409);
      case "request-outgoing":
        throw api.error("This user has already sent you a request", 409);
    }
  }

  const self = (await adapter.getUser!(session.user.id))!;

  adapter.updateUser!({
    id: user?.id!,
    relationships: [
      ...(user?.relationships ?? []),
      {
        since: new Date(),
        user: session.user.id,
        type: "request-incoming"
      }
    ]
  });
  adapter.updateUser!({
    id: session.user.id,
    relationships: [
      ...(self.relationships ?? []),
      {
        since: new Date(),
        user: body.id,
        type: "request-outgoing"
      }
    ]
  });

  return api.json({
    message: "Friend request sent to " + user.name,
    created: {
      since: new Date(),
      user: session.user.id,
      type: "request-outgoing"
    }
  });
};
