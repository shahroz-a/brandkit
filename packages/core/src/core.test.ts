import { describe, expect, it } from "vitest";
import { generateBrandAssets, normalizeBrandTokens, parseBatchInput, renderOpenGraphSvg, validateBrandTokens } from ".";

describe("BrandKit core", () => {
  it("normalizes partial tokens deterministically", () => {
    expect(normalizeBrandTokens({ name: "  Acme  ", primary: "2563eb" })).toMatchObject({
      name: "Acme",
      primary: "#2563EB"
    });
  });

  it("generates the core asset set", () => {
    const assets = generateBrandAssets({ name: "Acme Studio" });
    expect(assets.some((asset) => asset.filename === "og-image.svg")).toBe(true);
    expect(assets.some((asset) => asset.filename === "site.webmanifest")).toBe(true);
    expect(assets.length).toBeGreaterThan(20);
  });

  it("renders SVG font attributes without unescaped double quotes", () => {
    const svg = renderOpenGraphSvg({ name: "Acme Studio", font: "Inter" });
    expect(svg).toContain("font-family=\"Inter, Inter");
    expect(svg).not.toContain("\"Segoe UI\"");
  });

  it("reports invalid source colors", () => {
    const report = validateBrandTokens({ name: "Acme", primary: "not-a-color" });
    expect(report.ok).toBe(false);
  });

  it("parses CSV batch rows", () => {
    const result = parseBatchInput("name,primary\nAcme,#2563EB");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.name).toBe("Acme");
  });
});
