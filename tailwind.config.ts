import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        ink: "#1c1915",
        sand: "#efe6d6",
        paper: "#fffdf9",
        moss: "#0f6e6e",
        clay: "#c4553a",
      },
      boxShadow: {
        card: "0 16px 40px rgba(48, 36, 22, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
