import { adapter } from "$lib/auth";
import { api } from "$lib/server";

export const POST = async ({ locals: { auth }, request }) => {
  const session = await auth();

  if (!session?.user?.id || !session.user.aspen) {
    // User is not authenticated or doesn't have the required data
    throw api.error("Session not found", 401);
  }

  const body = await request.json();
  if (!body || !Array.isArray(body)) {
    // Invalid request body
    throw api.error("Invalid request body", 400);
  }

  await adapter.updateUser!({
    id: session.user.id,
    seenActivity: [
      ...new Set([
        ...((await adapter.getUser!(session.user.id))?.seenActivity || []),
        ...body
      ])
    ]
  });

  return api.json("Marked as read");
};
