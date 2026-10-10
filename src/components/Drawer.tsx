// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useEffect, useId, useRef, type ReactNode, type Ref, type SyntheticEvent } from "react";

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
  const composedRef = useRef({ ref, callback: composeRefs(dialogRef, ref) });
  if (composedRef.current.ref !== ref) {
    composedRef.current = { ref, callback: composeRefs(dialogRef, ref) };
  }

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

  const handleClose = () => {
    if (pendingInternalCloses.current > 0) {
      pendingInternalCloses.current -= 1;
      return;
    }
    if (open) onOpenChange(false);
  };

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={styles.drawer}
      data-zircon-drawer=""
      data-has-footer={footer ? "true" : "false"}
      data-side={side}
      data-size={size}
      onCancel={handleCancel}
      onClose={handleClose}
      ref={composedRef.current.callback}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title} id={titleId}>{title}</h2>
          {description ? <p className={styles.description} id={descriptionId}>{description}</p> : null}
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
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </dialog>
  );
}
