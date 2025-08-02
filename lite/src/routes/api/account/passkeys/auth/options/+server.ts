import { authenticationOptions } from "$lib/auth/webauthn/server";
import { api } from "$lib/server";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    const data = await authenticationOptions();
    return api.json(data);
  } catch (e) {
    const error = (e as Error).message;
    return api.error(error, 400);
  }
};
