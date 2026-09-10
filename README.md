# Zircon Primitives

`@zircon-labs/primitives` is the foundation for public, reusable React UI
primitives. It is not published to npm and does not export any primitives yet.

## Development

Development and CI use Node.js 24.20.0 and pnpm 10.33.0 through Corepack.
These versions describe the build environment, not a runtime requirement for
future consumers.

```sh
corepack enable
pnpm install
pnpm check
```

Individual checks are available through `pnpm typecheck`, `pnpm build`,
`pnpm test`, and `pnpm verify:package`.

The package is marked `private` to guard against accidental publication. This
does not affect the public visibility of this repository. Publication requires
separate, explicit authorization and is not part of this foundation.

## License

Original source code incorporated into this repository is licensed under the
Apache License 2.0, with initial copyright held by Jorge Guillermo Valle.
Third-party dependencies retain their own licenses and copyright notices.
