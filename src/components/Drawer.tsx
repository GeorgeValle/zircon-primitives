// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useEffect, useId, useMemo, useRef, type ReactNode, type Ref, type SyntheticEvent } from "react";

import styles from "./Drawer.module.css";
import { composeRefs } from "../internal/composeRefs.js";

export type DrawerSide = "right" | "left" | "top" | "bottom";
export type DrawerSize = "sm" | "md" | "lg" | "full";

export interface DrawerProps {
  children: ReactNode;
  closeLabel: string;
  description?: ReactNode;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  side?: DrawerSide;
  size?: DrawerSize;
  title: ReactNode;
  ref?: Ref<HTMLDialogElement>;
}

function hasContent(value: ReactNode) {
  return value !== null && value !== undefined && typeof value !== "boolean" && value !== "";
}

export function Drawer({
  children,
  closeLabel,
  description,
  footer,
  onOpenChange,
  open,
  ref,
  side = "right",
  size = "md",
  title,
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pendingInternalCloses = useRef(0);
  // Ref identity is an imperative contract: do not detach it on unrelated renders.
  const composedRef = useMemo(() => composeRefs(dialogRef, ref), [ref]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const closeInternally = () => {
      if (!dialog.open) return;
      dialog.close();
      // Native close events are queued; count only an effective open -> closed operation.
      if (!dialog.open) pendingInternalCloses.current += 1;
    };

    if (open && !dialog.open && dialog.isConnected) {
      try {
        dialog.showModal();
      } catch {
        // No non-modal fallback.
      }
    } else if (!open && dialog.open) {
      closeInternally();
    }

    return closeInternally;
  }, [open]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onOpenChange(false);
  };

  const handleClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (pendingInternalCloses.current > 0) {
      pendingInternalCloses.current -= 1;
      return;
    }
    if (open && !event.currentTarget.open) onOpenChange(false);
  };

  const hasDescription = hasContent(description);
  const hasFooter = hasContent(footer);
  const isPlainTitle = typeof title === "string" || typeof title === "number";

  return (
    <dialog
      aria-describedby={hasDescription ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={styles.drawer}
      data-zircon-drawer=""
      data-has-footer={hasFooter ? "true" : "false"}
      data-side={side}
      data-size={size}
      onCancel={handleCancel}
      onClose={handleClose}
      ref={composedRef}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <div className={styles.title} id={titleId} role={isPlainTitle ? "heading" : undefined} aria-level={isPlainTitle ? 2 : undefined}>{title}</div>
          {hasDescription ? <div className={styles.description} id={descriptionId}>{description}</div> : null}
        </div>
        <button
          aria-label={closeLabel}
          autoFocus
          className={styles.close}
          onClick={() => onOpenChange(false)}
          type="button"
        >×</button>
      </header>
      <div className={styles.body}>{children}</div>
      {hasFooter ? <footer className={styles.footer}>{footer}</footer> : null}
    </dialog>
  );
}
