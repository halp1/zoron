import { adapter, hashPassword } from "$lib/auth";
import { api } from "$lib/server";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals: { auth }, request }) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) return api.error("Not authenticated", 401);
  const body = await request.json();
  const password = body.password;
  if (!password || password.length === 0) return api.error("No password provided", 400);
  const { hash, salt } = await hashPassword(password);
  await adapter.updateUser!({ id: session.user.id, password: { hash, salt } });
  return api.json({ success: true });
};
