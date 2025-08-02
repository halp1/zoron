import { authenticate } from "$lib/auth/webauthn/server";
import { api } from "$lib/server";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { sessionID, response } = await request.json();
    const data = await authenticate(sessionID, response);
    return api.json(data);
  } catch (e) {
    const error = (e as Error).message;
    return api.error(error, 400);
  }
};
