# API Reference

## `@brandkit/core`

- `normalizeBrandTokens(input)`
- `generateBrandAssets(tokens)`
- `renderOpenGraphSvg(tokens, size)`
- `renderLogoSvg(tokens, variant)`
- `renderFaviconSvg(tokens, size)`
- `renderManifest(tokens)`
- `validateBrandTokens(tokens)`
- `parseBatchInput(raw)`
- `getBrandKitToolManifest()`

## `@brandkit/sdk`

- `generateOG(options)`
- `generateLogo(options, variant)`
- `generateFavicon(options, size)`
- `generateWebManifest(options)`
- `generateBrandKit(options)`
- `getBrandKitToolManifest()`

## `@brandkit/templates`

- `defineTemplate(template)`
- `renderTemplateAsset(template, context)`
- `includedTemplates`

## Extended Token Options

- `logoSource`: `generated` or `uploaded`
- `logoDataUri`: optional image data URI for uploaded logos
- `logoShape`: `squircle`, `circle`, `hex`, or `diamond`
- `logoStyle`: `spark`, `initials`, `monogram`, or `badge`
- `metaGradient`: `brand`, `aurora`, `mesh`, `radial`, `linear`, or `solid`
- `metaPattern`: `none`, `dots`, `grid`, `diagonal`, `waves`, or `plus`
- `metaPatternScale`: pattern size from `16` to `96`
- `metaIntensity`: finish intensity from `0` to `100`
- `metaLayout`: `classic`, `centered`, `split`, or `poster`
