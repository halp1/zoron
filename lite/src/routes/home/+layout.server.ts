import { isRedirect, redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({
  locals: { auth }
}) => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) return redirect(302, "/login");

  if (session.user.role === "user") {
		return redirect(302, "https://zoron.app/home")
	}
};
