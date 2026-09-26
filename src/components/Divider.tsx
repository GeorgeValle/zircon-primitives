// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import type { HTMLAttributes, ReactNode } from "react";

import styles from "./Divider.module.css";
import { cx } from "../internal/cx.js";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerVariant = "solid" | "dashed" | "dotted";
export type DividerTone = "subtle" | "neutral";
export type DividerSpacing = "none" | "sm" | "md" | "lg";

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
  tone?: DividerTone;
  spacing?: DividerSpacing;
  label?: ReactNode;
  decorative?: boolean;
}

const orientations: Record<DividerOrientation, string> = {
  horizontal: styles.orientationHorizontal,
  vertical: styles.orientationVertical,
};

const variants: Record<DividerVariant, string> = {
  solid: styles.variantSolid,
  dashed: styles.variantDashed,
  dotted: styles.variantDotted,
};

const tones: Record<DividerTone, string> = {
  subtle: styles.toneSubtle,
  neutral: styles.toneNeutral,
};

const spacings: Record<DividerSpacing, string> = {
  none: styles.spacingNone,
  sm: styles.spacingSm,
  md: styles.spacingMd,
  lg: styles.spacingLg,
};

export function Divider({
  className,
  decorative = false,
  label,
  orientation = "horizontal",
  spacing = "md",
  tone = "subtle",
  variant = "solid",
  ...props
}: DividerProps) {
  const rootClassName = cx(
    styles.root,
    orientations[orientation],
    variants[variant],
    tones[tone],
    spacings[spacing],
    className,
  );

  if (orientation === "horizontal" && label !== undefined && label !== null) {
    return (
      <div
        {...props}
        aria-hidden={decorative ? true : undefined}
        className={cx(rootClassName, styles.hasLabel)}
        role={decorative ? undefined : "separator"}
      >
        <span aria-hidden="true" className={styles.line} />
        <span className={styles.label}>{label}</span>
        <span aria-hidden="true" className={styles.line} />
      </div>
    );
  }

  if (orientation === "vertical") {
    return (
      <div
        {...props}
        aria-hidden={decorative ? true : undefined}
        aria-orientation={decorative ? undefined : "vertical"}
        className={rootClassName}
        role={decorative ? undefined : "separator"}
      />
    );
  }

  if (decorative) {
    return <div {...props} aria-hidden="true" className={rootClassName} />;
  }

  return <hr {...props} className={rootClassName} />;
}
