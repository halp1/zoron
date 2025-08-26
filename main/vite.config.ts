import { sveltekit } from "@sveltejs/kit/vite";

import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig, searchForWorkspaceRoot } from "vite";

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  optimizeDeps: {
    // pre-bundle it for dev
    include: ["@zoron/common"]
  },
  ssr: {
    // during SSR/bundling, don't treat it as external
    noExternal: ["@zoron/common"]
  },
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        path.resolve(__dirname, "../common")
      ]
    }
  }
});
