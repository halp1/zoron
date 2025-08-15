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

export const load: LayoutServerLoad = async (event) => {
  const auth = await event.locals.auth();
	
  return {
    session: auth,
    username: auth?.user?.name ?? "Unknown",
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
      commit: commit,
			pro: false,
    },
    hideFooter: event.cookies.get("hide-footer") === "1"
  };
};
