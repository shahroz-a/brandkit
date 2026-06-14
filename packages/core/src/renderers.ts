import { mixHex, readableOn } from "./color.js";
import { deterministicId, escapeHtml, initials, isRtl, normalizeBrandTokens } from "./tokens.js";
import type { BrandTokens } from "./types.js";

export interface RenderSize {
  width: number;
  height: number;
}

export function renderOpenGraphSvg(input: Partial<BrandTokens>, size: RenderSize = { width: 1200, height: 630 }): string {
  const tokens = normalizeBrandTokens(input);
  const uid = deterministicId(JSON.stringify(tokens) + `${size.width}x${size.height}`);
  const padding = Math.round(Math.min(size.width, size.height) * 0.095);
  const markSize = Math.round(Math.min(size.width, size.height) * 0.17);
  const titleSize = fitText(tokens.name, size.width - padding * 2, Math.round(size.width * 0.085), 46);
  const descriptionSize = fitText(tokens.description, size.width - padding * 2, Math.round(size.width * 0.035), 24);
  const titleY = Math.round(size.height * 0.51);
  const direction = isRtl(`${tokens.name} ${tokens.description}`) ? "rtl" : "ltr";
  const anchor = direction === "rtl" ? "end" : "start";
  const textX = direction === "rtl" ? size.width - padding : padding;
  const foreground = readableOn(tokens.background);
  const shadow = tokens.mode === "dark" ? "rgba(0,0,0,0.38)" : "rgba(15,23,42,0.16)";
  const accent = mixHex(tokens.accent, tokens.primary, 0.18);

  return svg(size, `
    <defs>
      <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${tokens.background}"/>
        <stop offset="0.54" stop-color="${mixHex(tokens.background, tokens.primary, tokens.theme === "minimal" ? 0.04 : 0.13)}"/>
        <stop offset="1" stop-color="${mixHex(tokens.background, tokens.accent, tokens.theme === "brutalist" ? 0.32 : 0.16)}"/>
      </linearGradient>
      <linearGradient id="mark-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${tokens.primary}"/>
        <stop offset="1" stop-color="${accent}"/>
      </linearGradient>
      <filter id="soft-${uid}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="${shadow}"/>
      </filter>
    </defs>
    <rect width="${size.width}" height="${size.height}" rx="${tokens.radius}" fill="url(#bg-${uid})"/>
    ${renderThemeField(tokens, size, uid)}
    <g filter="url(#soft-${uid})">
      <rect x="${padding}" y="${padding}" width="${markSize}" height="${markSize}" rx="${Math.min(tokens.radius, markSize / 3)}" fill="url(#mark-${uid})"/>
      <text x="${padding + markSize / 2}" y="${padding + markSize / 2 + markSize * 0.14}" text-anchor="middle" fill="${readableOn(tokens.primary)}" font-family="${fontStack(tokens.font)}" font-size="${Math.round(markSize * 0.38)}" font-weight="800">${escapeHtml(initials(tokens.name))}</text>
    </g>
    <text x="${textX}" y="${titleY}" direction="${direction}" text-anchor="${anchor}" fill="${foreground}" font-family="${fontStack(tokens.font)}" font-size="${titleSize}" font-weight="850" letter-spacing="0">${escapeHtml(tokens.name)}</text>
    <text x="${textX}" y="${titleY + Math.round(titleSize * 0.86)}" direction="${direction}" text-anchor="${anchor}" fill="${mixHex(foreground, tokens.background, 0.28)}" font-family="${fontStack(tokens.font)}" font-size="${descriptionSize}" font-weight="500">${escapeHtml(tokens.description)}</text>
    <g transform="translate(${padding}, ${size.height - padding - 28})">
      <rect width="${Math.round(size.width * 0.16)}" height="8" rx="4" fill="${tokens.primary}"/>
      <rect x="${Math.round(size.width * 0.175)}" width="${Math.round(size.width * 0.08)}" height="8" rx="4" fill="${tokens.accent}"/>
      <rect x="${Math.round(size.width * 0.27)}" width="${Math.round(size.width * 0.045)}" height="8" rx="4" fill="${tokens.secondary}"/>
    </g>
  `);
}

