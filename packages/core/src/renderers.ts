import { mixHex, readableOn } from "./color.js";
import {
  deterministicId,
  escapeHtml,
  initials,
  isRtl,
  normalizeBrandTokens,
} from "./tokens.js";
import type { BrandTokens } from "./types.js";

export interface RenderSize {
  width: number;
  height: number;
}

export function renderOpenGraphSvg(
  input: Partial<BrandTokens>,
  size: RenderSize = { width: 1200, height: 630 },
): string {
  const tokens = normalizeBrandTokens(input);
  const uid = deterministicId(
    JSON.stringify(tokens) + `${size.width}x${size.height}`,
  );
  const padding = Math.round(Math.min(size.width, size.height) * 0.095);
  const shadow =
    tokens.mode === "dark" ? "rgba(0,0,0,0.42)" : "rgba(15,23,42,0.18)";

  return svg(
    size,
    `
    <defs>
      ${renderBackgroundDefs(tokens, size, uid)}
      ${renderPatternDefs(tokens, uid)}
      <filter id="soft-${uid}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="${shadow}"/>
      </filter>
    </defs>
    <rect width="${size.width}" height="${size.height}" rx="${tokens.radius}" fill="url(#bg-${uid})"/>
    ${renderPremiumField(tokens, size, uid)}
    ${renderOpenGraphLayout(tokens, size, uid, padding)}
  `,
  );
}

export function renderLogoSvg(
  input: Partial<BrandTokens>,
  variant: "icon" | "horizontal" | "vertical" = "icon",
): string {
  const tokens = normalizeBrandTokens(input);
  const size =
    variant === "horizontal"
      ? { width: 1200, height: 360 }
      : variant === "vertical"
        ? { width: 720, height: 720 }
        : { width: 512, height: 512 };
  const uid = deterministicId(JSON.stringify(tokens) + variant);
  const mark =
    variant === "horizontal" ? 220 : variant === "vertical" ? 260 : 512;
  const markX = variant === "horizontal" ? 70 : (size.width - mark) / 2;
  const markY = variant === "horizontal" ? 70 : variant === "vertical" ? 90 : 0;
  const labelX = variant === "horizontal" ? 340 : size.width / 2;
  const labelY = variant === "horizontal" ? 205 : 445;
  const anchor = variant === "horizontal" ? "start" : "middle";

  return svg(
    size,
    `
    <defs>
      ${renderMarkDefs(tokens, uid)}
    </defs>
    <rect width="${size.width}" height="${size.height}" fill="none"/>
    ${renderBrandMark(tokens, uid, markX, markY, mark)}
    ${variant === "icon" ? "" : `<text x="${labelX}" y="${labelY}" text-anchor="${anchor}" fill="${tokens.foreground}" font-family="${fontStack(tokens.font)}" font-size="${variant === "horizontal" ? 104 : 66}" font-weight="800">${escapeHtml(tokens.name)}</text>`}
  `,
  );
}

export function renderFaviconSvg(
  input: Partial<BrandTokens>,
  size = 64,
): string {
  const tokens = normalizeBrandTokens(input);
  const uid = deterministicId(JSON.stringify(tokens) + `favicon-${size}`);

  return svg(
    { width: size, height: size },
    `
    <defs>
      ${renderMarkDefs(tokens, uid)}
    </defs>
    ${renderBrandMark(tokens, uid, 0, 0, size, true)}
  `,
  );
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
          purpose: "any maskable",
        },
        {
          src: "/android-chrome-512x512.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable",
        },
      ],
      shortcuts: [
        {
          name: "Open Brand",
          short_name: "Brand",
          url: "/",
          icons: [
            { src: "/favicon.svg", sizes: "64x64", type: "image/svg+xml" },
          ],
        },
      ],
    },
    null,
    2,
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
    `<meta name="theme-color" content="${tokens.primary}">`,
  ].join("\n");
}

export function renderRobotsTxt(): string {
  return "User-agent: *\nAllow: /\n";
}

