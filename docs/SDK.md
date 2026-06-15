# SDK Guide

```ts
import {
  generateBrandKit,
  generateOG,
  getBrandKitToolManifest,
} from "@brandkit/sdk";

const svg = generateOG({
  name: "BrandKit",
  description: "Open-source developer branding toolkit.",
  primary: "#2563EB",
  metaGradient: "aurora",
  metaPattern: "grid",
  metaLayout: "centered",
});

const kit = generateBrandKit({
  name: "BrandKit",
  logoSource: "generated",
  logoShape: "squircle",
  logoStyle: "spark",
});

const tools = getBrandKitToolManifest();
```

The SDK is framework agnostic and delegates deterministic work to `@brandkit/core`.
Use the tool manifest when building your own MCP or LLM adapter.
