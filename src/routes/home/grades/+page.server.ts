import type { PageServerLoad } from "./$types";
import { classes } from "../../api/aspen/classes";

export const load: PageServerLoad = async ({ locals: { auth } }) => {
  const session = await auth();
  try {
    // return { classes: await classes(session!) };
    return { classes: null };
  } catch (e) {
    console.log(e);
    return { classes: null };
  }
};
