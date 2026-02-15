import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f5f8ff",
        ink: "#10203f",
        accent: "#0f766e",
        accent2: "#f97316",
        muted: "#607089"
      },
      boxShadow: {
        panel: "0 20px 45px rgba(15, 35, 62, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
