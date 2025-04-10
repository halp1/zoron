import { api } from "$lib/server";

import { spawn } from "child_process";
import path from "path";
import process from "process";

export const POST = async ({ locals: { auth } }) => {
  const session = await auth();
  if (session?.user?.role !== "admin") throw api.error("Unauthorized", 403);

  const p = spawn(path.join(process.cwd(), "prod.sh"), {
    detached: true,
    stdio: "ignore"
  });
  p.unref();

  return api.json("Server upgrading...");
};
