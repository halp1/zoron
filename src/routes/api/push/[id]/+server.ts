import webpush from "web-push";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

import { query, remove } from "$lib/database";
import { ObjectId } from "mongodb";
import type { Subscription } from "$lib/types";
import { VAPID_PRIVATE, VAPID_PUBLIC } from "$env/static/private";

const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateNotificationOptions = (options: any): true | string => {
  if (typeof options !== "object" || options === null) {
    return "Options must be an object.";
  }

  const {
    actions,
    badge,
    body,
    data,
    dir,
    icon,
    image,
    lang,
    renotify,
    requireInteraction,
    silent,
    tag,
    timestamp,
    vibrate
  } = options;

  if (actions !== undefined) {
    if (!Array.isArray(actions)) return "Actions must be an array.";
    for (const action of actions) {
      if (typeof action !== "object" || action === null) return "Each action must be an object.";
      if (typeof action.action !== "string" || !isValidURL(action.action))
        return 'Action must have a string property "action" that serves as a link to open.';
      if (typeof action.title !== "string") return 'Action must have a string property "title".';
      if (action.icon !== undefined && typeof action.icon !== "string")
        return 'Action "icon" must be a string if provided.';
    }
  }

  if (badge !== undefined && typeof badge !== "string")
    return "Badge must be a string if provided.";
  if (body !== undefined && typeof body !== "string") return "Body must be a string if provided.";
  if (data !== undefined)
    return "Data may not be provided. To proive a URL to open when the notification is clicked, use the `url` property.";
  if (options.url !== undefined && typeof options.url !== "string")
    return "URL must be a string if provided.";
  if (dir !== undefined && !["auto", "ltr", "rtl"].includes(dir))
    return 'Dir must be "auto", "ltr", or "rtl".';
  if (icon !== undefined && typeof icon !== "string") return "Icon must be a string if provided.";
  if (image !== undefined && typeof image !== "string")
    return "Image must be a string if provided.";
  if (lang !== undefined && typeof lang !== "string") return "Lang must be a string if provided.";
  if (renotify !== undefined && typeof renotify !== "boolean")
    return "Renotify must be a boolean if provided.";
  if (requireInteraction !== undefined && typeof requireInteraction !== "boolean")
    return "RequireInteraction must be a boolean if provided.";
  if (silent !== undefined && typeof silent !== "boolean" && silent !== null)
    return "Silent must be a boolean or null if provided.";
  if (tag !== undefined && typeof tag !== "string") return "Tag must be a string if provided.";
  if (timestamp !== undefined && typeof timestamp !== "number")
    return "Timestamp must be a number if provided.";
  if (vibrate !== undefined && !Array.isArray(vibrate))
    return "Vibrate must be an array if provided.";

  return true;
};

export const POST: RequestHandler = async ({ request, params: { id } }) => {
  const body = await request.json();
  const key = body.key;
  if (!key || typeof key !== "string" || key.length === 0)
    return error(400, "Missing authentication key");
  const push = body.data;
  if (!push || !push.title) {
    return error(400, 'Missing notification "title" data');
  }
  if (push.url && !isValidURL(push.url)) {
    return error(400, "Invalid URL provided");
  }
  const validate = push.options ? validateNotificationOptions(push.options) : true;
  if (validate !== true) return error(400, validate);

  webpush.setVapidDetails("https://push.haelp.dev", VAPID_PUBLIC, VAPID_PRIVATE);

  const subscriptions = await query<Subscription>({
    collection: "subscriptions",
    query: { target: id }
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          subscription.subscription as any,
          JSON.stringify({ title: push.title, options: push.options, url: push.url })
        );
      } catch {
        await remove("subscriptions", { _id: subscription._id });
      }
    })
  );
  return json({ success: true });
};
