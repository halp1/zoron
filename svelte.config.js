import adapter from "@sveltejs/adapter-node";
// import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({ script: true }),

  kit: {
    // adapter: adapter({ precompress: true, maxDuration: 60 }),
    adapter: adapter(),
    csrf: { checkOrigin: false }
  }
};

export default config;
