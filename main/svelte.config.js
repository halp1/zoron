import adapter from "@sveltejs/adapter-node";
// import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { URL, fileURLToPath } from "node:url";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({ script: true }),

  kit: {
    // adapter: adapter({ precompress: true, maxDuration: 60 }),
    adapter: adapter(),
    csrf: { checkOrigin: false },
    alias: {
      // Every `import … from '@zoron/common/…'` goes to ../common/lib/…
      "@zoron/common": fileURLToPath(new URL("../common/lib", import.meta.url)),
      "@api": fileURLToPath(new URL("./src/api", import.meta.url))
    },
    files: {
      assets: fileURLToPath(new URL("../common/static", import.meta.url))
    },
    experimental: {
      remoteFunctions: true
    },
  },
  compilerOptions: {
    experimental: {
      async: true
    }
  }
};

export default config;
