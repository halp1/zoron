import { update } from "@zoron/common/database";
import { api } from "@zoron/common/server";

export const POST = async ({ locals: { auth } }) => {
  const session = await auth();
  if (session?.user?.role !== "admin") throw api.error("Unauthorized", 403);
	
  update("users", {}, { $unset: { schedule: "" } });

  return api.json(`Schedules reset!`);
};
