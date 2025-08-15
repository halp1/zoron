import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // @ts-expect-error
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    // pre-bundle it for dev
    include: ["@zoron/common"]
  },
  ssr: {
    // during SSR/bundling, don't treat it as external
    noExternal: ["@zoron/common"]
  }
});
