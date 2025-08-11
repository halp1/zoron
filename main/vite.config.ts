import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],optimizeDeps: {
    // pre-bundle it for dev
    include: ['@zoron/common']
  },
  ssr: {
    // during SSR/bundling, don't treat it as external
    noExternal: ['@zoron/common']
  }
});