function renderBackgroundDefs(
  tokens: BrandTokens,
  size: RenderSize,
  uid: string,
): string {
  const intensity = tokens.metaIntensity / 100;
  const primaryLift =
    tokens.theme === "minimal" ? 0.04 : 0.1 + intensity * 0.12;
  const accentLift =
    tokens.theme === "brutalist" ? 0.34 : 0.11 + intensity * 0.16;
  const mid = mixHex(tokens.background, tokens.primary, primaryLift);
  const end = mixHex(tokens.background, tokens.accent, accentLift);

  if (tokens.metaGradient === "solid") {
    return `
      <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${tokens.background}"/>
        <stop offset="1" stop-color="${tokens.background}"/>
      </linearGradient>
      ${renderSharedGradientDefs(tokens, uid)}
    `;
  }

  if (tokens.metaGradient === "radial") {
    return `
      <radialGradient id="bg-${uid}" cx="72%" cy="22%" r="82%">
        <stop offset="0" stop-color="${mixHex(tokens.background, tokens.accent, 0.32 + intensity * 0.22)}"/>
        <stop offset="0.46" stop-color="${mid}"/>
        <stop offset="1" stop-color="${tokens.background}"/>
      </radialGradient>
      ${renderSharedGradientDefs(tokens, uid)}
    `;
  }

  if (tokens.metaGradient === "mesh") {
    return `
      <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${mixHex(tokens.background, tokens.primary, 0.24 + intensity * 0.1)}"/>
        <stop offset="0.52" stop-color="${tokens.background}"/>
        <stop offset="1" stop-color="${mixHex(tokens.background, tokens.accent, 0.28 + intensity * 0.12)}"/>
      </linearGradient>
      ${renderSharedGradientDefs(tokens, uid)}
    `;
  }

  if (tokens.metaGradient === "aurora") {
    return `
      <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${mixHex(tokens.background, tokens.primary, 0.2 + intensity * 0.08)}"/>
        <stop offset="0.48" stop-color="${tokens.background}"/>
        <stop offset="1" stop-color="${mixHex(tokens.background, tokens.accent, 0.18 + intensity * 0.1)}"/>
      </linearGradient>
      ${renderSharedGradientDefs(tokens, uid)}
      <filter id="aurora-blur-${uid}" x="-10%" y="-20%" width="120%" height="140%">
        <feGaussianBlur stdDeviation="${Math.max(24, Math.round(size.width * 0.035))}"/>
      </filter>
    `;
  }

  return `
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tokens.background}"/>
      <stop offset="0.54" stop-color="${mid}"/>
      <stop offset="1" stop-color="${end}"/>
    </linearGradient>
    ${renderSharedGradientDefs(tokens, uid)}
  `;
}

function renderSharedGradientDefs(tokens: BrandTokens, uid: string): string {
  const accent = mixHex(tokens.accent, tokens.primary, 0.18);
  return `
    <linearGradient id="mark-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tokens.primary}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="glow-a-${uid}" cx="22%" cy="18%" r="80%">
      <stop offset="0" stop-color="${tokens.primary}" stop-opacity="0.42"/>
      <stop offset="1" stop-color="${tokens.primary}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-b-${uid}" cx="82%" cy="72%" r="86%">
      <stop offset="0" stop-color="${tokens.accent}" stop-opacity="0.36"/>
      <stop offset="1" stop-color="${tokens.accent}" stop-opacity="0"/>
    </radialGradient>
  `;
}

function renderPatternDefs(tokens: BrandTokens, uid: string): string {
  if (tokens.metaPattern === "none") {
    return "";
  }

  const scale = tokens.metaPatternScale;
  const color =
    tokens.mode === "dark"
      ? mixHex(tokens.foreground, tokens.background, 0.18)
      : mixHex(tokens.foreground, tokens.background, 0.42);

  if (tokens.metaPattern === "dots") {
    return `
      <pattern id="pattern-${uid}" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse">
        <circle cx="${Math.max(2, Math.round(scale * 0.11))}" cy="${Math.max(2, Math.round(scale * 0.11))}" r="${Math.max(1.2, scale * 0.055)}" fill="${color}"/>
      </pattern>
    `;
  }

  if (tokens.metaPattern === "diagonal") {
    return `
      <pattern id="pattern-${uid}" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="${scale}" stroke="${color}" stroke-width="1.5"/>
      </pattern>
    `;
  }

  if (tokens.metaPattern === "waves") {
    return `
      <pattern id="pattern-${uid}" width="${scale * 2}" height="${scale}" patternUnits="userSpaceOnUse">
        <path d="M 0 ${scale * 0.58} C ${scale * 0.5} ${scale * 0.2}, ${scale * 1.5} ${scale * 0.96}, ${scale * 2} ${scale * 0.58}" fill="none" stroke="${color}" stroke-width="1.5"/>
      </pattern>
    `;
  }

  if (tokens.metaPattern === "plus") {
    const bar = Math.max(1.4, scale * 0.07);
    const center = scale * 0.5;
    return `
      <pattern id="pattern-${uid}" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse">
        <rect x="${center - bar / 2}" y="${scale * 0.28}" width="${bar}" height="${scale * 0.44}" rx="${bar / 2}" fill="${color}"/>
        <rect x="${scale * 0.28}" y="${center - bar / 2}" width="${scale * 0.44}" height="${bar}" rx="${bar / 2}" fill="${color}"/>
      </pattern>
    `;
  }

  return `
    <pattern id="pattern-${uid}" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse">
      <path d="M ${scale} 0 H 0 V ${scale}" fill="none" stroke="${color}" stroke-width="1.2"/>
    </pattern>
  `;
}

