# SDK Guide

```ts
import { generateBrandKit, generateOG } from "@brandkit/sdk";

const svg = generateOG({
  name: "BrandKit",
  description: "Open-source developer branding toolkit.",
  primary: "#2563EB"
});

const kit = generateBrandKit({
  name: "BrandKit"
});
```

The SDK is framework agnostic and delegates deterministic work to `@brandkit/core`.
