import { renderFaviconSvg, renderLogoSvg, renderManifest, renderMetadataHtml, renderOpenGraphSvg, renderRobotsTxt } from "./renderers.js";
import { normalizeBrandTokens, slugify } from "./tokens.js";
import type { AssetTarget, BrandAsset, BrandTokens } from "./types.js";

const SOCIAL_TARGETS: AssetTarget[] = [
  social("og-image", "OpenGraph", "og-image.svg", 1200, 630, "OpenGraph"),
  social("twitter-card", "Twitter Card", "twitter-card.svg", 1200, 675, "Twitter"),
  social("linkedin-banner", "LinkedIn Banner", "linkedin-banner.svg", 1584, 396, "LinkedIn"),
  social("discord-preview", "Discord Preview", "discord-preview.svg", 1200, 630, "Discord"),
  social("slack-preview", "Slack Preview", "slack-preview.svg", 1200, 630, "Slack"),
  social("github-social-preview", "GitHub Social Preview", "github-social-preview.svg", 1280, 640, "GitHub"),
  social("product-hunt", "Product Hunt", "product-hunt.svg", 1270, 760, "Product Hunt"),
  social("devto-cover", "Dev.to Cover", "devto-cover.svg", 1000, 420, "Dev.to"),
  social("hashnode-cover", "Hashnode Cover", "hashnode-cover.svg", 1600, 840, "Hashnode"),
  social("medium-cover", "Medium Cover", "medium-cover.svg", 1400, 788, "Medium"),
  social("substack-header", "Substack Header", "substack-header.svg", 1456, 1048, "Substack"),
  social("newsletter-header", "Newsletter Header", "newsletter-header.svg", 1200, 600, "Newsletter"),
  social("youtube-banner", "YouTube Banner", "youtube-banner.svg", 2560, 1440, "YouTube"),
  social("blog-cover", "Blog Cover", "blog-cover.svg", 1600, 900, "Blog"),
  social("podcast-cover", "Podcast Cover", "podcast-cover.svg", 3000, 3000, "Podcast")
];

const FAVICON_TARGETS: AssetTarget[] = [
  icon("favicon", "Favicon SVG", "favicon.svg", 64, 64),
  icon("apple-touch-icon", "Apple Touch Icon", "apple-touch-icon.svg", 180, 180),
  icon("android-chrome-192", "Android 192", "android-chrome-192x192.svg", 192, 192),
  icon("android-chrome-512", "Android 512", "android-chrome-512x512.svg", 512, 512),
  icon("mstile-150", "Microsoft Tile", "mstile-150x150.svg", 150, 150),
  icon("mask-icon", "Pinned Tab Mask", "mask-icon.svg", 512, 512)
];

export function generateBrandAssets(input: Partial<BrandTokens> = {}): BrandAsset[] {
  const tokens = normalizeBrandTokens(input);
  const slug = slugify(tokens.name);
  const tokenJson = `${JSON.stringify(tokens, null, 2)}\n`;

  return [
    jsonAsset("brand-json", "Brand Tokens", "brand.json", tokenJson),
    htmlAsset("metadata-tags", "Metadata Tags", "metadata.html", renderMetadataHtml(tokens)),
    textAsset("robots", "Robots", "robots.txt", renderRobotsTxt()),
    svgAsset("logo-icon", "Logo Icon", `${slug}-logo-icon.svg`, "logo", renderLogoSvg(tokens, "icon"), 512, 512),
    svgAsset("logo-horizontal", "Horizontal Logo", `${slug}-logo-horizontal.svg`, "logo", renderLogoSvg(tokens, "horizontal"), 1200, 360),
    svgAsset("logo-vertical", "Vertical Logo", `${slug}-logo-vertical.svg`, "logo", renderLogoSvg(tokens, "vertical"), 720, 720),
    svgAsset("logo-light", "Light Logo", `${slug}-logo-light.svg`, "logo", renderLogoSvg({ ...tokens, background: "#FFFFFF", foreground: "#111827", mode: "light" }, "horizontal"), 1200, 360),
    svgAsset("logo-dark", "Dark Logo", `${slug}-logo-dark.svg`, "logo", renderLogoSvg({ ...tokens, background: "#0B1020", foreground: "#F8FAFC", mode: "dark" }, "horizontal"), 1200, 360),
    ...FAVICON_TARGETS.map((target) => ({
      ...target,
      content: renderFaviconSvg(tokens, target.width ?? 64)
    })),
    jsonAsset("manifest", "Web App Manifest", "site.webmanifest", renderManifest(tokens), "manifest"),
    ...SOCIAL_TARGETS.map((target) => ({
      ...target,
      content: renderOpenGraphSvg(tokens, { width: target.width ?? 1200, height: target.height ?? 630 })
    }))
  ];
}

export function getAssetTargets(): AssetTarget[] {
  return [
    { id: "brand-json", name: "Brand Tokens", filename: "brand.json", category: "brand", format: "json", mimeType: "application/json" },
    { id: "metadata-tags", name: "Metadata Tags", filename: "metadata.html", category: "metadata", format: "html", mimeType: "text/html" },
    { id: "robots", name: "Robots", filename: "robots.txt", category: "metadata", format: "txt", mimeType: "text/plain" },
    ...FAVICON_TARGETS,
    ...SOCIAL_TARGETS
  ];
}

function social(id: string, name: string, filename: string, width: number, height: number, platform: string): AssetTarget {
  return { id, name, filename, width, height, platform, category: "social", format: "svg", mimeType: "image/svg+xml" };
}

function icon(id: string, name: string, filename: string, width: number, height: number): AssetTarget {
  return { id, name, filename, width, height, category: "favicon", format: "svg", mimeType: "image/svg+xml" };
}

function svgAsset(id: string, name: string, filename: string, category: BrandAsset["category"], content: string, width: number, height: number): BrandAsset {
  return { id, name, filename, category, content, width, height, format: "svg", mimeType: "image/svg+xml" };
}

function jsonAsset(id: string, name: string, filename: string, content: string, category: BrandAsset["category"] = "brand"): BrandAsset {
  return { id, name, filename, category, content, format: "json", mimeType: "application/json" };
}

function textAsset(id: string, name: string, filename: string, content: string): BrandAsset {
  return { id, name, filename, category: "metadata", content, format: "txt", mimeType: "text/plain" };
}

function htmlAsset(id: string, name: string, filename: string, content: string): BrandAsset {
  return { id, name, filename, category: "metadata", content, format: "html", mimeType: "text/html" };
}