function renderMarkDefs(tokens: BrandTokens, uid: string): string {
  const accent = mixHex(tokens.accent, tokens.primary, 0.18);
  return `
    <linearGradient id="mark-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tokens.primary}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
  `;
}

function renderPremiumField(
  tokens: BrandTokens,
  size: RenderSize,
  uid: string,
): string {
  const intensity = tokens.metaIntensity / 100;
  const overlays: string[] = [];

  if (tokens.metaGradient === "aurora") {
    overlays.push(`
      <g filter="url(#aurora-blur-${uid})" opacity="${(0.36 + intensity * 0.32).toFixed(2)}">
        <path d="M ${-size.width * 0.12} ${size.height * 0.24} C ${size.width * 0.24} ${-size.height * 0.08}, ${size.width * 0.62} ${size.height * 0.52}, ${size.width * 1.12} ${size.height * 0.16}" fill="none" stroke="${tokens.primary}" stroke-width="${size.height * 0.18}" stroke-linecap="round"/>
        <path d="M ${size.width * 0.02} ${size.height * 0.88} C ${size.width * 0.34} ${size.height * 0.48}, ${size.width * 0.72} ${size.height * 1.1}, ${size.width * 1.08} ${size.height * 0.54}" fill="none" stroke="${tokens.accent}" stroke-width="${size.height * 0.16}" stroke-linecap="round"/>
      </g>
    `);
  }

  if (tokens.metaGradient === "mesh" || tokens.theme === "mesh") {
    overlays.push(`
      <path d="M ${size.width * 0.46} 0 L ${size.width} 0 L ${size.width} ${size.height * 0.52} Z" fill="${tokens.primary}" opacity="${(0.12 + intensity * 0.12).toFixed(2)}"/>
      <path d="M ${size.width * 0.58} ${size.height} L ${size.width} ${size.height * 0.38} L ${size.width} ${size.height} Z" fill="${tokens.accent}" opacity="${(0.16 + intensity * 0.14).toFixed(2)}"/>
      <path d="M 0 ${size.height * 0.72} L ${size.width * 0.34} ${size.height} L 0 ${size.height} Z" fill="${tokens.secondary}" opacity="${(0.1 + intensity * 0.08).toFixed(2)}"/>
    `);
  }

  if (tokens.metaGradient === "radial") {
    overlays.push(`
      <rect width="${size.width}" height="${size.height}" fill="url(#glow-a-${uid})" opacity="${(0.36 + intensity * 0.22).toFixed(2)}"/>
      <rect width="${size.width}" height="${size.height}" fill="url(#glow-b-${uid})" opacity="${(0.32 + intensity * 0.2).toFixed(2)}"/>
    `);
  }

  if (tokens.theme === "brutalist") {
    overlays.push(`
      <rect x="${size.width * 0.66}" y="${size.height * 0.12}" width="${size.width * 0.22}" height="${size.height * 0.16}" fill="${tokens.accent}" opacity="0.92"/>
      <rect x="${size.width * 0.72}" y="${size.height * 0.23}" width="${size.width * 0.19}" height="${size.height * 0.1}" fill="${tokens.secondary}" opacity="0.9"/>
    `);
  }

  if (tokens.theme === "editorial") {
    overlays.push(`
      <line x1="${size.width * 0.58}" y1="${size.height * 0.14}" x2="${size.width * 0.88}" y2="${size.height * 0.76}" stroke="${tokens.primary}" stroke-width="2" opacity="0.38"/>
      <line x1="${size.width * 0.63}" y1="${size.height * 0.16}" x2="${size.width * 0.93}" y2="${size.height * 0.78}" stroke="${tokens.accent}" stroke-width="2" opacity="0.3"/>
    `);
  }

  if (tokens.metaPattern !== "none") {
    overlays.push(
      `<rect width="${size.width}" height="${size.height}" fill="url(#pattern-${uid})" opacity="${(0.08 + intensity * 0.18).toFixed(2)}"/>`,
    );
  }

  return overlays.join("\n");
}

