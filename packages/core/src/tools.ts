import {
  LOGO_SHAPES,
  LOGO_SOURCES,
  LOGO_STYLES,
  META_GRADIENTS,
  META_LAYOUTS,
  META_PATTERNS,
  THEMES,
} from "./tokens.js";

export interface BrandKitToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function getBrandKitToolManifest(): {
  name: string;
  version: string;
  tools: BrandKitToolDefinition[];
} {
  return {
    name: "brandkit-os",
    version: "0.1.0",
    tools: [
      {
        name: "brandkit_generate",
        description: "Generate deterministic brand assets from brand tokens.",
        inputSchema: brandTokensSchema(),
      },
      {
        name: "brandkit_render_meta_image",
        description:
          "Render one premium social/meta image SVG for a requested size.",
        inputSchema: {
          type: "object",
          properties: {
            ...brandTokenProperties(),
            width: {
              type: "number",
              minimum: 320,
              maximum: 4000,
              default: 1200,
            },
            height: {
              type: "number",
              minimum: 240,
              maximum: 4000,
              default: 630,
            },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
      {
        name: "brandkit_validate",
        description:
          "Validate brand tokens and return contrast, upload, and export-readiness issues.",
        inputSchema: brandTokensSchema(),
      },
      {
        name: "brandkit_batch",
        description: "Generate multiple kits from CSV, TSV, or JSON rows.",
        inputSchema: {
          type: "object",
          properties: {
            source: {
              type: "string",
              description:
                "CSV, TSV, or JSON batch content. Columns match the brand token fields.",
            },
          },
          required: ["source"],
          additionalProperties: false,
        },
      },
    ],
  };
}

function brandTokensSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: brandTokenProperties(),
    required: ["name"],
    additionalProperties: false,
  };
}

function brandTokenProperties(): Record<string, unknown> {
  return {
    name: { type: "string", minLength: 1, maxLength: 120 },
    description: { type: "string", maxLength: 260 },
    font: { type: "string", default: "Inter" },
    radius: { type: "number", minimum: 0, maximum: 64 },
    primary: { type: "string", pattern: "^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$" },
    secondary: {
      type: "string",
      pattern: "^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$",
    },
    accent: { type: "string", pattern: "^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$" },
    background: {
      type: "string",
      pattern: "^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$",
    },
    foreground: {
      type: "string",
      pattern: "^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$",
    },
    mode: { type: "string", enum: ["light", "dark"] },
    theme: { type: "string", enum: THEMES },
    logoSource: { type: "string", enum: LOGO_SOURCES },
    logoDataUri: {
      type: "string",
      description:
        "Optional base64 image data URI for uploaded logos. Keep under 1.5 MB.",
    },
    logoShape: { type: "string", enum: LOGO_SHAPES },
    logoStyle: { type: "string", enum: LOGO_STYLES },
    metaGradient: { type: "string", enum: META_GRADIENTS },
    metaPattern: { type: "string", enum: META_PATTERNS },
    metaPatternScale: { type: "number", minimum: 16, maximum: 96 },
    metaIntensity: { type: "number", minimum: 0, maximum: 100 },
    metaLayout: { type: "string", enum: META_LAYOUTS },
  };
}
