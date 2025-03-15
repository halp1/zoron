import { adapter } from "$lib/auth";
import { api } from "$lib/server";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const session = await auth();
  if (!session?.user?.id) return api.error("Unauthorized", 401);

  const { passkeyId } = await request.json();
  if (!passkeyId) return api.error("No passkey ID provided", 400);

  const user = await adapter.getUser!(session.user.id);
  if (!user) return api.error("User not found", 404);

  // Cast to any since we know our user has webauthn property
  const userWithWebauthn = user as any;

  // Remove the passkey from the user's passkeys
  const updatedPasskeys =
    userWithWebauthn.webauthn?.passkeys?.filter(
      (passkey: any) => passkey.id !== passkeyId
    ) || [];

  // Update the user with the new passkeys array
  await adapter.updateUser!({
    id: session.user.id,
    webauthn: {
      ...userWithWebauthn.webauthn,
      passkeys: updatedPasskeys
    }
  } as any);

  return api.json({ success: true });
};
