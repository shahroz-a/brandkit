# Architecture

BrandKit OS is a local-first monorepo.

## Boundaries

- `packages/core` owns deterministic token normalization, color math, SVG rendering, asset manifests, batch parsing, and validation.
- `packages/cli` owns filesystem scanning, writing assets, ZIP export, and command output.
- `apps/web` owns browser interactions, local storage, previews, import/export, and user interface state.
- `packages/sdk` exposes framework-agnostic functions.
- `packages/react` exposes React components that render core assets.
- `packages/templates` exposes the template authoring API.
- `packages/plugins` defines plugin contracts.

## Determinism

Core renderers avoid randomness, timestamps, network calls, environment-specific fonts, and remote assets. The same `brand.json` should produce the same SVG and JSON outputs on every machine.

## Data Flow

`brand.json` is the source of truth. The web app stores the same token shape in local storage. CLI and SDK calls normalize tokens through `packages/core` before generation.

## Rendering

SVG is the canonical output format for generated visuals. Browser PNG export is a convenience layer built on top of rendered DOM/SVG previews.
