import { query, remove } from "$lib/database";
import type { Subscription } from "$lib/types";

import { error, json } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({
  request,
  locals,
  params: { id }
}) => {
  const session = await locals.auth();
  if (!session || !session.user || !session.user.email)
    return error(403, "Unauthorized");
  const subscription = await query<Subscription>({
    collection: "subscriptions",
    query: { _id: new ObjectId(id), email: session.user.email }
  });
  if (subscription.length === 0) return error(400, "You are not subscribed.");
  try {
    if (
      !remove("subscriptions", {
        _id: new ObjectId(id),
        email: session.user.email
      })
    )
      throw new Error();
    return json({ success: true });
  } catch {
    return error(400, "Invalid subscription");
  }
};
