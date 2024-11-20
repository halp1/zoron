import path from "node:path";

import { templateFile } from "../src/lib/build";
import { CONSTANTS } from "../src/lib/constants";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

(async () => {
  await templateFile(
    path.resolve(__dirname, "../static/site.webmanifest"),
    { name: CONSTANTS.name },
    path.resolve(__dirname, "../.svelte-kit/output/client/site.webmanifest")
  );
  process.exit(0);
})();