function renderOpenGraphLayout(
  tokens: BrandTokens,
  size: RenderSize,
  uid: string,
  padding: number,
): string {
  const direction = isRtl(`${tokens.name} ${tokens.description}`)
    ? "rtl"
    : "ltr";
  const defaultAnchor = direction === "rtl" ? "end" : "start";
  const textX = direction === "rtl" ? size.width - padding : padding;
  const foreground = tokens.foreground;

  if (tokens.metaLayout === "centered") {
    const markSize = Math.round(Math.min(size.width, size.height) * 0.18);
    const markX = Math.round((size.width - markSize) / 2);
    const markY = Math.round(size.height * 0.16);
    return `
      <g filter="url(#soft-${uid})">${renderBrandMark(tokens, uid, markX, markY, markSize)}</g>
      ${renderTextBlock(tokens, size.width / 2, Math.round(size.height * 0.58), size.width - padding * 2, "middle", direction, foreground, Math.round(size.width * 0.078), 42, Math.round(size.width * 0.032), 22)}
      ${renderSignalBars(tokens, Math.round(size.width * 0.34), size.height - padding - 28, Math.round(size.width * 0.32))}
    `;
  }

  if (tokens.metaLayout === "split") {
    const markSize = Math.round(
      Math.min(size.height * 0.56, size.width * 0.31),
    );
    const markX = Math.round(size.width - padding - markSize);
    const markY = Math.round((size.height - markSize) / 2);
    const copyWidth = Math.round(size.width - padding * 3 - markSize);
    const copyX = direction === "rtl" ? padding + copyWidth : padding;
    return `
      <g opacity="0.22">${renderDecorativePanel(tokens, size, uid)}</g>
      <g filter="url(#soft-${uid})">${renderBrandMark(tokens, uid, markX, markY, markSize)}</g>
      ${renderTextBlock(tokens, copyX, Math.round(size.height * 0.42), copyWidth, defaultAnchor, direction, foreground, Math.round(size.width * 0.072), 40, Math.round(size.width * 0.03), 22)}
      ${renderSignalBars(tokens, padding, size.height - padding - 28, Math.round(size.width * 0.31))}
    `;
  }

  if (tokens.metaLayout === "poster") {
    const ghostSize = Math.round(Math.min(size.width, size.height) * 0.54);
    const ghostX =
      direction === "rtl" ? padding : size.width - padding - ghostSize;
    const ghostY = Math.round(size.height * 0.12);
    return `
      <g opacity="${tokens.logoSource === "uploaded" ? "0.22" : "0.18"}">${renderBrandMark(tokens, uid, ghostX, ghostY, ghostSize)}</g>
      ${renderTextBlock(tokens, textX, Math.round(size.height * 0.55), size.width - padding * 2, defaultAnchor, direction, foreground, Math.round(size.width * 0.088), 44, Math.round(size.width * 0.034), 22, 3)}
      ${renderSignalBars(tokens, direction === "rtl" ? size.width - padding - Math.round(size.width * 0.32) : padding, size.height - padding - 28, Math.round(size.width * 0.32))}
    `;
  }

  const markSize = Math.round(Math.min(size.width, size.height) * 0.17);
  const titleY = Math.round(size.height * 0.51);
  return `
    <g filter="url(#soft-${uid})">${renderBrandMark(tokens, uid, padding, padding, markSize)}</g>
    ${renderTextBlock(tokens, textX, titleY, size.width - padding * 2, defaultAnchor, direction, foreground, Math.round(size.width * 0.085), 46, Math.round(size.width * 0.035), 24)}
    ${renderSignalBars(tokens, padding, size.height - padding - 28, Math.round(size.width * 0.315))}
  `;
}

function renderDecorativePanel(
  tokens: BrandTokens,
  size: RenderSize,
  uid: string,
): string {
  const panelWidth = size.width * 0.42;
  return `
    <rect x="${size.width - panelWidth}" y="0" width="${panelWidth}" height="${size.height}" fill="url(#glow-b-${uid})"/>
    <path d="M ${size.width * 0.62} 0 L ${size.width} 0 L ${size.width} ${size.height} L ${size.width * 0.76} ${size.height} Z" fill="${tokens.primary}"/>
  `;
}

