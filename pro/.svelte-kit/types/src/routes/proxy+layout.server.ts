// @ts-nocheck
import {
  POSTHOG,
  SUPABASE_PUBLIC_KEY,
  SUPABASE_URI,
  VAPID_PUBLIC
} from "$env/static/private";
import { aspen } from "@zoron/common/aspen";
import { CONSTANTS } from "@zoron/common/constants";
import { execSync } from "child_process";

import type { LayoutServerLoad } from "./$types";

const commit = execSync("git rev-parse --short HEAD").toString().trim();

export const load = async (event: Parameters<LayoutServerLoad>[0]) => {
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
      },
      posthog: {
        key: POSTHOG
      },
      commit: commit
    },
    hideFooter: event.cookies.get("hide-footer") === "1"
  };
};
