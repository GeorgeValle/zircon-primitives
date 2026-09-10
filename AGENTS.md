# Public Contribution Rules

## Workspace

- Use pnpm for package management and scripts.
- Respect the exact pnpm version in `packageManager`.
- Work only within this repository.
- Keep every change small and directly relevant.
- Do not add speculative infrastructure or placeholder files.

## Public Boundary

- Keep the repository independently installable and buildable.
- Do not add private dependencies or private registry configuration.
- Do not add local paths or references to external workspaces.
- Do not add tokens, credentials, secrets, or `.npmrc` files.
- Do not document non-public repositories, packages, or processes.

## Package Contract

- Do not publish without explicit authorization.
- Do not add publish, release, or version automation prematurely.
- Do not invent exports, components, or other public APIs.
- Review licensing and provenance before adding code or assets.
- Do not attribute third-party work to this repository's copyright holder.
- Keep `sideEffects` accurate; reassess it before adding any CSS.

## Validation

- Run the relevant focused checks while developing.
- Run `pnpm check` before requesting review.
- Keep package verification independent of npm authentication.
- Confirm generated files and tarball contents remain allowlisted.

## Collaboration

- Write commit messages in English.
- Write pull request titles in English.
- Keep pull requests focused on one approved objective.
