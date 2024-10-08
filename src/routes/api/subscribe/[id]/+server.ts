import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { insert, query } from "$lib/database";
import { ObjectId } from "mongodb";
import type { Subscription, Item } from "$lib/types";

export const POST: RequestHandler = async ({ request, locals, params: { id } }) => {
  const session = await locals.auth();
  if (!session || !session.user || !session.user.email) return error(403, "Unauthorized");
  const body = await request.json();
  if (!body.subscription) return error(400, "Missing subscription");
  if (
    !body.device ||
    !body.device.fingerprint ||
    !body.device.browser ||
    !body.device.os ||
    !body.device.id
  )
    return error(400, "Bad device data");
  const item = await query<Item>({ collection: "items", query: { _id: new ObjectId(id) } });
  if (!item[0]) return error(404, "Item not found");
  const subscription = await query<Subscription>({
    collection: "subscriptions",
    query: {
      email: session.user.email,
      target: id,
      $or: [{ "device.id": body.device.id }, { "device.fingerprint": body.device.fingerprint }]
    }
  });
  if (subscription.length > 0) return error(400, "You are already subscribed!");
  try {
    const subscription = body.subscription;
    insert("subscriptions", {
      email: session.user.email,
      created: new Date(),
      target: id,
      subscription,
      device: body.device
    });
    return json({ success: true });
  } catch {
    return error(400, "Invalid subscription");
  }
};
