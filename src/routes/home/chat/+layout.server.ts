import { aspen } from "$lib/aspen";
import { supabaseConnect } from "$lib/supabase";

import { SUPABASE_ID, SUPABASE_SERVICE_KEY } from "$env/static/private";
import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();

  if (!session?.user?.aspen) return redirect(302, "/account");

  const supabase = supabaseConnect(SUPABASE_ID, SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: session.user.email!,
    password: aspen.decrypt(session.user.email!, session.user.aspen).password
  });

  if (error) {
    await supabase.auth.signUp({
      email: session.user.email!,
      password: aspen.decrypt(session.user.email!, session.user.aspen).password
    });
  }

  return {
    supabase:
      data ||
      (
        await supabase.auth.signInWithPassword({
          email: session.user.email!,
          password: aspen.decrypt(session.user.email!, session.user.aspen).password
        })
      ).data
  };
};
