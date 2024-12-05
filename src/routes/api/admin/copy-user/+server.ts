import { dbClient } from "$lib/database";

import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  try {
    const { name, email } = await request.json();

    if (!name && !email) {
      return json({ success: false, error: "Name or email is required" });
    }

    if (name && email) {
      return json({ success: false, error: "Please provide only one of name or email" });
    }

    const client = await dbClient;
    const query = name ? { name } : { email };

    // Get user from prod database
    const prodUser = await client.db("prod").collection("users").findOne(query);

    if (!prodUser) {
      return json({ success: false, error: "User not found in prod database" });
    }

    // Copy user to dev database
    await client
      .db("dev")
      .collection("users")
      .updateOne(query, { $set: prodUser }, { upsert: true });

    return json({ success: true });
  } catch (error) {
    console.error("Error copying user:", error);
    return json({ success: false, error: "Failed to copy user" });
  }
}
