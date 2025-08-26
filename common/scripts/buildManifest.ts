import { templateFile } from "@zoron/common/build";
import { CONSTANTS } from "@zoron/common/constants";

import path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

(async () => {
  await templateFile(
    path.resolve(__dirname, "../static/site.webmanifest"),
    { name: CONSTANTS.name },
    path.resolve(process.cwd(), ".svelte-kit/output/client/site.webmanifest")
  );
  process.exit(0);
})();
