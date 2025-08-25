import { api } from "@zoron/common/server";

import { execSync, spawn } from "child_process";
import path from "path";
import process from "process";

const commit = execSync("git rev-parse --short HEAD").toString().trim();

export const POST = async ({ locals: { auth } }) => {
  const session = await auth();
  if (session?.user?.role !== "admin") throw api.error("Unauthorized", 403);

  const p = spawn(path.resolve(process.cwd(), "../pro", "prod.sh"), {
    detached: true,
    stdio: "ignore"
  });
  p.unref();

  const p2 = spawn(path.resolve(process.cwd(), "../main", "prod.sh"), {
    detached: true,
    stdio: "ignore"
  });
	p2.unref();

  return api.json("Server upgrading...");
};
