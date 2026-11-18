// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment jsdom
import { createRef, useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Checkbox, RadioGroup } from "../src/index.js";

afterEach(cleanup);

describe("Checkbox", () => {
  it("associates messages, forwards a ref and handles native uncontrolled changes", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    render(<Checkbox ref={ref} label="Include notes" hint="Optional" error="Please confirm" name="notes" defaultChecked onChange={onChange} aria-describedby="external" />);
    const checkbox = screen.getByRole("checkbox", { name: "Include notes" }) as HTMLInputElement;
    expect(ref.current).toBe(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(checkbox.getAttribute("aria-describedby")).toBe(`external ${screen.getByText("Optional").id} ${screen.getByText("Please confirm").id}`);
    expect(checkbox.getAttribute("aria-invalid")).toBe("true");
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
    expect(onChange).toHaveBeenCalledOnce();
  });
  it("supports controlled and disabled state", () => {
    function Example() { const [checked, setChecked] = useState(false); return <Checkbox label="Enabled" checked={checked} onChange={(event) => setChecked(event.target.checked)} />; }
    const { rerender } = render(<Example />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(input);
    expect(input.checked).toBe(true);
    rerender(<Checkbox label="Disabled" disabled />);
    expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(true);
  });
});

describe("RadioGroup", () => {
  const options = [{ value: "a", label: "Alpha", description: "First option" }, { value: "b", label: "Beta" }, { value: "c", label: "Unavailable", disabled: true }];
  it("keeps two groups and their descriptions independent", () => {
    const ref = createRef<HTMLFieldSetElement>();
    const onValueChange = vi.fn();
    render(<><RadioGroup ref={ref} name="first" label="First" hint="First hint" error="First error" options={options} defaultValue="a" onValueChange={onValueChange} /><RadioGroup name="second" label="Second" hint="Second hint" options={options} /></>);
    const first = screen.getByRole("group", { name: "First" });
    const second = screen.getByRole("group", { name: "Second" });
    expect(ref.current).toBe(first);
    expect(first.getAttribute("aria-describedby")).toBe(`${screen.getByText("First hint").id} ${screen.getByText("First error").id}`);
    const firstRadio = within(first).getByRole("radio", { name: "Alpha" }) as HTMLInputElement;
    const secondRadio = within(second).getByRole("radio", { name: "Alpha" }) as HTMLInputElement;
    expect(firstRadio.checked).toBe(true);
    expect(firstRadio.id).not.toBe(secondRadio.id);
    expect(firstRadio.getAttribute("aria-describedby")).toBe(within(first).getByText("First option").id);
    expect(secondRadio.getAttribute("aria-describedby")).toBe(within(second).getByText("First option").id);
    fireEvent.click(within(first).getByRole("radio", { name: "Beta" }));
    expect(onValueChange.mock.calls[0][0]).toBe("b");
    expect((within(first).getByRole("radio", { name: "Beta" }) as HTMLInputElement).checked).toBe(true);
    expect((within(first).getByRole("radio", { name: "Unavailable" }) as HTMLInputElement).disabled).toBe(true);
  });
  it("supports controlled selection and disabled fieldsets", () => {
    function Example() { const [value, setValue] = useState("a"); return <RadioGroup name="choice" options={options} value={value} onValueChange={setValue} />; }
    const { rerender } = render(<Example />);
    fireEvent.click(screen.getByRole("radio", { name: "Beta" }));
    expect((screen.getByRole("radio", { name: "Beta" }) as HTMLInputElement).checked).toBe(true);
    rerender(<RadioGroup name="choice" options={options} disabled />);
    expect((screen.getByRole("group") as HTMLFieldSetElement).disabled).toBe(true);
    expect((screen.getByRole("radio", { name: "Alpha" }) as HTMLInputElement).disabled).toBe(true);
  });
  it("preserves uncontrolled selection, focus, and IDs across reorder and insertion", () => {
    const a = { value: "a", label: "Alpha", description: "Alpha description" };
    const b = { value: "b", label: "Beta", description: "Beta description" };
    const inserted = { value: "new", label: "New" };
    const { rerender } = render(<RadioGroup name="choice" options={[a, b]} />);
    const radio = screen.getByRole("radio", { name: "Beta" }) as HTMLInputElement;
    fireEvent.click(radio);
    radio.focus();
    const id = radio.id;
    const descriptionId = radio.getAttribute("aria-describedby");

    for (const reordered of [[b, a], [inserted, b, a]]) {
      rerender(<RadioGroup name="choice" options={reordered} />);
      const current = screen.getByRole("radio", { name: "Beta" }) as HTMLInputElement;
      expect(current).toBe(radio);
      expect(current.checked).toBe(true);
      expect(document.activeElement).toBe(current);
      expect(current.id).toBe(id);
      expect(current.getAttribute("aria-describedby")).toBe(descriptionId);
      expect(screen.getByText("Beta description").id).toBe(descriptionId);
    }
  });
  it("associates radios with an external form for submission and validation", () => {
    render(<><form id="checkout" data-testid="checkout" /><RadioGroup form="checkout" name="choice" label="Choice" options={options} required /></>);
    const form = screen.getByTestId("checkout") as HTMLFormElement;
    const group = screen.getByRole("group", { name: "Choice" }) as HTMLFieldSetElement;
    const alpha = screen.getByRole("radio", { name: "Alpha" }) as HTMLInputElement;
    const beta = screen.getByRole("radio", { name: "Beta" }) as HTMLInputElement;
    expect(group.form).toBe(form);
    expect(alpha.form).toBe(form);
    expect(beta.form).toBe(form);
    expect(form.checkValidity()).toBe(false);
    expect(alpha.validity.valueMissing).toBe(true);
    expect(new FormData(form).has("choice")).toBe(false);
    fireEvent.click(beta);
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get("choice")).toBe("b");
  });
});
