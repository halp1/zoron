import { handle as authHandle } from "@zoron/common/auth";
import { logger } from "@zoron/common/logs";

import { MONGODB_URI } from "$env/static/private";
import type { Handle } from "@sveltejs/kit";

declare namespace globalThis {
  export let env: {
    MONGODB_URI: string;
  };
}

globalThis.env = { MONGODB_URI };

export const handle: Handle = async (params) => {
  if (
    params.event.url.pathname.startsWith(
      "/.well-known/appspecific/com.chrome.devtools"
    )
  ) {
    return new Response(null, { status: 204 }); // Return empty response with 204 No Content
  }
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
  console.error(
    "IP for below error:",
    params.event.request.headers.get("x-forwarded-for") ||
      params.event.getClientAddress()
  );
  if (params.error instanceof Error) {
    const e = params.error as Error & { status: number };
    if (e.status === 404) {
      console.error("404 at:", params.event.url.pathname);
    } else {
      console.error(params.error);
      logger.pumpLog((params.error as any).stack ?? params.error);
    }
  } else {
    console.error(params.error);
    logger.pumpLog((params.error as any).stack ?? params.error);
  }
  try {
    return {
      message:
        JSON.parse((params.error as any)?.message)?.body?.message ??
        params.message
    };
  } catch {
    return {
      message: params.message
    };
  }
};
