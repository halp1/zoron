import { VAPID_PUBLIC } from "$env/static/private";
import { aspen } from "$lib/aspen";
import type { LayoutServerLoad } from "./$types";
export const load: LayoutServerLoad = async (event) => {
  const auth = await event.locals.auth();
  const aspenName = auth?.user?.aspen
    ? aspen.decrypt(auth.user.email!, auth.user.aspen).username
    : undefined;
  return {
    session: auth,
    username: aspenName,
    env: {
      vapid: VAPID_PUBLIC
    }
  };
};
