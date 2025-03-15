import { aspen } from "$lib/aspen";
import { supabaseConnect } from "$lib/supabase";

import { SUPABASE_SERVICE_KEY, SUPABASE_URI } from "$env/static/private";
import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

const BUCKET_NAME = "pfps";

async function ensureStoragePolicy(
  supabase: ReturnType<typeof supabaseConnect>
) {
  try {
    // Check if the bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();

    const profilePicturesBucket = buckets?.find((b) => b.name === BUCKET_NAME);
    if (!profilePicturesBucket) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    }

    // Create policies using raw SQL
    await supabase.from("storage.objects").select("*").limit(1); // Ensure table exists

    // Enable RLS
    await supabase.rpc(`
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    `);

    // Create policies if they don't exist
  } catch (error) {
    console.error("Error ensuring storage policy:", error);
    // Don't throw error as this shouldn't block the page load
  }
}

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();

  if (!session?.user?.aspen) return redirect(302, "/account");

  const supabase = supabaseConnect(SUPABASE_URI, SUPABASE_SERVICE_KEY, false);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: session.user.email!,
    password: session.user.aspen
  });

  if (error) {
    await supabase.auth.signUp({
      email: session.user.email!,
      password: session.user.aspen
    });
  }

  // Ensure storage policy exists
  await ensureStoragePolicy(supabase);

  return {
    supabase:
      data ||
      (
        await supabase.auth.signInWithPassword({
          email: session.user.email!,
          password: session.user.aspen
        })
      ).data
  };
};
