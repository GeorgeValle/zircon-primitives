// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

import { createElement, type Ref } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Button,
  Divider,
  Input,
  Skeleton,
  type ButtonProps,
  type InputProps,
} from "../src/index.js";

describe("Button", () => {
  it("defaults to a non-submitting primary medium button", () => {
    const markup = renderToStaticMarkup(createElement(Button, null, "Continue"));

    expect(markup).toMatch(/^<button /);
    expect(markup).toContain('type="button"');
    expect(markup).toContain("Continue");
  });

  it("forwards native attributes, className, style, and explicit type", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Button,
        {
          "aria-label": "Save changes",
          className: "consumer-button",
          "data-action": "save",
          disabled: true,
          size: "lg",
          style: { marginTop: 4 },
          type: "submit",
          variant: "danger",
        } as ButtonProps & { "data-action": string },
        "Save",
      ),
    );

    expect(markup).toContain('aria-label="Save changes"');
    expect(markup).toContain('data-action="save"');
    expect(markup).toContain('class="');
    expect(markup).toContain("consumer-button");
    expect(markup).toContain('style="margin-top:4px"');
    expect(markup).toContain('type="submit"');
    expect(markup).toContain('disabled=""');
  });
});

describe("Input", () => {
  it("associates a generated id with its label and links hint and error", () => {
    const markup = renderToStaticMarkup(
      createElement(Input, {
        error: "Enter a whole number",
        hint: "At least one",
        label: "Quantity",
      }),
    );
    const id = markup.match(/<input[^>]+id="([^"]+)"/)?.[1];

    expect(id).toBeTruthy();
    expect(markup).toContain(`for="${id}"`);
    expect(markup).toContain(`aria-describedby="${id}-hint ${id}-error"`);
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain(`id="${id}-hint"`);
    expect(markup).toContain(`id="${id}-error"`);
  });

  it("preserves an explicit id and combines caller descriptions without duplicates", () => {
    const markup = renderToStaticMarkup(
      createElement(Input, {
        "aria-describedby": "external field-hint",
        "aria-invalid": false,
        className: "consumer-input",
        hint: "Helpful text",
        id: "field",
        min: 1,
        style: { marginTop: 4 },
        type: "number",
      }),
    );

    expect(markup).toContain('id="field"');
    expect(markup).toContain('aria-describedby="external field-hint"');
    expect(markup).toContain('aria-invalid="false"');
    expect(markup).toContain('type="number"');
    expect(markup).toContain('min="1"');
    expect(markup).toContain("consumer-input");
    expect(markup).toContain('style="margin-top:4px"');
  });

  it("does not invent an id when no label or helper text needs association", () => {
    const markup = renderToStaticMarkup(
      createElement(Input, { "aria-label": "Search", "aria-describedby": "search-help" }),
    );

    expect(markup).toContain('aria-label="Search"');
    expect(markup).toContain('aria-describedby="search-help"');
    expect(markup).not.toContain(" id=");
  });

  it.each([
    "checkbox",
    "radio",
    "range",
    "file",
    "color",
    "date",
    "datetime-local",
    "month",
    "time",
    "week",
    "hidden",
    "button",
    "submit",
    "reset",
    "image",
  ] as const)(
    "renders %s inputs with native attributes and label, hint, error, and ARIA associations",
    (type) => {
      const markup = renderToStaticMarkup(
        createElement(Input, {
          error: "Input error",
          hint: "Input hint",
          label: `${type} choice`,
          name: "choice",
          type,
          value: "selected",
        }),
      );
      const id = markup.match(/<input[^>]+id="([^"]+)"/)?.[1];

      expect(markup).toContain(`type="${type}"`);
      expect(markup).toContain(`for="${id}"`);
      expect(markup).toContain('name="choice"');
      expect(markup).toContain('value="selected"');
      expect(markup).toContain(`aria-describedby="${id}-hint ${id}-error"`);
      expect(markup).toContain('aria-invalid="true"');
    },
  );

  it("keeps number as a styled text-field type and forwards native numeric attributes", () => {
    const markup = renderToStaticMarkup(
      createElement(Input, {
        label: "Quantity",
        max: 10,
        min: 1,
        step: 1,
        type: "number",
      }),
    );

    expect(markup).toContain('type="number"');
    expect(markup).toContain('min="1"');
    expect(markup).toContain('max="10"');
    expect(markup).toContain('step="1"');
    expect(markup).toContain("Quantity");
  });

  it.each([
    { label: "", hint: "", error: "" },
    { label: false, hint: false, error: false },
  ])("omits empty or false label and messages without marking invalid", (props) => {
    const markup = renderToStaticMarkup(createElement(Input, props));

    expect(markup).not.toContain("<label");
    expect(markup).not.toContain("-hint");
    expect(markup).not.toContain("-error");
    expect(markup).not.toContain("aria-describedby");
    expect(markup).not.toContain("aria-invalid");
  });
});

const buttonRef: Ref<HTMLButtonElement> = () => {};
createElement(Button, { ref: buttonRef });

// @ts-expect-error Input wraps a void element and does not accept children.
const inputWithChildren: InputProps = { children: "not supported" };
void inputWithChildren;

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
