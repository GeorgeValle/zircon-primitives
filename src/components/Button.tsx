// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import type { ButtonHTMLAttributes, Ref } from "react";

import styles from "./Button.module.css";
import { cx } from "../internal/cx.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
}

const variants: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
  danger: styles.variantDanger,
};

const sizes: Record<ButtonSize, string> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function Button({
  className,
  ref,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cx(styles.root, variants[variant], sizes[size], className)}
      ref={ref}
      type={type}
    />
  );
}
