import { aspen } from "$lib/aspen";
import { api } from "$lib/web/api";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();

  if (!session || !session.user) api.error("Not authorized", 401);
  const data: { username: string; password: string } = await request.json();
  if (!data.username || typeof data.username !== "string" || data.username.length === 0)
    return api.error("Missing username", 400);
  if (!data.password || typeof data.password !== "string" || data.password.length === 0)
    return api.error("Missing password", 400);

  try {
    const account = await aspen.authenticate(data.username, data.password);
    return api.json(account);
  } catch (e: any) {
    return api.error(e.message, 401);
  }
};
