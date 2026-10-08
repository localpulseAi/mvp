import type { Config } from "tailwindcss";

/**
 * Agenzy brand system — see design/Agenzy-Brand-Guidelines.pdf
 * Violet #6840DE · Lime #D6EF83 · Ink #211A35 · Canvas #FAF8FF · Soft Lilac #EEE7FC
 *
 * `brand` and `violet` share one scale anchored on Agenzy Violet (600).
 * `gray` is re-tinted toward Ink so every neutral sits in the brand family
 * (gray-50 = Canvas, gray-900 = Ink).
 */
const violet = {
  50:  "#F6F2FF",
  100: "#EEE7FC", // Soft Lilac
  200: "#DDD0FA",
  300: "#C3AEF5",
  400: "#9F82EC",
  500: "#7F5CE5",
  600: "#6840DE", // Agenzy Violet
  700: "#5530C4",
  800: "#43279A",
  900: "#32206F",
  950: "#211A35",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: violet,
        violet,
        lime: {
          50:  "#F9FCEC",
          100: "#F1F9D3",
          200: "#E6F4B0",
          300: "#D6EF83", // Agenzy Lime
          400: "#C5E25E",
          500: "#A9C83F",
          600: "#84A02B",
          700: "#617620",
          800: "#4A5A1B",
        },
        ink: {
          DEFAULT: "#211A35",
          soft: "#3F3856",
        },
        canvas: "#FAF8FF",
        lilac: "#EEE7FC",
        gray: {
          50:  "#FAF8FF", // Canvas
          100: "#F3F0FA",
          200: "#E6E1F0",
          300: "#D2CCE0",
          400: "#A49DB8",
          500: "#6F6887",
          600: "#554E6C",
          700: "#3F3856",
          800: "#2E2744",
          900: "#211A35", // Ink
          950: "#160F28",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
        fun: ["var(--font-fredoka)", "Fredoka", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        control: "10px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(33,26,53,0.04), 0 4px 16px -4px rgba(33,26,53,0.06)",
        lift: "0 2px 4px rgba(33,26,53,0.04), 0 12px 32px -8px rgba(33,26,53,0.12)",
        violet: "0 8px 24px -8px rgba(104,64,222,0.45)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        twinkle: "twinkle 2.8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
          "50%": { transform: "scale(0.82) rotate(12deg)", opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
