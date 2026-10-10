# Zircon Primitives

`@zircon-labs/primitives` provides small, reusable React UI primitives. Version
`0.1.0-beta.1` is published. This checkout prepares `0.1.0-beta.2`, including
Drawer; beta.2 has not been published and requires separate authorization.

The current package exports `Button`, `Divider`, `Input`, and `Skeleton`. React
19 is required as a peer dependency.

Install the existing prerelease with
`pnpm add @zircon-labs/primitives@0.1.0-beta.1` and import the root components and
stylesheet:

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

## Drawer (prepared for beta.2)

Drawer is available only from the dedicated client entry:

```tsx
"use client";

import { Drawer, type DrawerProps, type DrawerSide, type DrawerSize } from "@zircon-labs/primitives/drawer";
import "@zircon-labs/primitives/styles.css";
```

`open`, `onOpenChange`, `title`, `closeLabel`, and `children` are required.
`description` and `footer` are optional content slots. The app owns open state
and responds to close requests. `side` is `right` (default), `left`, `top`, or
`bottom`; these are physical sides, including in RTL. `size` is `sm`, `md`
(default), `lg`, or `full`. The React 19 `ref` targets the native
`HTMLDialogElement`.

Drawer opens with `showModal()` after mounting. Escape prevents the native
`cancel` default and requests `onOpenChange(false)`; the close button also only
requests controlled state. Native `close` events synchronize an external close.
The browser owns modal focus, top-layer placement, and focus restoration. The
close button has autofocus. SSR renders a closed dialog even when `open` is
true; the effect opens it after mounting. Header and footer remain outside the
scrolling body, with viewport limits and safe-area padding.

There is no Portal, custom focus trap, backdrop-click dismissal, animation,
global scroll lock, or coordination of simultaneous blocking overlays.

### Queued native close events

This promotion fixes an inherited single-flag suppression bug: several
controlled close/reopen cycles could let a queued internal `close` event request
`onOpenChange(false)` on the current opening. Drawer now counts effective internal
closes per instance and consumes their queued events once, including StrictMode
cleanup. Closing an already closed dialog does not add a pending operation, and
a subsequent genuine external close still notifies the consumer. Regression
tests cover pending events, unmount/remount, and independent instances. The
component adds no timers; real-browser visual and focus validation remains
separate.

### Drawer tokens and adapter channels

At every property site the precedence is public override, internal adapter
channel, then standalone fallback. Neither public tokens nor adapter channels
are assigned defaults on the dialog, so inherited overrides remain usable.
The stable root marker is `data-zircon-drawer`; internal adapter channels are
reserved for styling integrations, not general consumer customization.

| Public token | Reserved adapter channel | Standalone fallback |
| --- | --- | --- |
| `--zircon-drawer-size-sm` | `--_zircon-drawer-adapter-size-sm` | `20rem` |
| `--zircon-drawer-size-md` | `--_zircon-drawer-adapter-size-md` | `28rem` |
| `--zircon-drawer-size-lg` | `--_zircon-drawer-adapter-size-lg` | `40rem` |
| `--zircon-drawer-bg` | `--_zircon-drawer-adapter-bg` | `#ffffff` |
| `--zircon-drawer-color` | `--_zircon-drawer-adapter-color` | `#0f172a` |
| `--zircon-drawer-shadow` | `--_zircon-drawer-adapter-shadow` | Inward `24px` offset by side, `48px` blur, `rgb(15 23 42 / 0.18)` |
| `--zircon-drawer-border` | `--_zircon-drawer-adapter-border` | `rgb(226 232 240)` |
| `--zircon-drawer-header-border` | `--_zircon-drawer-adapter-header-border` | `rgb(226 232 240)` |
| `--zircon-drawer-footer-border` | `--_zircon-drawer-adapter-footer-border` | `rgb(226 232 240)` |
| `--zircon-drawer-backdrop` | `--_zircon-drawer-adapter-backdrop` | `rgb(15 23 42 / 0.48)` |
| `--zircon-drawer-header-padding` | `--_zircon-drawer-adapter-header-padding` | `1rem` |
| `--zircon-drawer-body-padding` | `--_zircon-drawer-adapter-body-padding` | `1rem` |
| `--zircon-drawer-footer-padding` | `--_zircon-drawer-adapter-footer-padding` | `1rem` |
| `--zircon-drawer-header-gap` | `--_zircon-drawer-adapter-header-gap` | `0.75rem` |
| `--zircon-drawer-title-font-size` | `--_zircon-drawer-adapter-title-font-size` | `1.125rem` |
| `--zircon-drawer-title-font-weight` | `--_zircon-drawer-adapter-title-font-weight` | `600` |
| `--zircon-drawer-description-gap` | `--_zircon-drawer-adapter-description-gap` | `0.25rem` |
| `--zircon-drawer-description-color` | `--_zircon-drawer-adapter-description-color` | `rgb(71 85 105)` |
| `--zircon-drawer-description-font-size` | `--_zircon-drawer-adapter-description-font-size` | `0.875rem` |
| `--zircon-drawer-close-radius` | `--_zircon-drawer-adapter-close-radius` | `0.375rem` |
| `--zircon-drawer-close-hover-bg` | `--_zircon-drawer-adapter-close-hover-bg` | `rgb(241 245 249)` |
| `--zircon-drawer-focus-ring-color` | `--_zircon-drawer-adapter-focus-ring-color` | `#2563eb` |

For the header and footer borders only, the specific public token wins first,
then `--zircon-drawer-border`, then that part's adapter channel and fallback.
Exterior, header, and footer channels are deliberately independent. A styling
integration should resolve its channels on the dialog using the closest scope
and must not shadow inherited public overrides or duplicate Drawer geometry.

Private geometry variables `--_zircon-drawer-active-size` and
`--_zircon-drawer-safe-top`, `--_zircon-drawer-safe-right`,
`--_zircon-drawer-safe-bottom`, `--_zircon-drawer-safe-left` are implementation
details and must not be overridden.

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

Before the offline tarball consumer check, a separate preparation step obtains
the exact public consumer prerequisites and their registry metadata from
`https://registry.npmjs.org/`, with scripts disabled, empty temporary npm
configuration, and authentication variables removed. Both consumer installations
then remain fully offline, using the local tarball; an offline failure never
triggers a network fallback. Testing a published version is a separate step
after an explicitly authorized release.

### Manual Drawer verification

Use a temporary React 19 consumer of the packed package with a controlled Drawer,
the `/drawer` import, and `styles.css`. Serve that consumer with the existing Vite
toolchain (`pnpm exec vite <consumer-directory> --host 127.0.0.1`). No browser
automation dependency is required.

In a real browser: focus the trigger and open; check the close button focus,
`dialog:modal`, top-layer visibility, and Tab/Shift+Tab. Close by button, Escape,
footer, and controlled state and check return focus. Exercise all sides and sizes
in LTR/RTL, long body content with fixed header/footer, small viewports and real
safe-area insets. Test inherited overrides and distinct exterior/header/footer
adapter border values. jsdom tests do not establish focus, layout, or visual
correctness; record those results separately.

The package manifest is prepared for public distribution; preparing or merging
these changes does not publish it. Publication requires separate, explicit
authorization.

## License

Original source code incorporated into this repository is licensed under the
Apache License 2.0, with initial copyright held by Jorge Guillermo Valle.
Third-party dependencies retain their own licenses and copyright notices.
