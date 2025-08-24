import { command, getRequestEvent } from "$app/server";

import { adapter } from "@zoron/common/auth";

import type { User } from "@auth/sveltekit";
import { error, redirect } from "@sveltejs/kit";

export const upgrade = command(async () => {
  const session = await getRequestEvent().locals.auth();

  if (!session?.user?.id) return error(401, "Unauthorized");

  await adapter.updateUser!({
    id: session.user.id,
    pro: true
  } satisfies User as any);
});
