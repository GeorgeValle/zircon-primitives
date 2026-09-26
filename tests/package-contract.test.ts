// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Divider, Skeleton } from "../src/index.js";

describe("Divider", () => {
  it("renders native and explicit separator semantics", () => {
    expect(renderToStaticMarkup(createElement(Divider))).toMatch(/^<hr /);

    const vertical = renderToStaticMarkup(
      createElement(Divider, { orientation: "vertical" }),
    );
    expect(vertical).toContain('role="separator"');
    expect(vertical).toContain('aria-orientation="vertical"');

    const decorative = renderToStaticMarkup(createElement(Divider, { decorative: true }));
    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).not.toContain("role=");
  });

  it("renders consumer-owned labels", () => {
    const markup = renderToStaticMarkup(createElement(Divider, { label: "Section" }));
    expect(markup).toContain('role="separator"');
    expect(markup).toContain("Section");
    const labelId = markup.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(labelId).toBeTruthy();
    expect(markup).toContain(`id="${labelId}"`);

    const named = renderToStaticMarkup(
      createElement(Divider, { label: "Section", "aria-label": "Custom name" }),
    );
    expect(named).toContain('aria-label="Custom name"');
    expect(named).not.toContain("aria-labelledby=");
  });
});

describe("Skeleton", () => {
  it("is decorative by default and converts numeric dimensions to pixels", () => {
    const markup = renderToStaticMarkup(
      createElement(Skeleton, {
        animated: false,
        height: 16,
        variant: "block",
        width: 240,
      }),
    );
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("--_zircon-skeleton-inline-size:240px");
    expect(markup).toContain("--_zircon-skeleton-block-size:16px");
  });
});
