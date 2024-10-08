import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "../../delete/[id]/$types";
import { remove, query } from "$lib/database";
import { ObjectId } from "mongodb";
import type { Subscription, Item } from "$lib/types";

export const POST: RequestHandler = async ({ request, locals, params: { id } }) => {
  const session = await locals.auth();
  if (!session || !session.user || !session.user.email) return error(403, "Unauthorized");
  const item = await query<Item>({ collection: "items", query: { _id: new ObjectId(id) } });
  if (!item[0]) return error(404, "Item not found");
  const subscription = await query<Subscription>({
    collection: "subscriptions",
    query: { _id: new ObjectId(id), email: session.user.email }
  });
  if (subscription.length === 0) return error(400, "You are not subscribed.");
  try {
    if (!remove("subscriptions", { _id: new ObjectId(id), email: session.user.email }))
      throw new Error();
    return json({ success: true });
  } catch {
    return error(400, "Invalid subscription");
  }
};
