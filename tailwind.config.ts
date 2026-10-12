import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

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
        white: token("fg"),
        "on-accent": "#ffffff",
        accent: { DEFAULT: token("accent"), strong: token("accent-strong"), soft: token("accent-soft") },
        surface: { DEFAULT: token("surface"), 2: token("surface-2") },
        panel: token("panel"),
        scrim: token("scrim"),
        clay: token("danger-soft"),
        danger: { DEFAULT: "#ff6b57", soft: token("danger-soft"), bg: token("danger-bg") },
        "warn-soft": token("warn-soft"),
        success: { DEFAULT: "#22b07d", soft: token("success-soft") },
      },
      boxShadow: {
        card: "0 16px 40px rgba(48, 36, 22, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
