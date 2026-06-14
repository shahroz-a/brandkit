import {
  generateBrandAssets,
  normalizeBrandTokens,
  renderFaviconSvg,
  renderLogoSvg,
  renderManifest,
  renderOpenGraphSvg,
  validateBrandTokens
} from "@brandkit/core";
import type { BrandAsset, BrandTokens, RenderSize, ValidationReport } from "@brandkit/core";

export interface GenerateOgOptions extends Partial<BrandTokens> {
  width?: number;
  height?: number;
}

export interface BrandKitBundle {
  tokens: BrandTokens;
  assets: BrandAsset[];
  validation: ValidationReport;
}

export function generateOG(options: GenerateOgOptions): string {
  const { width = 1200, height = 630, ...tokens } = options;
  return renderOpenGraphSvg(tokens, { width, height } satisfies RenderSize);
}

export function generateLogo(options: Partial<BrandTokens>, variant: "icon" | "horizontal" | "vertical" = "icon"): string {
  return renderLogoSvg(options, variant);
}

export function generateFavicon(options: Partial<BrandTokens>, size = 64): string {
  return renderFaviconSvg(options, size);
}

export function generateWebManifest(options: Partial<BrandTokens>): string {
  return renderManifest(options);
}

export function generateBrandKit(options: Partial<BrandTokens>): BrandKitBundle {
  const tokens = normalizeBrandTokens(options);
  return {
    tokens,
    assets: generateBrandAssets(tokens),
    validation: validateBrandTokens(options)
  };
}

export { generateBrandAssets, normalizeBrandTokens, validateBrandTokens };
export type { BrandAsset, BrandTokens, ValidationIssue, ValidationReport } from "@brandkit/core";
