# Plugin Author Guide

Plugins can add templates, themes, generators, validators, exporters, and CLI commands.

```ts
import { definePlugin } from "@brandkit/plugins";

export default definePlugin({
  name: "brandkit-plugin-example",
  version: "0.1.0",
  themes: [
    {
      id: "example",
      name: "Example",
      tokens: {
        primary: "#2563EB"
      }
    }
  ]
});
```

Plugins should treat imported files and user input as untrusted.
