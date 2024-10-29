import { api } from "$lib/server";
import { adapter } from "../../../../auth/auth";

export const DELETE = async ({ locals: { auth } }) => {
  const session = await auth();

  if (!session?.user) return api.error("Unauthorized", 401);
  try {
    await adapter.deleteUser!(session.user.id!);
    return api.json();
  } catch {
    return api.error("Failed to delete account", 500);
  }
};
