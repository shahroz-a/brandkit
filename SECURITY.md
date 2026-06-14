# Security

BrandKit OS runs locally and does not require a backend, authentication, database, or paid API.

## Reporting

Please report security issues privately by opening a GitHub security advisory or emailing the maintainer listed on the repository profile.

Include:

- Affected package or workflow.
- Reproduction steps.
- Impact.
- Suggested mitigation, if known.

## Scope

Security-sensitive areas include:

- Importing JSON, CSV, SVG, and image files.
- ZIP generation and extraction workflows.
- Plugin execution.
- CLI filesystem writes.
- Browser export permissions.

BrandKit OS should treat community plugins and imported files as untrusted input.
