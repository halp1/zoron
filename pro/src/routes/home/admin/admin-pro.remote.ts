import { error } from "@sveltejs/kit";

import { command, getRequestEvent } from "$app/server";

import { adapter } from "@zoron/common/auth";

import type { User } from "@auth/sveltekit";

export const downgrade = command(async () => {
  const session = await getRequestEvent().locals.auth();

  if (session?.user?.role !== "admin") throw error(403, "Forbidden");

  await adapter.updateUser!({
    id: session.user.id!,
    pro: false
  } satisfies User as any);
});
