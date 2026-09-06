// Module 1 — Foundation
// TODO: content globs + theme.extend.colors mapped to the palette in app/globals.css
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // fill in from the palette table in BUILD_SPEC.md
      },
    },
  },
  plugins: [],
};

export default config;
