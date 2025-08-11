import { query, transformID } from "@zoron/common/database";
import { ObjectId } from "mongodb";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  return {
    timeDelta: transformID(
      (
        await query<{ name: "timeDelta"; data: number }>({
          collection: "app",
          query: { name: "timeDelta" }
        })
      )[0] || { name: "timeDelta", data: 0, _id: new ObjectId() }
    )
  };
};
