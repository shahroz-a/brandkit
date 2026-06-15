# CLI Guide

```bash
brandkit init
brandkit generate
brandkit export
brandkit build
brandkit sync
brandkit doctor
brandkit validate
brandkit batch brands.csv
brandkit mcp
```

## Commands

- `init` creates `brand.json`.
- `generate` writes the full asset suite to `brandkit-assets/`.
- `export` writes a ZIP archive to `brandkit-assets/`.
- `build` aliases `generate` for build pipelines.
- `sync` writes web-ready assets to `public/`.
- `doctor` validates tokens and scans for missing project assets.
- `validate` validates `brand.json`.
- `batch` generates one kit per CSV, TSV, or JSON row.
- `mcp` prints a JSON tool manifest for self-hosted MCP or LLM tool adapters.

## Batch CSV

```csv
name,description,primary,secondary,accent
Acme,Ship better software,#2563EB,#111827,#F97316
```

Optional columns include `logoSource`, `logoDataUri`, `logoShape`, `logoStyle`, `metaGradient`, `metaPattern`, `metaPatternScale`, `metaIntensity`, and `metaLayout`.

## LLM/MCP

```bash
brandkit mcp > brandkit-tools.json
```

Use the manifest with your own hosted adapter. BrandKit OS is local-first and does not provide a hosted MCP server, auth layer, storage, or public generation API.
