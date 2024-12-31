import { aspen } from "$lib/aspen";
import { supabaseConnect } from "$lib/supabase";

import { SUPABASE_SERVICE_KEY, SUPABASE_URI } from "$env/static/private";
import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { auth }, cookies }) => {
  const session = await auth();

  if (!session?.user?.aspen || !cookies.get("secret")) return redirect(302, "/account");

  const supabase = supabaseConnect(SUPABASE_URI, SUPABASE_SERVICE_KEY, false);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: session.user.email!,
    password: aspen.decrypt(cookies.get("secret")!, session.user.aspen).password
  });

  if (error) {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 1e6 });
    if (data?.users?.find((user) => user.email === session?.user?.email))
      await supabase.auth.admin.deleteUser(
        data?.users?.find((user) => user.email === session?.user?.email)!.id
      );
    await supabase.auth.signUp({
      email: session.user.email!,
      password: aspen.decrypt(cookies.get("secret")!, session.user.aspen).password
    });
  }

  return {
    supabase:
      data ||
      (
        await supabase.auth.signInWithPassword({
          email: session.user.email!,
          password: aspen.decrypt(cookies.get("secret")!, session.user.aspen).password
        })
      ).data
  };
};
