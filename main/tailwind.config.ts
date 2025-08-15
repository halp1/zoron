import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "../common/**/*.{html,js,svelte,ts,css}"
  ],

  theme: {
    extend: {}
  },

  plugins: []
} satisfies Config;