function renderBrandMark(
  tokens: BrandTokens,
  uid: string,
  x: number,
  y: number,
  size: number,
  compact = false,
): string {
  const clipId = `clip-${uid}-${Math.round(x)}-${Math.round(y)}-${Math.round(size)}`;
  const padding = compact ? size * 0.1 : size * 0.12;

  if (tokens.logoSource === "uploaded" && tokens.logoDataUri) {
    return `
      <defs>
        <clipPath id="${clipId}">${renderMarkShape(tokens, x, y, size, "")}</clipPath>
      </defs>
      ${renderMarkShape(tokens, x, y, size, `fill="${mixHex(tokens.background, tokens.primary, 0.08)}"`)}
      <image href="${escapeHtml(tokens.logoDataUri)}" x="${x + padding}" y="${y + padding}" width="${size - padding * 2}" height="${size - padding * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>
    `;
  }

  return `
    ${renderMarkShape(tokens, x, y, size, `fill="url(#mark-${uid})"`)}
    ${renderGeneratedMark(tokens, x, y, size, compact)}
  `;
}

function renderGeneratedMark(
  tokens: BrandTokens,
  x: number,
  y: number,
  size: number,
  compact: boolean,
): string {
  const fill = readableOn(tokens.primary);
  const markText = initials(tokens.name);
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  if (tokens.logoStyle === "initials") {
    return `<text x="${centerX}" y="${centerY + size * 0.13}" text-anchor="middle" fill="${fill}" font-family="${fontStack(tokens.font)}" font-size="${Math.round(size * (compact ? 0.42 : 0.36))}" font-weight="850">${escapeHtml(markText.slice(0, compact ? 1 : 2))}</text>`;
  }

  if (tokens.logoStyle === "monogram") {
    const letters = Array.from(markText).slice(0, 2);
    const first = letters[0] ?? "B";
    const second = letters[1] ?? first;
    return `
      <text x="${centerX - size * 0.08}" y="${centerY + size * 0.1}" text-anchor="middle" fill="${fill}" font-family="${fontStack(tokens.font)}" font-size="${Math.round(size * 0.42)}" font-weight="900" opacity="0.92">${escapeHtml(first)}</text>
      <text x="${centerX + size * 0.12}" y="${centerY + size * 0.17}" text-anchor="middle" fill="${fill}" font-family="${fontStack(tokens.font)}" font-size="${Math.round(size * 0.34)}" font-weight="800" opacity="0.68">${escapeHtml(second)}</text>
    `;
  }

  if (tokens.logoStyle === "badge") {
    const inset = size * 0.18;
    return `
      <rect x="${x + inset}" y="${y + inset}" width="${size - inset * 2}" height="${size - inset * 2}" rx="${Math.max(4, size * 0.08)}" fill="${fill}" opacity="0.16"/>
      <text x="${centerX}" y="${centerY + size * 0.13}" text-anchor="middle" fill="${fill}" font-family="${fontStack(tokens.font)}" font-size="${Math.round(size * 0.34)}" font-weight="900">${escapeHtml(markText.slice(0, 2))}</text>
    `;
  }

  return `
    <path d="${sparkPath(x, y, size)}" fill="${fill}" opacity="0.2"/>
    <text x="${centerX}" y="${centerY + size * 0.14}" text-anchor="middle" fill="${fill}" font-family="${fontStack(tokens.font)}" font-size="${Math.round(size * (compact ? 0.4 : 0.34))}" font-weight="850">${escapeHtml(markText.slice(0, compact ? 1 : 2))}</text>
  `;
}

function renderMarkShape(
  tokens: BrandTokens,
  x: number,
  y: number,
  size: number,
  attributes: string,
): string {
  if (tokens.logoShape === "circle") {
    return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" ${attributes}/>`;
  }

  if (tokens.logoShape === "hex") {
    const points = [
      [x + size * 0.5, y],
      [x + size * 0.94, y + size * 0.25],
      [x + size * 0.94, y + size * 0.75],
      [x + size * 0.5, y + size],
      [x + size * 0.06, y + size * 0.75],
      [x + size * 0.06, y + size * 0.25],
    ]
      .map((point) => point.join(","))
      .join(" ");
    return `<polygon points="${points}" ${attributes}/>`;
  }

  if (tokens.logoShape === "diamond") {
    return `<path d="M ${x + size / 2} ${y} L ${x + size} ${y + size / 2} L ${x + size / 2} ${y + size} L ${x} ${y + size / 2} Z" ${attributes}/>`;
  }

  const radius = Math.min(
    Math.max(tokens.radius * (size / 180), size * 0.08),
    size / 3,
  );
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" ${attributes}/>`;
}

