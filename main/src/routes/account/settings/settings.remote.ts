import { error } from "@sveltejs/kit";

import { command, getRequestEvent } from "$app/server";

import { CDN_KEY } from "$env/static/private";

import { adapter } from "@zoron/common/auth";

import type { User } from "@auth/sveltekit";

import * as v from "valibot";

export const updateProfilePicture = command(
  v.string(),
  async (imageDataUrl) => {
    const session = await getRequestEvent().locals.auth();
    if (!session?.user?.id) throw error(401, "Unauthorized");

    const response = await fetch("https://cdn.haelp.dev/api/v1/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CDN_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: `apps/zoron/profile-pictures`,
        filename: `${session.user.id}.jpg`,
        fileType: "image/jpeg"
      })
    });

    const result = await response.json();

    if (result.success) {
      // Step 2: Upload file

      // convert base64 url to uploadable object
      const blob = await (await fetch(imageDataUrl)).blob();

      const uploadResponse = await fetch(result.uploadUrl, {
        method: "PUT",
        body: blob
      });

      if (uploadResponse.ok) {
        const path = `https://cdn.haelp.dev/obj/apps/zoron/profile-pictures/${session.user.id}.jpg?${Date.now()}`;
        await adapter.updateUser!({
          id: session.user.id,
          image: path
        } satisfies User as any);

        return true;
      } else {
        throw error(500, "Failed to upload profile picture");
      }
    }

    throw error(500, "Failed to update profile picture");
  }
);
