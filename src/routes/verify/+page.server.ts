import { redirect } from "@sveltejs/kit";

export const load = async ({ locals: { auth } }) => {
  const session = await auth();
  if (session?.user?.email) redirect(302, "/home");
};
