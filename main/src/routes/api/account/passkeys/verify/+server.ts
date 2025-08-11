import { register } from "@zoron/common/auth/webauthn/server";
import { api } from "@zoron/common/server";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();
  try {
    const data = await register(session, await request.json());
    return api.json(data);
  } catch (e) {
    const error = (e as Error).message;
    return api.error(error, 400);
  }
};
