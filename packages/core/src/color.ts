export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_3 = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const HEX_6 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export function isHexColor(value: string): boolean {
  return HEX_3.test(value.trim()) || HEX_6.test(value.trim());
}

export function normalizeHex(value: string): string {
  const trimmed = value.trim();
  const short = trimmed.match(HEX_3);
  if (short) {
    const [, r, g, b] = short;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  const long = trimmed.match(HEX_6);
  if (long) {
    const [, r, g, b] = long;
    return `#${r}${g}${b}`.toUpperCase();
  }

  throw new Error(`Invalid hex color: ${value}`);
}

export function safeHex(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  try {
    return normalizeHex(value);
  } catch {
    return fallback;
  }
}

export function hexToRgb(value: string): Rgb {
  const hex = normalizeHex(value).slice(1);
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16)
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

export function mixHex(first: string, second: string, amount: number): string {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  const ratio = clamp(amount, 0, 1);

  return rgbToHex({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio
  });
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [red, green, blue] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
}

export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);

  return (light + 0.05) / (dark + 0.05);
}

export function readableOn(background: string): "#FFFFFF" | "#111827" {
  return contrastRatio(background, "#FFFFFF") >= contrastRatio(background, "#111827")
    ? "#FFFFFF"
    : "#111827";
}

export function alpha(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(opacity, 0, 1).toFixed(3)})`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
