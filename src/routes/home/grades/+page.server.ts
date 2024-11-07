import { classes } from "../../api/aspen/classes";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  try {
    return { classes: classes(session!) };
  } catch (e) {
    console.log(e);
    return { classes: null };
  }
};
