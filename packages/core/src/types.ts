export type BrandMode = "light" | "dark";

export type BrandTheme =
  | "minimal"
  | "glass"
  | "editorial"
  | "apple"
  | "stripe"
  | "linear"
  | "modern"
  | "brutalist"
  | "mesh"
  | "gradient";

export type AssetCategory =
  | "brand"
  | "logo"
  | "favicon"
  | "manifest"
  | "social"
  | "metadata"
  | "validation";

export type AssetFormat = "svg" | "json" | "txt" | "html";

export interface BrandTokens {
  name: string;
  description: string;
  font: string;
  radius: number;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  mode: BrandMode;
  theme: BrandTheme;
}

export interface BrandAsset {
  id: string;
  name: string;
  filename: string;
  category: AssetCategory;
  format: AssetFormat;
  mimeType: string;
  width?: number;
  height?: number;
  content: string;
  platform?: string;
}

export interface AssetTarget {
  id: string;
  name: string;
  filename: string;
  category: AssetCategory;
  format: AssetFormat;
  mimeType: string;
  width?: number;
  height?: number;
  platform?: string;
}

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
  path?: keyof BrandTokens | "assets";
}

export interface ValidationReport {
  ok: boolean;
  score: number;
  issues: ValidationIssue[];
}

export interface BatchRow {
  name: string;
  description?: string;
  font?: string;
  radius?: number;
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  mode?: BrandMode;
  theme?: BrandTheme;
}

export interface BatchParseResult {
  rows: BatchRow[];
  errors: string[];
}
