import { redirect } from "@sveltejs/kit";
import { auth as authLib } from "@zoron/common/auth";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth }, cookies }) => {
return redirect(302, '/home')
};
