// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

import styles from "./Input.module.css";
import { cx } from "../internal/cx.js";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

function hasContent(value: ReactNode) {
  return value !== undefined && value !== null && value !== false && value !== "";
}

export function Input(incomingProps: InputProps) {
  const {
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    children: _children,
    className,
    error,
    hint,
    id,
    label,
    ref,
    style,
    ...props
  } = incomingProps as InputProps & { children?: ReactNode };
  const hasLabel = hasContent(label);
  const hasHint = hasContent(hint);
  const hasError = hasContent(error);
  const generatedId = useId();
  const resolvedId = id ?? (hasLabel || hasHint || hasError ? generatedId : undefined);
  const hintId = hasHint && resolvedId !== undefined ? `${resolvedId}-hint` : undefined;
  const errorId = hasError && resolvedId !== undefined ? `${resolvedId}-error` : undefined;
  const describedBy = [
    ...(ariaDescribedBy?.split(/\s+/).filter(Boolean) ?? []),
    hintId,
    errorId,
  ]
    .filter(
      (value, index, values): value is string =>
        Boolean(value) && values.indexOf(value) === index,
    )
    .join(" ") || undefined;

  return (
    <div className={styles.field}>
      {hasLabel ? (
        <label className={styles.label} htmlFor={resolvedId}>
          {label}
        </label>
      ) : null}
      <input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={hasError ? true : ariaInvalid}
        className={cx(styles.control, className)}
        id={resolvedId}
        ref={ref}
        style={style}
      />
      {hasHint ? (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      ) : null}
      {hasError ? (
        <span className={styles.error} id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
