# Zircon Primitives

`@zircon-labs/primitives` provides small, reusable React UI primitives. It is
not published to npm yet.

The current package exports `Button`, `Divider`, `Input`, and `Skeleton`. React
19 is required as a peer dependency.

```tsx
import { Button, Divider, Input, Skeleton } from "@zircon-labs/primitives";
import "@zircon-labs/primitives/styles.css";

<Button variant="secondary" size="sm">Continue</Button>
<Input label="Email" type="email" hint="Use your account email" />
<Skeleton variant="text" width="70%" />
<Divider label="Details" />
```

`Button` supports `primary`, `secondary`, `ghost`, and `danger` variants and
`xs`, `sm`, `md`, and `lg` sizes. It defaults to a primary, medium button with
`type="button"`; native button attributes, `className`, `style`, and React 19
`ref` are forwarded to the button element.

`Input` forwards native input attributes, `className`, `style`, and React 19
`ref` to its input element. A provided `label` is associated with the input; an
`id` is generated when a label, hint, or error needs an association and no `id`
was supplied. Hint and error descriptions are combined with a consumer-provided
`aria-describedby`, and an error sets `aria-invalid`.

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

Button supports `--zircon-button-radius`, `--zircon-button-gap`,
`--zircon-button-transition`, `--zircon-button-focus-ring`,
`--zircon-button-disabled-opacity`, `--zircon-button-padding-xs`,
`--zircon-button-padding-sm`, `--zircon-button-padding-md`,
`--zircon-button-padding-lg`, `--zircon-button-primary-background`,
`--zircon-button-primary-color`, `--zircon-button-primary-background-hover`,
`--zircon-button-secondary-background`, `--zircon-button-secondary-border`,
`--zircon-button-secondary-color`,
`--zircon-button-secondary-background-hover`, `--zircon-button-ghost-color`,
`--zircon-button-ghost-background-hover`, `--zircon-button-danger-background`,
`--zircon-button-danger-color`, and
`--zircon-button-danger-background-hover`.

Input supports `--zircon-input-gap`, `--zircon-input-label-color`,
`--zircon-input-label-font-size`, `--zircon-input-background`,
`--zircon-input-border`, `--zircon-input-radius`, `--zircon-input-color`,
`--zircon-input-min-block-size`, `--zircon-input-padding`,
`--zircon-input-transition`, `--zircon-input-placeholder-color`,
`--zircon-input-focus-border`, `--zircon-input-focus-ring`,
`--zircon-input-disabled-background`, `--zircon-input-disabled-opacity`,
`--zircon-input-error-border`, `--zircon-input-message-font-size`,
`--zircon-input-hint-color`, and `--zircon-input-error-color`. Field styles apply
when `type` is omitted (the browser default is `text`) and for `text`, `email`,
`password`, `search`, `tel`, `url`, and `number`. Number inputs retain native
browser controls, including increment controls where available. Other input
types retain their native presentation.

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
