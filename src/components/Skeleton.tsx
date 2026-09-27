// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import styles from "./Skeleton.module.css";
import { cx } from "../internal/cx.js";

export type SkeletonVariant = "text" | "block" | "circle";

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  animated?: boolean;
  fullWidth?: boolean;
}

type SkeletonStyle = CSSProperties & {
  "--_zircon-skeleton-inline-size"?: string;
  "--_zircon-skeleton-block-size"?: string;
  "--_zircon-skeleton-radius-override"?: string;
};

const variants: Record<SkeletonVariant, string> = {
  text: styles.variantText,
  block: styles.variantBlock,
  circle: styles.variantCircle,
};

function toCssSize(value?: string | number) {
  return typeof value === "number" ? `${value}px` : value;
}

export function Skeleton(incomingProps: SkeletonProps) {
  const {
    children: _children,
    className,
    style,
    variant = "text",
    width,
    height,
    radius,
    animated = true,
    fullWidth = false,
    "aria-hidden": ariaHidden,
    ...props
  } = incomingProps as SkeletonProps & { children?: ReactNode };
  const widthValue = toCssSize(width);
  const heightValue = toCssSize(height);
  const radiusValue = toCssSize(radius);
  const skeletonStyle: SkeletonStyle = {
    ...style,
    ...(widthValue !== undefined ? { "--_zircon-skeleton-inline-size": widthValue } : null),
    ...(heightValue !== undefined ? { "--_zircon-skeleton-block-size": heightValue } : null),
    ...(radiusValue !== undefined ? { "--_zircon-skeleton-radius-override": radiusValue } : null),
  };

  return (
    <div
      {...props}
      aria-hidden={ariaHidden ?? true}
      className={cx(
        styles.root,
        variants[variant],
        animated && styles.animated,
        fullWidth && width === undefined && styles.fullWidth,
        className,
      )}
      style={skeletonStyle}
    />
  );
}