export function renderLogoSvg(input: Partial<BrandTokens>, variant: "icon" | "horizontal" | "vertical" = "icon"): string {
  const tokens = normalizeBrandTokens(input);
  const size = variant === "horizontal" ? { width: 1200, height: 360 } : variant === "vertical" ? { width: 720, height: 720 } : { width: 512, height: 512 };
  const uid = deterministicId(JSON.stringify(tokens) + variant);
  const mark = variant === "horizontal" ? 220 : variant === "vertical" ? 260 : 512;
  const markX = variant === "horizontal" ? 70 : (size.width - mark) / 2;
  const markY = variant === "horizontal" ? 70 : variant === "vertical" ? 90 : 0;
  const labelX = variant === "horizontal" ? 340 : size.width / 2;
  const labelY = variant === "horizontal" ? 205 : 445;
  const anchor = variant === "horizontal" ? "start" : "middle";

  return svg(size, `
    <defs>
      <linearGradient id="logo-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${tokens.primary}"/>
        <stop offset="1" stop-color="${tokens.accent}"/>
      </linearGradient>
    </defs>
    <rect width="${size.width}" height="${size.height}" fill="none"/>
    <rect x="${markX}" y="${markY}" width="${mark}" height="${mark}" rx="${Math.min(tokens.radius * 2, mark / 3)}" fill="url(#logo-${uid})"/>
    <path d="${sparkPath(markX, markY, mark)}" fill="${readableOn(tokens.primary)}" opacity="0.2"/>
    <text x="${markX + mark / 2}" y="${markY + mark * 0.57}" text-anchor="middle" fill="${readableOn(tokens.primary)}" font-family="${fontStack(tokens.font)}" font-size="${Math.round(mark * 0.34)}" font-weight="850">${escapeHtml(initials(tokens.name))}</text>
    ${variant === "icon" ? "" : `<text x="${labelX}" y="${labelY}" text-anchor="${anchor}" fill="${tokens.foreground}" font-family="${fontStack(tokens.font)}" font-size="${variant === "horizontal" ? 104 : 66}" font-weight="800">${escapeHtml(tokens.name)}</text>`}
  `);
}

export function renderFaviconSvg(input: Partial<BrandTokens>, size = 64): string {
  const tokens = normalizeBrandTokens(input);
  const radius = Math.min(tokens.radius, size / 3);

  return svg({ width: size, height: size }, `
    <rect width="${size}" height="${size}" rx="${radius}" fill="${tokens.primary}"/>
    <circle cx="${size * 0.72}" cy="${size * 0.24}" r="${size * 0.17}" fill="${tokens.accent}"/>
    <text x="${size / 2}" y="${size * 0.6}" text-anchor="middle" fill="${readableOn(tokens.primary)}" font-family="${fontStack(tokens.font)}" font-size="${size * 0.38}" font-weight="850">${escapeHtml(initials(tokens.name).slice(0, 1))}</text>
  `);
}

export function renderManifest(input: Partial<BrandTokens>): string {
  const tokens = normalizeBrandTokens(input);
  return `${JSON.stringify(
    {
      name: tokens.name,
      short_name: initials(tokens.name),
      description: tokens.description,
      start_url: "/",
      display: "standalone",
      background_color: tokens.background,
      theme_color: tokens.primary,
      icons: [
        {
          src: "/android-chrome-192x192.svg",
          sizes: "192x192",
          type: "image/svg+xml",
          purpose: "any maskable"
        },
        {
          src: "/android-chrome-512x512.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ],
      shortcuts: [
        {
          name: "Open Brand",
          short_name: "Brand",
          url: "/",
          icons: [{ src: "/favicon.svg", sizes: "64x64", type: "image/svg+xml" }]
        }
      ]
    },
    null,
    2
  )}\n`;
}

