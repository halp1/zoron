import { isRedirect, redirect } from "@sveltejs/kit";
import { update } from "@zoron/common/database";
import { api } from "@zoron/common/server";
import { URLSearchParams } from "node:url";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, cookies }) => {
  if (cookies.get("zoron.register") !== "1")
    return redirect(
      302,
      "/verify/confirm?target=" + encodeURIComponent(request.url)
    );
  const uri = new URLSearchParams(request.url);
  try {
    await update(
      "users",
      { email: uri.get("user") },
      { $unset: { password: "" } }
    );
  } catch {
    return api.error("User not found", 404);
  }

  const target = uri.get("target");
  if (!target) return api.error("Target not found", 400);

  try {
    return redirect(302, decodeURIComponent(atob(target)));
  } catch (e) {
    if (isRedirect(e)) throw e;
    return api.error("Invalid target", 400);
  }
};
