import { aspen } from "$lib/aspen";
import { CONSTANTS } from "$lib/constants";

import { SUPABASE_PUBLIC_KEY, SUPABASE_URI, VAPID_PUBLIC } from "$env/static/private";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const auth = await event.locals.auth();
  const cookies = event.cookies;
  const aspenName =
    auth?.user?.aspen && cookies.get("secret")
      ? aspen.decrypt(cookies.get("secret")!, auth.user.aspen).username
      : undefined;
  return {
    session: auth,
    username: aspenName,
    env: {
      vapid: VAPID_PUBLIC,
      name: CONSTANTS.name,
      supabase: {
        uri: SUPABASE_URI,
        key: SUPABASE_PUBLIC_KEY
      }
    },
    hideFooter: event.cookies.get("hide-footer") === "1"
  };
};
