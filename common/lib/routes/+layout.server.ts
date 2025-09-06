import { redirect } from "@sveltejs/kit";

import { POSTHOG, VAPID_PUBLIC } from "$env/static/private";

import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";
import { CONSTANTS } from "@zoron/common/constants";

import type { User } from "@auth/sveltekit";

import { execSync } from "child_process";

import type { LayoutServerLoad } from "../../../main/.svelte-kit/types/src/routes/$types";

const commit = execSync("git rev-parse --short HEAD").toString().trim();

const pro = process
  .cwd()
  .slice(process.cwd().indexOf("zoron"))
  .includes("/pro");

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.auth();
  if (pro) {
    if (!session?.user?.id) return redirect(302, "https://zoron.app/login");
    if (!session.user.pro) {
      if (import.meta.env.DEV) {
        await adapter.updateUser!({
          id: session.user.id,
          pro: true
        } satisfies User as any);
        session.user.pro = true;
      } else return redirect(302, "https://zoron.app/pro");
    }
  } else {
    if (session?.user?.pro) {
      if (!import.meta.env.DEV) {
        return redirect(302, "https://pro.zoron.app");
      }
    }
  }

  const cookies = event.cookies;
  const aspenName =
    session?.user?.aspen && cookies.get("secret")
      ? aspen.decrypt(cookies.get("secret")!, session.user.aspen).username
      : undefined;
  return {
    session,
    username: aspenName,
    accountAge:
      session?.user?.id &&
      Math.floor(
        (Date.now() -
          new Date(
            parseInt(session?.user?.id.toString().slice(0, 8), 16) * 1000
          ).getTime()) /
          (1000 * 60 * 60 * 24)
      ),

    env: {
      vapid: VAPID_PUBLIC,
      name: CONSTANTS.name,
      posthog: {
        key: POSTHOG
      },
      commit: commit,
      pro
    },
    hideFooter: event.cookies.get("hide-footer") === "1"
  };
};
