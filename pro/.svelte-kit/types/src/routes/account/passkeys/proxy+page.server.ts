// @ts-nocheck
import { getUserPasskeys } from "@zoron/common/auth/webauthn/server";

import type { PageServerLoad } from "./$types";

export const load = async ({ locals: { auth } }: Parameters<PageServerLoad>[0]) => {
  const session = await auth();
  const passkeys = (
    session?.user?.id ? await getUserPasskeys(session.user.id) : []
  ).map((key) => ({
    ...key,
    publicKey: undefined
  }));
  return { passkeys };
};
