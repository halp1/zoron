import type { Config } from "tailwindcss";

export default {
  content: [
    "./lib/**/*.{html,js,svelte,ts}",
  ],

  theme: {
    extend: {}
  },

  plugins: []
} satisfies Config;
