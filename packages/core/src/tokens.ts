import { clamp, readableOn, safeHex } from "./color.js";
import type { BrandTheme, BrandTokens } from "./types.js";

export const THEMES: BrandTheme[] = [
  "minimal",
  "glass",
  "editorial",
  "apple",
  "stripe",
  "linear",
  "modern",
  "brutalist",
  "mesh",
  "gradient"
];

export const DEFAULT_BRAND_TOKENS: BrandTokens = {
  name: "BrandKit",
  description: "Open-source developer branding toolkit.",
  font: "Inter",
  radius: 24,
  primary: "#2563EB",
  secondary: "#111827",
  accent: "#F97316",
  background: "#F8FAFC",
  foreground: "#111827",
  mode: "light",
  theme: "modern"
};

export function normalizeBrandTokens(input: Partial<BrandTokens> = {}): BrandTokens {
  const primary = safeHex(input.primary, DEFAULT_BRAND_TOKENS.primary);
  const secondary = safeHex(input.secondary, DEFAULT_BRAND_TOKENS.secondary);
  const accent = safeHex(input.accent, DEFAULT_BRAND_TOKENS.accent);
  const background = safeHex(input.background, input.mode === "dark" ? "#0B1020" : DEFAULT_BRAND_TOKENS.background);
  const foreground = safeHex(input.foreground, readableOn(background));
  const theme = input.theme && THEMES.includes(input.theme) ? input.theme : DEFAULT_BRAND_TOKENS.theme;

  return {
    name: normalizeText(input.name, DEFAULT_BRAND_TOKENS.name),
    description: normalizeText(input.description, DEFAULT_BRAND_TOKENS.description),
    font: normalizeText(input.font, DEFAULT_BRAND_TOKENS.font),
    radius: clamp(Number.isFinite(input.radius) ? Number(input.radius) : DEFAULT_BRAND_TOKENS.radius, 0, 64),
    primary,
    secondary,
    accent,
    background,
    foreground,
    mode: input.mode === "dark" ? "dark" : "light",
    theme
  };
}

export function initials(name: string): string {
  const words = Array.from(name.trim().split(/\s+/u).filter(Boolean));
  if (words.length === 0) {
    return "BK";
  }

  const letters =
    words.length === 1
      ? Array.from(words[0] ?? "B").slice(0, 2)
      : words.slice(0, 2).map((word) => Array.from(word)[0] ?? "B");
  return letters.join("").toLocaleUpperCase();
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "brandkit";
}

export function deterministicId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function isRtl(value: string): boolean {
  return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/u.test(value);
}

function normalizeText(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}
