import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#F7F8FB",
        line: "#D8DEE8",
        mint: "#14B8A6",
        ember: "#F97316"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
