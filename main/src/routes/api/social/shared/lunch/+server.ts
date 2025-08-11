import type { aspen } from "@zoron/common/aspen";
import { query, transformID } from "@zoron/common/database";
import { api } from "@zoron/common/server";

import type { User } from "@auth/sveltekit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
  const session = await auth();

  if (!session?.user?.name) throw api.error("Unauthorized", 401);

  const { day, lunch }: { day: number; lunch: aspen.Types.Schedule.Lunch } =
    (await request.json()) || {};

  const users = await query<User>({
    collection: "users",
    projection: { name: 1, image: 1, schedule: 1, _id: 1, relationships: 1 }
  });

  // Find users who have the same course, teacher, and schedule
  const sharedUsers = users.filter((user) => {
    return (
      user.relationships?.find(
        (r) => r.type === "friend" && r.user === session.user.id
      ) && session.user.schedule?.lunches.at(day) === lunch
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
