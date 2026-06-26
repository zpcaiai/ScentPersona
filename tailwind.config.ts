import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fdfbf7",
          100: "#f9f5ee",
          200: "#f0e9da",
          300: "#e4d8c0",
        },
        sage: {
          400: "#8a9a7b",
          500: "#6b7d5e",
          600: "#556648",
        },
        clay: {
          400: "#c4a882",
          500: "#b08d5e",
          600: "#967449",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Noto Serif SC", "serif"],
        sans: ["system-ui", "Noto Sans SC", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
