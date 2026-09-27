// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

export function cx(...classes: Array<string | false | null | undefined | 0>): string {
  return classes.filter(Boolean).join(" ");
}
