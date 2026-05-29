import { api } from "@zoron/common/server";
import {
  getDisabledEmails,
  normalizeEmail,
  setDisabledEmails
} from "@zoron/common/auth";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();
  if (session?.user?.role !== "admin") return api.error("Forbidden", 403);

  const body = await request.json();
  const action = body.action;
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

  if (!email) return api.error("Invalid email", 400);

  const disabledEmails = await getDisabledEmails();

  if (action === "add") {
    if (disabledEmails.includes(email)) {
      return api.error("Email already disabled", 409);
    }

    const emails = await setDisabledEmails([...disabledEmails, email]);
    return api.json({ emails });
  }

  if (action === "remove") {
    const emails = await setDisabledEmails(
      disabledEmails.filter((disabledEmail) => disabledEmail !== email)
    );
    return api.json({ emails });
  }

  return api.error("Invalid action", 400);
};