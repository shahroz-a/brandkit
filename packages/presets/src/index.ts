import type { BrandTokens } from "@brandkit/core";

export const presets: Array<Pick<BrandTokens, "name" | "description" | "font" | "radius" | "primary" | "secondary" | "accent" | "background" | "foreground" | "mode" | "theme">> = [
  {
    name: "Linear Lab",
    description: "A precise system for technical teams.",
    font: "Inter",
    radius: 18,
    primary: "#5B6CFF",
    secondary: "#101828",
    accent: "#14B8A6",
    background: "#F7F8FB",
    foreground: "#101828",
    mode: "light",
    theme: "linear"
  },
  {
    name: "Signal Foundry",
    description: "Sharp launch visuals for product builders.",
    font: "Manrope",
    radius: 28,
    primary: "#0E7490",
    secondary: "#172554",
    accent: "#F59E0B",
    background: "#ECFEFF",
    foreground: "#111827",
    mode: "light",
    theme: "stripe"
  },
  {
    name: "Night Docs",
    description: "Dark mode identity for open-source documentation.",
    font: "IBM Plex Sans",
    radius: 20,
    primary: "#8B5CF6",
    secondary: "#E2E8F0",
    accent: "#22C55E",
    background: "#0F172A",
    foreground: "#F8FAFC",
    mode: "dark",
    theme: "modern"
  }
];
