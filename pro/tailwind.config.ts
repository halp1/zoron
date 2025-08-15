import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}", "../common/lib/**/*.{html,js,svelte,ts,css}"],

  theme: {
    extend: {}
  },

  plugins: []
} as Config;
