import JSZip from "jszip";
import type { BrandAsset, BrandTokens } from "@brandkit/core";
import { slugify } from "@brandkit/core";

export function downloadText(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(filename, blob);
}

export async function downloadZip(tokens: BrandTokens, assets: BrandAsset[]): Promise<void> {
  const zip = new JSZip();
  assets.forEach((asset) => zip.file(asset.filename, asset.content));
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  downloadBlob(`${slugify(tokens.name)}-brandkit.zip`, blob);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
