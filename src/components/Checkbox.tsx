// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "../internal/cx.js";
import styles from "./Checkbox.module.css";

export type CheckboxDensity = "comfortable" | "compact";
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  density?: CheckboxDensity;
  invalid?: boolean;
  fullWidth?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({ className, density = "comfortable", error, fullWidth = false, hint, id, invalid = false, label, ref, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, ...props }: CheckboxProps) {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;
  const hintId = hint ? `${resolvedId}-hint` : undefined;
  const errorId = error ? `${resolvedId}-error` : undefined;
  const describedBy = [...new Set([...(ariaDescribedBy?.split(/\s+/).filter(Boolean) ?? []), hintId, errorId].filter(Boolean))].join(" ") || undefined;
  const isInvalid = invalid || Boolean(error);
  return (
    <span className={cx(styles.root, density === "compact" && styles.compact, fullWidth && styles.fullWidth, isInvalid && styles.invalid, props.disabled && styles.disabled, className)}>
      <label className={styles.label}>
        <input {...props} aria-describedby={describedBy} aria-invalid={ariaInvalid ?? (isInvalid ? true : undefined)} className={styles.control} id={resolvedId} ref={ref} type="checkbox" />
        {label ? <span>{label}</span> : null}
      </label>
      {hint ? <span className={styles.hint} id={hintId}>{hint}</span> : null}
      {error ? <span className={styles.error} id={errorId}>{error}</span> : null}
    </span>
  );
}
