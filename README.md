# Zircon Primitives

`@zircon-labs/primitives` provides small, reusable React UI primitives. It is
not published to npm yet.

The current package exports `Divider` and `Skeleton`. React 19 is required as a
peer dependency.

```tsx
import { Divider, Skeleton } from "@zircon-labs/primitives";
import "@zircon-labs/primitives/styles.css";

<Skeleton variant="text" width="70%" />
<Divider label="Details" />
```

Divider labels are descriptive content. Put interactive elements such as links
and buttons outside the separator.

Import `styles.css` once at the application boundary. The stylesheet is
self-contained and does not require another Zircon package or theme.

For `Skeleton` with `variant="circle"`, either `width` or `height` sets its
diameter. When both are provided, `width` takes precedence. With no `width`,
`fullWidth` takes precedence over `height` and makes the circle as wide as its
container.

## CSS customization

Divider supports `--zircon-divider-color-subtle`,
`--zircon-divider-color-neutral`, `--zircon-divider-spacing-sm`,
`--zircon-divider-spacing-md`, `--zircon-divider-spacing-lg`,
`--zircon-divider-label-color`, `--zircon-divider-label-gap`, and
`--zircon-divider-label-font-size`.

Skeleton supports `--zircon-skeleton-background`,
`--zircon-skeleton-highlight`, `--zircon-skeleton-radius`,
`--zircon-skeleton-text-radius`, `--zircon-skeleton-text-height`,
`--zircon-skeleton-block-height`, `--zircon-skeleton-circle-size`,
`--zircon-skeleton-animation-duration`, and
`--zircon-skeleton-gradient-size`.

Set these variables on a parent or an individual component. Every variable has
a built-in fallback, so no additional token stylesheet is required.

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
