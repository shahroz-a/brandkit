import { renderOpenGraphSvg } from "@brandkit/core";
import type { BrandAsset, BrandTokens } from "@brandkit/core";

export interface TemplateContext {
  tokens: BrandTokens;
  width: number;
  height: number;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  render: (context: TemplateContext) => string;
}

export function defineTemplate(template: TemplateDefinition): TemplateDefinition {
  if (!template.id.trim()) {
    throw new Error("Template id is required.");
  }

  if (!template.name.trim()) {
    throw new Error("Template name is required.");
  }

  return template;
}

export function renderTemplateAsset(template: TemplateDefinition, context: TemplateContext): BrandAsset {
  return {
    id: template.id,
    name: template.name,
    filename: `${template.id}.svg`,
    category: "social",
    format: "svg",
    mimeType: "image/svg+xml",
    width: context.width,
    height: context.height,
    platform: template.platforms[0] ?? "Custom",
    content: template.render(context)
  };
}

export const includedTemplates = [
  defineTemplate({
    id: "modern-og",
    name: "Modern OG",
    description: "Balanced social image with strong mark, gradient field, and accessible typography.",
    platforms: ["OpenGraph", "Twitter", "LinkedIn"],
    render: ({ tokens, width, height }) => renderOpenGraphSvg(tokens, { width, height })
  }),
  defineTemplate({
    id: "minimal-card",
    name: "Minimal Card",
    description: "Quiet layout for docs, open-source repositories, and technical blogs.",
    platforms: ["OpenGraph", "GitHub", "Blog"],
    render: ({ tokens, width, height }) =>
      renderOpenGraphSvg({ ...tokens, theme: "minimal", background: "#FFFFFF", foreground: "#111827" }, { width, height })
  }),
  defineTemplate({
    id: "launch-banner",
    name: "Launch Banner",
    description: "High-contrast launch visual for product announcements and newsletters.",
    platforms: ["Product Hunt", "Newsletter", "YouTube"],
    render: ({ tokens, width, height }) =>
      renderOpenGraphSvg({ ...tokens, theme: "gradient", mode: "dark", background: "#0B1020", foreground: "#F8FAFC" }, { width, height })
  })
];

export type { BrandAsset, BrandTokens };
