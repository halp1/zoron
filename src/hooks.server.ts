import { handle as authHandle } from "$lib/auth";

import type { Handle } from "@sveltejs/kit";

import { jobs } from "./jobs";

export const handle: Handle = async (params) => {
  if (params.event.url.pathname === "/api/admin/impersonate")
    return await params.resolve(params.event);
  return await authHandle(params);
};

if ("jobs" in globalThis) ((globalThis as any).jobs as typeof jobs).stop();

jobs.init();
