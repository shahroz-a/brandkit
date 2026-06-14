# Contributing

Thanks for helping shape BrandKit OS.

## Local Setup

```bash
npm install
npm run dev
```

Use Node 20.9 or newer. The repository includes pnpm workspace metadata, but npm workspaces are supported for contributors who do not have pnpm installed.

## Development Flow

1. Keep changes scoped to one behavior or package.
2. Add or update tests when changing deterministic generation, validation, or CLI output.
3. Run `npm run check` and `npm run test` before opening a pull request.
4. Include screenshots or exported sample assets for UI and renderer changes.

## Code Style

- Prefer deterministic pure functions in `packages/core`.
- Keep browser-only behavior in `apps/web`.
- Keep filesystem behavior in `packages/cli`.
- Avoid network calls in generation paths.
- Avoid placeholder code, dead code, and generated comments.

## Pull Requests

Every PR should include:

- What changed.
- Why it changed.
- How it was verified.
- Any compatibility notes for generated assets, CLI output, or package exports.
