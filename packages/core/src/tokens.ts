import { clamp, readableOn, safeHex } from "./color.js";
import type {
  BrandTheme,
  LogoShape,
  LogoSource,
  LogoStyle,
  MetaGradient,
  MetaLayout,
  MetaPattern,
  BrandTokens,
} from "./types.js";

export const THEMES = [
  "minimal",
  "glass",
  "editorial",
  "apple",
  "stripe",
  "linear",
  "modern",
  "brutalist",
  "mesh",
  "gradient",
] as const satisfies readonly BrandTheme[];

export const LOGO_SOURCES = [
  "generated",
  "uploaded",
] as const satisfies readonly LogoSource[];
export const LOGO_SHAPES = [
  "squircle",
  "circle",
  "hex",
  "diamond",
] as const satisfies readonly LogoShape[];
export const LOGO_STYLES = [
  "spark",
  "initials",
  "monogram",
  "badge",
] as const satisfies readonly LogoStyle[];
export const META_GRADIENTS = [
  "brand",
  "aurora",
  "mesh",
  "radial",
  "linear",
  "solid",
] as const satisfies readonly MetaGradient[];
export const META_PATTERNS = [
  "none",
  "dots",
  "grid",
  "diagonal",
  "waves",
  "plus",
] as const satisfies readonly MetaPattern[];
export const META_LAYOUTS = [
  "classic",
  "centered",
  "split",
  "poster",
] as const satisfies readonly MetaLayout[];
export const MAX_LOGO_DATA_URI_LENGTH = 1_500_000;

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
  theme: "modern",
  logoSource: "generated",
  logoShape: "squircle",
  logoStyle: "spark",
  metaGradient: "brand",
  metaPattern: "grid",
  metaPatternScale: 36,
  metaIntensity: 68,
  metaLayout: "classic",
};

export function normalizeBrandTokens(
  input: Partial<BrandTokens> = {},
): BrandTokens {
  const primary = safeHex(input.primary, DEFAULT_BRAND_TOKENS.primary);
  const secondary = safeHex(input.secondary, DEFAULT_BRAND_TOKENS.secondary);
  const accent = safeHex(input.accent, DEFAULT_BRAND_TOKENS.accent);
  const background = safeHex(
    input.background,
    input.mode === "dark" ? "#0B1020" : DEFAULT_BRAND_TOKENS.background,
  );
  const foreground = safeHex(input.foreground, readableOn(background));
  const theme =
    input.theme && THEMES.includes(input.theme)
      ? input.theme
      : DEFAULT_BRAND_TOKENS.theme;
  const logoDataUri = safeLogoDataUri(input.logoDataUri);
  const logoSource = input.logoSource === "uploaded" ? "uploaded" : "generated";
  const tokens: BrandTokens = {
    name: normalizeText(input.name, DEFAULT_BRAND_TOKENS.name),
    description: normalizeText(
      input.description,
      DEFAULT_BRAND_TOKENS.description,
    ),
    font: normalizeText(input.font, DEFAULT_BRAND_TOKENS.font),
    radius: clamp(
      Number.isFinite(input.radius)
        ? Number(input.radius)
        : DEFAULT_BRAND_TOKENS.radius,
      0,
      64,
    ),
    primary,
    secondary,
    accent,
    background,
    foreground,
    mode: input.mode === "dark" ? "dark" : "light",
    theme,
    logoSource,
    logoShape: pick(
      input.logoShape,
      LOGO_SHAPES,
      DEFAULT_BRAND_TOKENS.logoShape,
    ),
    logoStyle: pick(
      input.logoStyle,
      LOGO_STYLES,
      DEFAULT_BRAND_TOKENS.logoStyle,
    ),
    metaGradient: pick(
      input.metaGradient,
      META_GRADIENTS,
      DEFAULT_BRAND_TOKENS.metaGradient,
    ),
    metaPattern: pick(
      input.metaPattern,
      META_PATTERNS,
      DEFAULT_BRAND_TOKENS.metaPattern,
    ),
    metaPatternScale: clamp(
      Number.isFinite(input.metaPatternScale)
        ? Number(input.metaPatternScale)
        : DEFAULT_BRAND_TOKENS.metaPatternScale,
      16,
      96,
    ),
    metaIntensity: clamp(
      Number.isFinite(input.metaIntensity)
        ? Number(input.metaIntensity)
        : DEFAULT_BRAND_TOKENS.metaIntensity,
      0,
      100,
    ),
    metaLayout: pick(
      input.metaLayout,
      META_LAYOUTS,
      DEFAULT_BRAND_TOKENS.metaLayout,
    ),
  };

  if (logoDataUri) {
    tokens.logoDataUri = logoDataUri;
  }

  return tokens;
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
  return (
    value
      .trim()
      .toLocaleLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "brandkit"
  );
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

function pick<T extends string>(
  value: string | undefined,
  options: readonly T[],
  fallback: T,
): T {
  return value && options.includes(value as T) ? (value as T) : fallback;
}

function safeLogoDataUri(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > MAX_LOGO_DATA_URI_LENGTH) {
    return undefined;
  }

  return /^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/iu.test(
    trimmed,
  )
    ? trimmed
    : undefined;
}
