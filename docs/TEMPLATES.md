# Template Guide

```ts
import { defineTemplate } from "@brandkit/templates";

export const launchTemplate = defineTemplate({
  id: "launch",
  name: "Launch",
  description: "High-contrast launch artwork.",
  platforms: ["OpenGraph"],
  render: ({ tokens, width, height }) => {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text>${tokens.name}</text></svg>`;
  }
});
```

Templates receive normalized tokens and a target size. They should be deterministic and avoid remote assets.
