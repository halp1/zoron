import { update } from "$lib/database";
import { api } from "$lib/server";

import { isRedirect, redirect } from "@sveltejs/kit";
import { URLSearchParams } from "node:url";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request }) => {
  const uri = new URLSearchParams(request.url);
  try {
    console.log(await update("users", { email: uri.get("user") }, { $unset: { password: "" } }));
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
