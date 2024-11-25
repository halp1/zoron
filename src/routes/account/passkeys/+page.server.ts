import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  return { passkeys: session?.user?.webauthn?.passkeys ?? [] };
};
