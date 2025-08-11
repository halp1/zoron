import { adapter } from "@zoron/common/auth";
import { api } from "@zoron/common/server";
import type { Relationship } from "@zoron/common/types";

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

  if (!existing || existing.type !== "request-outgoing")
    throw api.error("No request to approve", 404);

  const self = (await adapter.getUser!(session.user.id))!;

  await adapter.updateUser!({
    id: user.id,
    relationships: [
      ...(user.relationships?.filter((rel) => rel.user !== session!.user!.id) ??
        []),
      { user: session!.user!.id, type: "friend", since: new Date() }
    ]
  });

  await adapter.updateUser!({
    id: self.id,
    relationships: [
      ...(self.relationships?.filter((rel) => rel.user !== user.id) ?? []),
      { user: user.id, type: "friend", since: new Date() }
    ]
  });

  return api.json({
    message: "Friend request accepted",
    created: {
      type: "friend",
      user: user.id,
      since: new Date()
    } satisfies Relationship
  });
};