export function renderMetadataHtml(input: Partial<BrandTokens>): string {
  const tokens = normalizeBrandTokens(input);
  return [
    `<title>${escapeHtml(tokens.name)}</title>`,
    `<meta name="description" content="${escapeHtml(tokens.description)}">`,
    `<meta property="og:title" content="${escapeHtml(tokens.name)}">`,
    `<meta property="og:description" content="${escapeHtml(tokens.description)}">`,
    `<meta property="og:image" content="/og-image.svg">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(tokens.name)}">`,
    `<meta name="twitter:description" content="${escapeHtml(tokens.description)}">`,
    `<meta name="twitter:image" content="/twitter-card.svg">`,
    `<meta name="theme-color" content="${tokens.primary}">`
  ].join("\n");
}

export function renderRobotsTxt(): string {
  return "User-agent: *\nAllow: /\n";
}

function renderThemeField(tokens: BrandTokens, size: RenderSize, uid: string): string {
  if (tokens.theme === "minimal") {
    return "";
  }

  if (tokens.theme === "brutalist") {
    return `
      <rect x="${size.width * 0.66}" y="${size.height * 0.12}" width="${size.width * 0.22}" height="${size.height * 0.16}" fill="${tokens.accent}" opacity="0.92"/>
      <rect x="${size.width * 0.72}" y="${size.height * 0.23}" width="${size.width * 0.19}" height="${size.height * 0.1}" fill="${tokens.secondary}" opacity="0.9"/>
    `;
  }

  if (tokens.theme === "editorial") {
    return `
      <line x1="${size.width * 0.58}" y1="${size.height * 0.14}" x2="${size.width * 0.88}" y2="${size.height * 0.76}" stroke="${tokens.primary}" stroke-width="2" opacity="0.38"/>
      <line x1="${size.width * 0.63}" y1="${size.height * 0.16}" x2="${size.width * 0.93}" y2="${size.height * 0.78}" stroke="${tokens.accent}" stroke-width="2" opacity="0.3"/>
    `;
  }

  return `
    <circle cx="${size.width * 0.88}" cy="${size.height * 0.18}" r="${size.width * 0.13}" fill="${tokens.primary}" opacity="0.14"/>
    <circle cx="${size.width * 0.78}" cy="${size.height * 0.78}" r="${size.width * 0.2}" fill="${tokens.accent}" opacity="0.12"/>
    <pattern id="dots-${uid}" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="3" fill="${tokens.secondary}" opacity="0.16"/>
    </pattern>
    <rect x="${size.width * 0.56}" y="${size.height * 0.1}" width="${size.width * 0.4}" height="${size.height * 0.76}" fill="url(#dots-${uid})" opacity="0.8"/>
  `;
}

function svg(size: RenderSize, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" role="img">${body.replace(/\n\s+/g, "\n").trim()}\n</svg>\n`;
}

function fitText(text: string, maxWidth: number, preferred: number, minimum: number): number {
  const graphemes = Array.from(text);
  const estimatedWidth = graphemes.length * preferred * 0.56;
  if (estimatedWidth <= maxWidth) {
    return preferred;
  }

  return Math.max(minimum, Math.floor((maxWidth / Math.max(graphemes.length, 1)) * 1.78));
}

function fontStack(font: string): string {
  return `${escapeHtml(font)}, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
}

function sparkPath(x: number, y: number, size: number): string {
  const left = x + size * 0.18;
  const top = y + size * 0.2;
  const right = x + size * 0.82;
  const bottom = y + size * 0.78;
  const midX = x + size * 0.5;
  return `M ${left} ${bottom} C ${left + size * 0.16} ${top}, ${right - size * 0.2} ${top}, ${right} ${bottom} L ${midX} ${bottom - size * 0.18} Z`;
}
