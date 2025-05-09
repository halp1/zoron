import { handle as authHandle } from "$lib/auth";

import type { Handle } from "@sveltejs/kit";

import { jobs } from "./jobs";

export const handle: Handle = async (params) => {
  if (params.event.url.pathname === "/api/admin/impersonate")
    return await params.resolve(params.event);
  if (
    params.event.url.pathname.startsWith("/posthog-proxy/static") ||
    params.event.url.pathname.startsWith("/posthog-proxy")
  ) {
    const og = params.event.request.clone();
    const url = new URL(og.url);

    const isStatic = url.pathname.startsWith("/posthog-proxy/static");
    if (isStatic) {
      url.pathname = url.pathname.replace("/posthog-proxy/static", "/static");
      url.hostname = "us-assets.i.posthog.com";
    } else {
      url.pathname = url.pathname.replace("/posthog-proxy", "");
      url.hostname = "us.i.posthog.com";
    }

    url.protocol = "https:";
    url.port = "";

    const request = new Request(url.toString(), {
      method: og.method,
      headers: og.headers,
      body: ["GET", "HEAD"].includes(og.method) ? null : await og.blob()
    });

    const res = await fetch(request);

    const headers = new Headers();
    for (const [key, value] of res.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        headers.append(key, value);
      }
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers
    });
  }

  return await authHandle(params);
};

export const handleError = (params) => {
  console.log("IP for below error:", params.event.getClientAddress());
	console.error(params.error)
  return params;
};

if ("stopAllJobs" in global) (global as any).stopAllJobs();

jobs.init();
(global as any).stopAllJobs = (() => () => {
  const j = jobs.jobs;
  return () => j.forEach((j) => j.stop());
})();
