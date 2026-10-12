// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import type { Ref, RefCallback, RefObject } from "react";

type RefCleanup = () => void;

export function composeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (value) => {
    const cleanupCallbacks: RefCleanup[] = [];
    const objectRefs: Array<RefObject<T | null>> = [];
    const callbacksWithoutCleanup: Array<(value: T | null) => void> = [];

    for (const ref of refs) {
      if (!ref) continue;

      if (typeof ref === "function") {
        const cleanup = ref(value);
        if (value !== null && typeof cleanup === "function") {
          cleanupCallbacks.push(cleanup);
        } else if (value !== null) {
          callbacksWithoutCleanup.push(ref);
        }
        continue;
      }

      ref.current = value;
      if (value !== null) objectRefs.push(ref);
    }

    if (value === null) return;

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
      objectRefs.forEach((ref) => { ref.current = null; });
      callbacksWithoutCleanup.forEach((ref) => ref(null));
    };
  };
}
