# LLM and MCP Integration

BrandKit OS is local-first. It ships deterministic generation code and a tool manifest, not a hosted service. If you want an LLM to generate brand assets for users or teams, host an adapter around `@brandkit/core` or `@brandkit/sdk`.

## Tool Manifest

```bash
brandkit mcp > brandkit-tools.json
```

The manifest describes four tool surfaces:

- `brandkit_generate` - generate the full asset kit from tokens.
- `brandkit_render_meta_image` - render a single premium social image SVG.
- `brandkit_validate` - validate contrast, upload, and export readiness.
- `brandkit_batch` - parse CSV, TSV, or JSON rows for multiple kits.

## SDK Adapter

```ts
import {
  generateBrandKit,
  generateOG,
  getBrandKitToolManifest,
} from "@brandkit/sdk";

export const manifest = getBrandKitToolManifest();

export async function brandkitGenerate(input: Record<string, unknown>) {
  return generateBrandKit(input);
}

export async function brandkitRenderMetaImage(input: Record<string, unknown>) {
  const { width = 1200, height = 630, ...tokens } = input;
  return generateOG({
    ...tokens,
    width: Number(width),
    height: Number(height),
  });
}
```

## Hosting Notes

- Add your own auth, rate limits, storage, and audit logs.
- Keep uploaded logo data URIs small; large images inflate JSON and SVG payloads.
- Run `validateBrandTokens` before persisting LLM-generated tokens.
- Prefer SVG output in the adapter and convert to PNG in a worker if needed.
