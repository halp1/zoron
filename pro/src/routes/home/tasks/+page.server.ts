import { error } from "@sveltejs/kit";

import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";

import type { User } from "@auth/sveltekit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth }, cookies }) => {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.aspen || !cookies.get("secret"))
    throw error(302, "Unauthorized");

  if (!session?.user?.features?.tasks) {
    await adapter.updateUser!({
      id: session.user.id,
      features: {
        ...session.user.features,
        tasks: true
      }
    } satisfies User as any);
  }

  if (!session?.user?.tasks) {
    const credentials = aspen.decrypt(
      cookies.get("secret")!,
      session.user.aspen
    );

    const classes = await aspen
      .authenticate(credentials.username, credentials.password)
      .then(({ cookie }) => cookie)
      .then((cookie) => aspen.classes(cookie))
      .then(({ classes }) => classes);
    await adapter.updateUser!({
      id: session.user.id,
      tasks: classes.map(
        (c) =>
          ({
            class: {
              id: c.id,
              name: c.name
            },
            tasks: []
          }) satisfies NonNullable<User["tasks"]>[number]
      )
    } satisfies User as any);
  }
};
