import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rescue: "var(--rescue-red)",
        safety: "var(--safety-blue)",
        navy: "var(--navy)",
        surface: "var(--surface)",
        canvas: "var(--background)",
        ink: "var(--foreground)",
        muted: "var(--muted)",
        line: "var(--border)"
      },
      fontFamily: { sans: ["var(--font-sans)", "sans-serif"], display: ["var(--font-display)", "sans-serif"] },
      boxShadow: {
        lift: "0 24px 70px rgba(10,28,52,.22)",
        sticker: "0 16px 35px rgba(3,18,38,.35)",
        card: "0 12px 40px rgba(0, 0, 0, 0.4)",
        "glow-rescue": "0 0 35px rgba(255, 70, 84, 0.35)",
        "glow-safety": "0 0 35px rgba(76, 157, 255, 0.35)",
        "inner-glow": "inset 0 1px 1px rgba(255, 255, 255, 0.15)"
      },
      animation: {
        scan: "scan 2.4s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite alternate"
      },
      keyframes: {
        scan: { "0%,100%": { transform: "translateY(0)", opacity: ".2" }, "50%": { transform: "translateY(155px)", opacity: "1" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        pulseSoft: { "0%,100%": { opacity: ".45" }, "50%": { opacity: "1" } },
        glow: { "0%": { opacity: ".3" }, "100%": { opacity: ".8" } }
      }
    }
  },
  plugins: []
} satisfies Config;