function renderTextBlock(
  tokens: BrandTokens,
  x: number,
  y: number,
  maxWidth: number,
  anchor: "start" | "middle" | "end",
  direction: "ltr" | "rtl",
  foreground: string,
  preferredTitle: number,
  minimumTitle: number,
  preferredDescription: number,
  minimumDescription: number,
  titleLineLimit = 2,
): string {
  const titleLines = wrapText(
    tokens.name,
    Math.floor(maxWidth / (preferredTitle * 0.5)),
    titleLineLimit,
  );
  const descriptionLines = wrapText(
    tokens.description,
    Math.floor(maxWidth / (preferredDescription * 0.52)),
    2,
  );
  const titleSize = fitText(
    longestLine(titleLines),
    maxWidth,
    preferredTitle,
    minimumTitle,
  );
  const descriptionSize = fitText(
    longestLine(descriptionLines),
    maxWidth,
    preferredDescription,
    minimumDescription,
  );
  const titleLineHeight = Math.round(titleSize * 1.02);
  const descriptionY =
    y +
    titleLineHeight * titleLines.length +
    Math.round(descriptionSize * 0.88);
  const descriptionColor = mixHex(
    foreground,
    tokens.background,
    tokens.mode === "dark" ? 0.24 : 0.34,
  );

  return `
    ${renderTextLines(titleLines, x, y, titleLineHeight, anchor, direction, foreground, titleSize, 850, tokens.font)}
    ${renderTextLines(descriptionLines, x, descriptionY, Math.round(descriptionSize * 1.22), anchor, direction, descriptionColor, descriptionSize, 500, tokens.font)}
  `;
}

function renderTextLines(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  anchor: string,
  direction: string,
  fill: string,
  fontSize: number,
  weight: number,
  font: string,
): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" direction="${direction}" text-anchor="${anchor}" fill="${fill}" font-family="${fontStack(font)}" font-size="${fontSize}" font-weight="${weight}" letter-spacing="0">${escapeHtml(line)}</text>`,
    )
    .join("\n");
}

function renderSignalBars(
  tokens: BrandTokens,
  x: number,
  y: number,
  width: number,
): string {
  const first = Math.round(width * 0.51);
  const second = Math.round(width * 0.25);
  const third = Math.round(width * 0.14);
  const gap = Math.max(14, Math.round(width * 0.045));
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="${first}" height="8" rx="4" fill="${tokens.primary}"/>
      <rect x="${first + gap}" width="${second}" height="8" rx="4" fill="${tokens.accent}"/>
      <rect x="${first + second + gap * 2}" width="${third}" height="8" rx="4" fill="${tokens.secondary}"/>
    </g>
  `;
}

function svg(size: RenderSize, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" role="img">${body.replace(/\n\s+/g, "\n").trim()}\n</svg>\n`;
}

function fitText(
  text: string,
  maxWidth: number,
  preferred: number,
  minimum: number,
): number {
  const graphemes = Array.from(text);
  const estimatedWidth = graphemes.length * preferred * 0.56;
  if (estimatedWidth <= maxWidth) {
    return preferred;
  }

  return Math.max(
    minimum,
    Math.floor((maxWidth / Math.max(graphemes.length, 1)) * 1.78),
  );
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const limit = Math.max(4, maxChars);
  const words = text.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const wordLength = Array.from(word).length;
    if (wordLength > limit) {
      if (current) {
        lines.push(current);
        current = "";
      }

      const chunks = chunkGraphemes(word, limit);
      lines.push(...chunks);
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (Array.from(next).length <= limit) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  const limited = lines.length > 0 ? lines.slice(0, maxLines) : [text];
  if (lines.length > maxLines) {
    const last = limited[limited.length - 1] ?? "";
    limited[limited.length - 1] = `${last.replace(/[. ,;:!?-]+$/u, "")}...`;
  }

  return limited;
}

function chunkGraphemes(value: string, size: number): string[] {
  const graphemes = Array.from(value);
  const chunks: string[] = [];
  for (let index = 0; index < graphemes.length; index += size) {
    chunks.push(graphemes.slice(index, index + size).join(""));
  }
  return chunks;
}

function longestLine(lines: string[]): string {
  return lines.reduce(
    (longest, line) =>
      Array.from(line).length > Array.from(longest).length ? line : longest,
    "",
  );
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
