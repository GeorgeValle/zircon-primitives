// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { useId, type ChangeEvent, type FieldsetHTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "../internal/cx.js";
import styles from "./RadioGroup.module.css";

export type RadioGroupDensity = "comfortable" | "compact";
export type RadioGroupOrientation = "vertical" | "horizontal";
export interface RadioGroupOption { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }
export interface RadioGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange" | "disabled" | "children"> {
  name: string;
  options: RadioGroupOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  density?: RadioGroupDensity;
  orientation?: RadioGroupOrientation;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  fullWidth?: boolean;
  idPrefix?: string;
  ref?: Ref<HTMLFieldSetElement>;
}

export function RadioGroup({ className, defaultValue, density = "comfortable", disabled = false, error, form, fullWidth = false, hint, idPrefix, invalid = false, label, name, onValueChange, options, orientation = "vertical", required, value, ref, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, ...props }: RadioGroupProps) {
  const generatedId = useId();
  const prefix = idPrefix ?? generatedId;
  const hintId = hint ? `${prefix}-hint` : undefined;
  const errorId = error ? `${prefix}-error` : undefined;
  const describedBy = [...new Set([...(ariaDescribedBy?.split(/\s+/).filter(Boolean) ?? []), hintId, errorId].filter(Boolean))].join(" ") || undefined;
  const isInvalid = invalid || Boolean(error);
  return (
    <fieldset {...props} aria-describedby={describedBy} aria-invalid={ariaInvalid ?? (isInvalid ? true : undefined)} className={cx(styles.root, density === "compact" && styles.compact, fullWidth && styles.fullWidth, disabled && styles.disabled, isInvalid && styles.invalid, className)} disabled={disabled} form={form} ref={ref}>
      {label ? <legend className={styles.legend}>{label}{required ? <span aria-hidden="true" className={styles.required}> *</span> : null}</legend> : null}
      {hint ? <div className={styles.hint} id={hintId}>{hint}</div> : null}
      {error ? <div className={styles.error} id={errorId}>{error}</div> : null}
      <div className={cx(styles.options, orientation === "horizontal" && styles.horizontal)}>
        {options.map((option) => {
          const encodedValue = Array.from({ length: option.value.length }, (_, index) => option.value.charCodeAt(index).toString(16).padStart(4, "0")).join("");
          const optionId = `${prefix}-option-${encodedValue}`;
          const descriptionId = option.description ? `${optionId}-description` : undefined;
          return <label className={cx(styles.option, option.disabled && styles.disabled)} key={option.value}>
            <input {...(value !== undefined ? { checked: option.value === value } : { defaultChecked: option.value === defaultValue })} aria-describedby={descriptionId} aria-labelledby={`${optionId}-label`} aria-invalid={isInvalid ? true : undefined} className={styles.control} disabled={disabled || option.disabled} form={form} id={optionId} name={name} onChange={onValueChange ? (event) => { if (event.currentTarget.checked) onValueChange(event.currentTarget.value, event); } : undefined} required={required} type="radio" value={option.value} />
            <span className={styles.content}><span id={`${optionId}-label`}>{option.label}</span>{option.description ? <span className={styles.hint} id={descriptionId}>{option.description}</span> : null}</span>
          </label>;
        })}
      </div>
    </fieldset>
  );
}
