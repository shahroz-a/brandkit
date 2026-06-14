import { renderFaviconSvg, renderLogoSvg, renderOpenGraphSvg } from "@brandkit/core";
import type { BrandTokens } from "@brandkit/core";
import type { CSSProperties, ImgHTMLAttributes } from "react";

export interface BrandPreviewProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  tokens: Partial<BrandTokens>;
  width?: number;
  height?: number;
}

export function OpenGraph(props: BrandPreviewProps) {
  const { tokens, width = 1200, height = 630, alt, style, ...rest } = props;
  return (
    <img
      {...rest}
      alt={alt ?? `${tokens.name ?? "Brand"} OpenGraph preview`}
      width={width}
      height={height}
      src={toDataUri(renderOpenGraphSvg(tokens, { width, height }))}
      style={previewStyle(style)}
    />
  );
}

export interface LogoMarkProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  tokens: Partial<BrandTokens>;
  variant?: "icon" | "horizontal" | "vertical";
}

export function LogoMark(props: LogoMarkProps) {
  const { tokens, variant = "icon", alt, style, ...rest } = props;
  return (
    <img
      {...rest}
      alt={alt ?? `${tokens.name ?? "Brand"} logo`}
      src={toDataUri(renderLogoSvg(tokens, variant))}
      style={previewStyle(style)}
    />
  );
}

export interface FaviconPreviewProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  tokens: Partial<BrandTokens>;
  size?: number;
}

export function FaviconPreview(props: FaviconPreviewProps) {
  const { tokens, size = 64, alt, style, ...rest } = props;
  return (
    <img
      {...rest}
      alt={alt ?? `${tokens.name ?? "Brand"} favicon`}
      width={size}
      height={size}
      src={toDataUri(renderFaviconSvg(tokens, size))}
      style={previewStyle(style)}
    />
  );
}

export function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function previewStyle(style: CSSProperties | undefined): CSSProperties {
  return {
    display: "block",
    maxWidth: "100%",
    height: "auto",
    ...style
  };
}

export type { BrandTokens };
