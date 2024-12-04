import { getUserPasskeys } from "$lib/auth/webauthn/server";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  const passkeys = (session?.user?.id ? await getUserPasskeys(session.user.id) : []).map((key) => ({
    ...key,
    publicKey: undefined
  }));
  return { passkeys };
};
