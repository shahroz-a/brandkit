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

## Batch CSV

```csv
name,description,primary,secondary,accent
Acme,Ship better software,#2563EB,#111827,#F97316
```
