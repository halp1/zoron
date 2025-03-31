import { handle as authHandle } from "$lib/auth";

import type { Handle } from "@sveltejs/kit";

import { jobs } from "./jobs";

export const handle: Handle = async (params) => {
  if (params.event.url.pathname === "/api/admin/impersonate")
    return await params.resolve(params.event);
  return await authHandle(params);
};

if ("stopAllJobs" in global) (global as any).stopAllJobs();

jobs.init();
(global as any).stopAllJobs = (() => () => {
  const j = jobs.jobs;
  return () => j.forEach((j) => j.stop());
})();
