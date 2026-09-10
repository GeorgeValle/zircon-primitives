// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";

import * as primitives from "../src/index.js";

describe("package entrypoint", () => {
  it("does not expose placeholder APIs", () => {
    expect(Object.keys(primitives)).toEqual([]);
  });
});
