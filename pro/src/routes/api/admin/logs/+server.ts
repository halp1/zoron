import { zoron } from "@zoron/common";
import { logger } from "@zoron/common/logs";
import { api } from "@zoron/common/server";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals: { auth }, url }) => {
  const session = await auth();

  if (session?.user?.role !== "admin") throw api.error("Forbidden", 403);

  const chunk = url.searchParams.get("start");
  const size = url.searchParams.get("size");
  if (chunk && isNaN(parseInt(chunk))) {
    throw api.error("Invalid start parameter", 400);
  }
  if (size && isNaN(parseInt(size))) {
    throw api.error("Invalid size parameter", 400);
  }

  if (!fsSync.existsSync(logger.LOG_PATH)) {
    await fs.mkdir(path.dirname(logger.LOG_PATH), { recursive: true });
    await fs.writeFile(logger.LOG_PATH, "");
  }

  const res = await logger.reversePaginateFile(
    logger.LOG_PATH,
    chunk ? parseInt(chunk) : undefined,
    size ? parseInt(size) : undefined
  );

  return api.json({
    logs: res
  });
};
