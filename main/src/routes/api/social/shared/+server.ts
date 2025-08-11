import { query, transformID } from "@zoron/common/database";
import { api } from "@zoron/common/server";

import type { User } from "@auth/sveltekit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const session = await auth();

  if (!session?.user?.name) throw api.error("Unauthorized", 401);

  const { course, teacher, schedule } = (await request.json()) || {};

  const users = await query<User>({
    collection: "users",
    projection: { name: 1, image: 1, schedule: 1, _id: 1 }
  });

  // Find users who have the same course, teacher, and schedule
  const sharedUsers = users.filter((user) => {
    return user.schedule?.schedule?.some(
      (block) =>
        block &&
        block.course === course &&
        block.teacher === teacher &&
        block.schedule === schedule
    );
  });

  return api.json({
    users: sharedUsers.map((user) => ({
      name: user.name,
      image: user.image,
      id: transformID(user)._id
    }))
  });
};
