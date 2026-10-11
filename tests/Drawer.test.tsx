// SPDX-FileCopyrightText: 2026 Jorge Guillermo Valle
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef, startTransition, StrictMode, Suspense, useState } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Drawer } from "../src/drawer.js";
import styles from "../src/components/Drawer.module.css";

const css = readFileSync(resolve(import.meta.dirname, "../src/components/Drawer.module.css"), "utf8");
const readme = readFileSync(resolve(import.meta.dirname, "../README.md"), "utf8");
const descriptors = Object.getOwnPropertyDescriptors(HTMLDialogElement.prototype);
let tasks: Array<() => void>;
let showModal: ReturnType<typeof vi.fn>;
let close: ReturnType<typeof vi.fn>;

function flushCloseEvents(count = tasks.length) {
  act(() => {
    for (const task of tasks.splice(0, count)) task();
  });
}

beforeEach(() => {
  tasks = [];
  showModal = vi.fn(function (this: HTMLDialogElement) {
    if (!this.isConnected) throw new DOMException("Disconnected dialog", "InvalidStateError");
    this.setAttribute("open", "");
  });
  close = vi.fn(function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute("open");
    tasks.push(() => this.dispatchEvent(new Event("close", { bubbles: false })));
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: showModal });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: close });
});

afterEach(() => {
  cleanup();
  flushCloseEvents();
  for (const name of ["showModal", "close"]) {
    if (descriptors[name]) Object.defineProperty(HTMLDialogElement.prototype, name, descriptors[name]);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
  vi.restoreAllMocks();
});

const baseProps = {
  children: <p>Drawer body</p>,
  closeLabel: "Close drawer",
  onOpenChange: () => {},
  open: false,
  title: "Drawer title",
};

describe("Drawer native lifecycle", () => {
  it("renders a closed dialog with the stable adapter marker and presentation defaults", () => {
    const { container } = render(<Drawer {...baseProps} />);
    const dialog = container.querySelector("dialog")!;
    expect(dialog).toBeInstanceOf(HTMLDialogElement);
    expect(dialog.hasAttribute("data-zircon-drawer")).toBe(true);
    expect(dialog.dataset.side).toBe("right");
    expect(dialog.dataset.size).toBe("md");
    expect(dialog.dataset.hasFooter).toBe("false");
    expect(dialog.open).toBe(false);
    expect(showModal).not.toHaveBeenCalled();
  });

  it("labels the dialog with visible title and optional description", () => {
    const { container } = render(<Drawer {...baseProps} description="Context" open />);
    const dialog = container.querySelector("dialog")!;
    expect(dialog.getAttribute("aria-labelledby")).toBe(screen.getByText("Drawer title").id);
    expect(dialog.getAttribute("aria-describedby")).toBe(screen.getByText("Context").id);
    expect(screen.getByText("Drawer body")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close drawer" })).toBeTruthy();
    expect(renderToStaticMarkup(<Drawer {...baseProps} />)).toContain("autofocus=");
  });

  it.each(["Drawer title", 42, 0])("keeps title %s as an accessible level-two heading and dialog name", (title) => {
    render(<Drawer {...baseProps} title={title} open />);
    const heading = screen.getByRole("heading", { level: 2, name: String(title) });
    expect(heading.id).toBeTruthy();
    expect(screen.getByRole("dialog", { name: String(title) }).getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it.each(["h3", "div"] as const)("keeps a %s title inside its labelled container", (Block) => {
    const { container } = render(<Drawer {...baseProps} title={<Block>Details</Block>} open />);
    const title = container.querySelector(`.${styles.title}`)!;
    expect(title.tagName).toBe("DIV");
    expect(title.firstElementChild!.tagName).toBe(Block.toUpperCase());
    expect(title.textContent).toBe("Details");
    expect(title.id).toBeTruthy();
    expect(title.hasAttribute("role")).toBe(false);
    expect(title.hasAttribute("aria-level")).toBe(false);
    const headings = screen.queryAllByRole("heading");
    if (Block === "h3") {
      expect(headings).toEqual([screen.getByRole("heading", { level: 3, name: "Details" })]);
    } else {
      expect(headings).toHaveLength(0);
    }
    expect(screen.getByRole("dialog", { name: "Details" }).getAttribute("aria-labelledby")).toBe(title.id);
  });

  it("leaves heading semantics to a title fragment without inspecting its children", () => {
    const { container } = render(<Drawer {...baseProps} title={<><h3>Details</h3></>} open />);
    const title = container.querySelector(`.${styles.title}`)!;
    expect(title.hasAttribute("role")).toBe(false);
    expect(title.hasAttribute("aria-level")).toBe(false);
    expect(screen.getAllByRole("heading")).toEqual([screen.getByRole("heading", { level: 3, name: "Details" })]);
    expect(screen.getByRole("dialog", { name: "Details" }).getAttribute("aria-labelledby")).toBe(title.id);
  });

  it("omits optional anatomy and description references", () => {
    const { container } = render(<Drawer {...baseProps} />);
    expect(container.querySelector("dialog")!.hasAttribute("aria-describedby")).toBe(false);
    expect(container.querySelector("footer")).toBeNull();
  });

  it("renders numeric zero as description text and associates its ARIA id", () => {
    const { container } = render(<Drawer {...baseProps} description={0} open />);
    const description = screen.getByText("0");
    expect(description.tagName).toBe("DIV");
    expect(description.id).toBeTruthy();
    expect(container.querySelector("dialog")!.getAttribute("aria-describedby")).toBe(description.id);
  });

  it("renders numeric zero in the footer and marks the footer present", () => {
    const { container } = render(<Drawer {...baseProps} footer={0} />);
    expect(container.querySelector("footer")!.textContent).toBe("0");
    expect(container.querySelector("dialog")!.dataset.hasFooter).toBe("true");
  });

  it.each([null, undefined, false, true, ""])("omits absent optional slots for %s", (content) => {
    const { container } = render(<Drawer {...baseProps} description={content} footer={content} />);
    expect(container.querySelector(`.${styles.description}`)).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
    expect(container.querySelector("dialog")!.hasAttribute("aria-describedby")).toBe(false);
    expect(container.querySelector("dialog")!.dataset.hasFooter).toBe("false");
  });

  it.each([
    ["text", "Content"],
    ["element", <strong>Content</strong>],
  ] as const)("preserves %s in the optional slots", (_kind, content) => {
    const { container } = render(<Drawer {...baseProps} description={content} footer={content} />);
    const description = container.querySelector(`.${styles.description}`)!;
    expect(description.textContent).toBe("Content");
    expect(container.querySelector("footer")!.textContent).toBe("Content");
    expect(container.querySelector("dialog")!.getAttribute("aria-describedby")).toBe(description.id);
    expect(container.querySelector("dialog")!.dataset.hasFooter).toBe("true");
    if (_kind === "element") {
      expect(description.querySelector("strong")!.textContent).toBe("Content");
      expect(container.querySelector("footer strong")!.textContent).toBe("Content");
    }
  });

  it.each(["div", "p"] as const)("renders a %s description node with its ARIA association", (Block) => {
    const { container } = render(<Drawer {...baseProps} description={<Block>Rich description</Block>} open />);
    const description = container.querySelector(`.${styles.description}`)!;
    expect(description.tagName).toBe("DIV");
    expect(description.firstElementChild!.tagName).toBe(Block.toUpperCase());
    expect(description.textContent).toBe("Rich description");
    expect(description.id).toBeTruthy();
    expect(container.querySelector("dialog")!.getAttribute("aria-describedby")).toBe(description.id);
  });

  it("uses unique ids across instances", () => {
    const { container } = render(<><Drawer {...baseProps} /><Drawer {...baseProps} /></>);
    const ids = Array.from(container.querySelectorAll("dialog"), (dialog) => dialog.getAttribute("aria-labelledby"));
    expect(new Set(ids).size).toBe(2);
    expect(ids.every(Boolean)).toBe(true);
  });

  it("opens on transition and does not reopen on an unrelated render", () => {
    const { rerender } = render(<Drawer {...baseProps} />);
    rerender(<Drawer {...baseProps} open />);
    rerender(<Drawer {...baseProps} open title="Updated" />);
    expect(showModal).toHaveBeenCalledTimes(1);
  });

  it("requests controlled close from the button without calling close directly", () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Drawer {...baseProps} open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Close drawer" }));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(close).not.toHaveBeenCalled();
    expect(container.querySelector("dialog")!.open).toBe(true);
  });

  it("prevents native cancel and requests controlled close", () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Drawer {...baseProps} open onOpenChange={onOpenChange} />);
    const event = new Event("cancel", { bubbles: false, cancelable: true });
    expect(fireEvent(container.querySelector("dialog")!, event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(close).not.toHaveBeenCalled();
  });

  it("does not request duplicate close when controlled state closes", () => {
    const onOpenChange = vi.fn();
    const { container, rerender } = render(<Drawer {...baseProps} open onOpenChange={onOpenChange} />);
    rerender(<Drawer {...baseProps} onOpenChange={onOpenChange} />);
    expect(container.querySelector("dialog")!.open).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
    flushCloseEvents();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("reports an external close only when its queued native event is delivered", () => {
    const ref = createRef<HTMLDialogElement>();
    const onOpenChange = vi.fn();
    render(<Drawer {...baseProps} open ref={ref} onOpenChange={onOpenChange} />);
    act(() => ref.current!.close());
    expect(ref.current!.open).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
    flushCloseEvents();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    act(() => ref.current!.close());
    expect(tasks).toHaveLength(0);
  });

  it.each([0, 2])("ignores an old external close after reopening with %s internal closes pending", (internalCloses) => {
    const ref = createRef<HTMLDialogElement>();
    const onOpenChange = vi.fn();
    const props = { ...baseProps, open: true, ref, onOpenChange };
    const { rerender } = render(<Drawer {...props} />);
    for (let cycle = 0; cycle < internalCloses; cycle++) {
      rerender(<Drawer {...props} open={false} />);
      rerender(<Drawer {...props} />);
    }
    act(() => ref.current!.close());
    expect(ref.current!.open).toBe(false);
    rerender(<Drawer {...props} open={false} />);
    rerender(<Drawer {...props} />);
    expect(tasks).toHaveLength(internalCloses + 1);
    for (let event = 0; event <= internalCloses; event++) {
      flushCloseEvents(1);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(ref.current!.open).toBe(true);
    }
    act(() => ref.current!.close());
    expect(ref.current!.open).toBe(false);
    flushCloseEvents();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("ignores close events while controlled closed", () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Drawer {...baseProps} onOpenChange={onOpenChange} />);
    fireEvent(container.querySelector("dialog")!, new Event("close"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not close on backdrop-like clicks", () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Drawer {...baseProps} open onOpenChange={onOpenChange} />);
    fireEvent.click(container.querySelector("dialog")!);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not fall back to a non-modal dialog if showModal fails", () => {
    showModal.mockImplementation(() => { throw new DOMException("Failure", "InvalidStateError"); });
    const { container } = render(<Drawer {...baseProps} open />);
    expect(container.querySelector("dialog")!.open).toBe(false);
  });

  it("closes on unmount without requesting a controlled state change", () => {
    const onOpenChange = vi.fn();
    const ref = createRef<HTMLDialogElement>();
    const { unmount } = render(<Drawer {...baseProps} open ref={ref} onOpenChange={onOpenChange} />);
    const dialog = ref.current!;
    unmount();
    flushCloseEvents();
    expect(dialog.open).toBe(false);
    expect(ref.current).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not request false during StrictMode replay with queued native close", () => {
    const onOpenChange = vi.fn();
    const { container } = render(<StrictMode><Drawer {...baseProps} open onOpenChange={onOpenChange} /></StrictMode>);
    flushCloseEvents();
    expect(container.querySelector("dialog")!.open).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // Baseline reproduction: each queued internal close must be consumed independently.
  it("does not request false after two controlled close/reopen cycles before queued close delivery", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Drawer {...baseProps} open onOpenChange={onOpenChange} />);
    for (let cycle = 0; cycle < 2; cycle++) {
      rerender(<Drawer {...baseProps} onOpenChange={onOpenChange} />);
      rerender(<Drawer {...baseProps} open onOpenChange={onOpenChange} />);
    }
    flushCloseEvents();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("consumes several internal closes once and then reports a genuine external close", () => {
    const ref = createRef<HTMLDialogElement>();
    const onOpenChange = vi.fn();
    const props = { ...baseProps, open: true, ref, onOpenChange };
    const { rerender } = render(<Drawer {...props} />);
    for (let cycle = 0; cycle < 4; cycle++) {
      rerender(<Drawer {...props} open={false} />);
      rerender(<Drawer {...props} />);
    }
    expect(tasks).toHaveLength(4);
    for (let event = 0; event < 4; event++) {
      flushCloseEvents(1);
      expect(ref.current!.open).toBe(true);
      expect(onOpenChange).not.toHaveBeenCalled();
    }
    act(() => ref.current!.close());
    expect(tasks).toHaveLength(1);
    flushCloseEvents(1);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("reports an external close queued after still-pending internal closes", () => {
    const ref = createRef<HTMLDialogElement>();
    const onOpenChange = vi.fn();
    const props = { ...baseProps, open: true, ref, onOpenChange };
    const { rerender } = render(<Drawer {...props} />);
    for (let cycle = 0; cycle < 2; cycle++) {
      rerender(<Drawer {...props} open={false} />);
      rerender(<Drawer {...props} />);
    }
    act(() => ref.current!.close());
    expect(tasks).toHaveLength(3);
    flushCloseEvents(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    flushCloseEvents(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    flushCloseEvents(1);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("does not register a cleanup close for a dialog already closed externally", () => {
    const ref = createRef<HTMLDialogElement>();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Drawer {...baseProps} open ref={ref} onOpenChange={onOpenChange} />);
    act(() => ref.current!.close());
    rerender(<Drawer {...baseProps} ref={ref} onOpenChange={onOpenChange} />);
    expect(close).toHaveBeenCalledTimes(1);
    expect(tasks).toHaveLength(1);
    flushCloseEvents();
    expect(onOpenChange).not.toHaveBeenCalled();
    rerender(<Drawer {...baseProps} open ref={ref} onOpenChange={onOpenChange} />);
    act(() => ref.current!.close());
    flushCloseEvents();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("consumes StrictMode replay and controlled closes without hiding a later external close", () => {
    const ref = createRef<HTMLDialogElement>();
    const onOpenChange = vi.fn();
    const props = { ...baseProps, open: true, ref, onOpenChange };
    const { rerender } = render(<StrictMode><Drawer {...props} /></StrictMode>);
    for (let cycle = 0; cycle < 2; cycle++) {
      rerender(<StrictMode><Drawer {...props} open={false} /></StrictMode>);
      rerender(<StrictMode><Drawer {...props} /></StrictMode>);
    }
    expect(tasks).toHaveLength(3);
    flushCloseEvents();
    expect(ref.current!.open).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => ref.current!.close());
    flushCloseEvents();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("unmounts with pending closes without leaking into a new instance", () => {
    const previous = vi.fn();
    const props = { ...baseProps, open: true, onOpenChange: previous };
    const { rerender, unmount } = render(<StrictMode><Drawer {...props} /></StrictMode>);
    for (let cycle = 0; cycle < 2; cycle++) {
      rerender(<StrictMode><Drawer {...props} open={false} /></StrictMode>);
      rerender(<StrictMode><Drawer {...props} /></StrictMode>);
    }
    unmount();
    expect(tasks).toHaveLength(4);
    const ref = createRef<HTMLDialogElement>();
    const current = vi.fn();
    render(<Drawer {...baseProps} open ref={ref} onOpenChange={current} />);
    flushCloseEvents();
    expect(previous).not.toHaveBeenCalled();
    expect(current).not.toHaveBeenCalled();
    expect(ref.current!.open).toBe(true);
    act(() => ref.current!.close());
    flushCloseEvents();
    expect(current).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("keeps pending-close accounting independent between live instances", () => {
    const first = vi.fn();
    const second = vi.fn();
    const ref = createRef<HTMLDialogElement>();
    const pair = (open: boolean) => <>
      <Drawer {...baseProps} open={open} onOpenChange={first} />
      <Drawer {...baseProps} open ref={ref} onOpenChange={second} />
    </>;
    const { rerender } = render(pair(true));
    for (let cycle = 0; cycle < 2; cycle++) {
      rerender(pair(false));
      rerender(pair(true));
    }
    act(() => ref.current!.close());
    flushCloseEvents();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("keeps the footer after and outside the scrollable body", () => {
    const { container } = render(<Drawer {...baseProps} footer={<button>Done</button>} />);
    const body = container.querySelector(`.${styles.body}`)!;
    const footer = container.querySelector("footer")!;
    expect(body.contains(footer)).toBe(false);
    expect(body.nextElementSibling).toBe(footer);
    expect(container.querySelector("dialog")!.dataset.hasFooter).toBe("true");
  });

  it.each(["right", "left", "top", "bottom"] as const)("preserves physical side %s", (side) => {
    const { container } = render(<Drawer {...baseProps} side={side} />);
    expect(container.querySelector("dialog")!.dataset.side).toBe(side);
  });

  it.each(["sm", "md", "lg", "full"] as const)("preserves size %s", (size) => {
    const { container } = render(<Drawer {...baseProps} size={size} />);
    expect(container.querySelector("dialog")!.dataset.size).toBe(size);
  });
});

describe("Drawer refs and SSR", () => {
  it("keeps the committed ref intact after abandoning a transition that rendered Drawer with another ref", async () => {
    const disposeA = vi.fn();
    const disposeB = vi.fn();
    const refA = vi.fn((_dialog: HTMLDialogElement | null) => disposeA);
    const refB = vi.fn((_dialog: HTMLDialogElement | null) => disposeB);
    const attemptedB = vi.fn();
    const pending = new Promise<void>(() => {});

    function Body({ suspend }: { suspend: boolean }) {
      if (suspend) {
        attemptedB();
        throw pending;
      }
      return <p>Committed body</p>;
    }

    function Harness() {
      const [state, setState] = useState({ suspend: false, title: "Committed title" });
      return <>
        <button onClick={() => startTransition(() => setState({ suspend: true, title: "Pending title" }))}>Try B</button>
        <button onClick={() => setState({ suspend: false, title: "Urgent title" })}>Keep A</button>
        <Suspense fallback={<p>Pending fallback</p>}>
          <Drawer {...baseProps} open ref={state.suspend ? refB : refA} title={state.title}>
            <Body suspend={state.suspend} />
          </Drawer>
        </Suspense>
      </>;
    }

    const { container, unmount } = render(<Harness />);
    try {
      const dialog = container.querySelector("dialog")!;
      expect(refA).toHaveBeenCalledExactlyOnceWith(dialog);
      await act(async () => { fireEvent.click(screen.getByText("Try B")); });
      // Body is a descendant: reaching its render proves Drawer rendered with B.
      expect(attemptedB).toHaveBeenCalled();
      expect(refB).not.toHaveBeenCalled();
      expect(disposeA).not.toHaveBeenCalled();
      expect(container.querySelector("dialog")).toBe(dialog);
      expect(dialog.open).toBe(true);
      expect(screen.queryByText("Pending fallback")).toBeNull();
      expect(screen.getByText("Committed title")).toBeTruthy();

      await act(async () => { fireEvent.click(screen.getByText("Keep A")); });
      expect(screen.getByText("Urgent title")).toBeTruthy();
      expect(disposeA).not.toHaveBeenCalled();
      expect(refA).toHaveBeenCalledExactlyOnceWith(dialog);
      expect(refB).not.toHaveBeenCalled();
      expect(disposeB).not.toHaveBeenCalled();
      expect(container.querySelector("dialog")).toBe(dialog);
      expect(dialog.open).toBe(true);
    } finally {
      unmount();
    }
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(refB).not.toHaveBeenCalled();
    expect(disposeB).not.toHaveBeenCalled();
  });

  it("cleans a committed callback ref A, connects B, and cleans B on unmount", () => {
    const disposeA = vi.fn();
    const disposeB = vi.fn();
    const refA = vi.fn((_dialog: HTMLDialogElement | null) => disposeA);
    const refB = vi.fn((_dialog: HTMLDialogElement | null) => disposeB);
    const { container, rerender, unmount } = render(<Drawer {...baseProps} ref={refA} />);
    const dialog = container.querySelector("dialog")!;
    expect(refA).toHaveBeenCalledExactlyOnceWith(dialog);
    rerender(<Drawer {...baseProps} ref={refB} />);
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(refB).toHaveBeenCalledExactlyOnceWith(dialog);
    expect(disposeB).not.toHaveBeenCalled();
    unmount();
    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(disposeB).toHaveBeenCalledTimes(1);
  });

  it("keeps callback refs attached across unrelated renders and detaches with null", () => {
    const ref = vi.fn<(value: HTMLDialogElement | null) => void>();
    const { rerender, unmount } = render(<Drawer {...baseProps} ref={ref} />);
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDialogElement);
    rerender(<Drawer {...baseProps} ref={ref} title="Updated title" />);
    expect(ref).toHaveBeenCalledTimes(1);
    unmount();
    expect(ref).toHaveBeenLastCalledWith(null);
  });

  it("supports ref cleanup and ref replacement", () => {
    const dispose = vi.fn();
    const ref = vi.fn(() => dispose);
    const replacement = createRef<HTMLDialogElement>();
    const { rerender, unmount } = render(<Drawer {...baseProps} ref={ref} />);
    rerender(<Drawer {...baseProps} ref={replacement} />);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledTimes(1);
    expect(replacement.current).toBeInstanceOf(HTMLDialogElement);
    unmount();
    expect(replacement.current).toBeNull();
  });

  it("cleans callback refs in StrictMode", () => {
    const dispose = vi.fn();
    const ref = vi.fn(() => dispose);
    const { unmount } = render(<StrictMode><Drawer {...baseProps} ref={ref} /></StrictMode>);
    expect(ref).toHaveBeenCalledTimes(2);
    expect(dispose).toHaveBeenCalledTimes(1);
    unmount();
    expect(dispose).toHaveBeenCalledTimes(2);
  });

  it.each([false, true])("renders SSR open=%s without opening a dialog", (open) => {
    const markup = renderToStaticMarkup(<Drawer {...baseProps} open={open} description="Context" />);
    expect(markup).toContain("<dialog");
    expect(markup).toContain("aria-labelledby=");
    expect(markup).toContain("aria-describedby=");
    expect(markup).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/);
    expect(showModal).not.toHaveBeenCalled();
  });

  it.each(["h3", "div"] as const)("preserves a %s title through the HTML parser and hydration", async (Block) => {
    const element = <Drawer {...baseProps} title={<Block data-title-block="">Details</Block>} />;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const recoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error");
    const consoleWarn = vi.spyOn(console, "warn");
    let root: Root | undefined;

    try {
      container.innerHTML = renderToString(element);
      const dialog = container.querySelector("dialog")!;
      const title = container.querySelector(`.${styles.title}`)!;
      const block = container.querySelector("[data-title-block]")!;
      const titleId = title.id;
      expect(titleId).toBeTruthy();
      expect(dialog.getAttribute("aria-labelledby")).toBe(titleId);
      expect(title.contains(block)).toBe(true);
      expect(block.tagName).toBe(Block.toUpperCase());
      expect(title.textContent).toBe("Details");

      await act(async () => {
        root = hydrateRoot(container, element, { onRecoverableError: recoverableError });
      });
      expect(container.querySelector("dialog")).toBe(dialog);
      expect(container.querySelector(`.${styles.title}`)).toBe(title);
      expect(title.querySelector("[data-title-block]")).toBe(block);
      expect(title.id).toBe(titleId);
      expect(title.textContent).toBe("Details");
      expect(dialog.getAttribute("aria-labelledby")).toBe(titleId);
      expect(recoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
    } finally {
      try {
        if (root) await act(async () => { root!.unmount(); });
      } finally {
        container.remove();
        consoleError.mockRestore();
        consoleWarn.mockRestore();
      }
    }
  });

  it.each(["div", "p"] as const)("preserves a %s description through the HTML parser and hydration", async (Block) => {
    const element = <Drawer {...baseProps} description={<Block data-description-block="">Rich description</Block>} />;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const recoverableError = vi.fn();
    // Spies retain the original console output; any reported warning fails this test.
    const consoleError = vi.spyOn(console, "error");
    const consoleWarn = vi.spyOn(console, "warn");
    let root: Root | undefined;

    try {
      container.innerHTML = renderToString(element);
      const dialog = container.querySelector("dialog")!;
      const description = container.querySelector(`.${styles.description}`)!;
      const block = container.querySelector("[data-description-block]")!;
      const descriptionId = description.id;
      expect(descriptionId).toBeTruthy();
      expect(dialog.getAttribute("aria-describedby")).toBe(descriptionId);
      expect(description.contains(block)).toBe(true);
      expect(description.tagName).toBe("DIV");
      expect(block.tagName).toBe(Block.toUpperCase());
      expect(block.textContent).toBe("Rich description");

      await act(async () => {
        root = hydrateRoot(container, element, { onRecoverableError: recoverableError });
      });
      expect(container.querySelector(`.${styles.description}`)).toBe(description);
      expect(description.querySelector("[data-description-block]")).toBe(block);
      expect(description.id).toBe(descriptionId);
      expect(dialog.getAttribute("aria-describedby")).toBe(descriptionId);
      expect(recoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
    } finally {
      try {
        if (root) await act(async () => { root!.unmount(); });
      } finally {
        container.remove();
        consoleError.mockRestore();
        consoleWarn.mockRestore();
      }
    }
  });
});

describe("Drawer CSS contract (not browser layout evidence)", () => {
  const tokens = {
    "size-sm": "20rem",
    "size-md": "28rem",
    "size-lg": "40rem",
    bg: "#ffffff",
    color: "#0f172a",
    shadow: "var(--_zircon-drawer-shadow-fallback)",
    border: "rgb(226 232 240)",
    backdrop: "rgb(15 23 42 / 0.48)",
    "header-padding": "1rem",
    "body-padding": "1rem",
    "footer-padding": "1rem",
    "header-gap": "0.75rem",
    "title-font-size": "1.125rem",
    "title-font-weight": "600",
    "description-gap": "0.25rem",
    "description-color": "rgb(71 85 105)",
    "description-font-size": "0.875rem",
    "close-radius": "0.375rem",
    "close-hover-bg": "rgb(241 245 249)",
    "focus-ring-color": "#2563eb",
  };

  it.each(Object.entries(tokens))("preserves the %s public/adapted/default chain", (name, fallback) => {
    expect(css).toContain(`var(--zircon-drawer-${name}, var(--_zircon-drawer-adapter-${name}, ${fallback}))`);
    expect(readme).toContain(`--zircon-drawer-${name}`);
    expect(readme).toContain(`--_zircon-drawer-adapter-${name}`);
  });

  it.each(["header", "footer"])("keeps the %s border separate and override-first", (part) => {
    expect(css).toContain(`var(--zircon-drawer-${part}-border, var(--zircon-drawer-border, var(--_zircon-drawer-adapter-${part}-border, rgb(226 232 240))))`);
    expect(readme).toContain(`--zircon-drawer-${part}-border`);
    expect(readme).toContain(`--_zircon-drawer-adapter-${part}-border`);
  });

  it.each(["header", "body", "footer"])("maps %s safe-area padding to physical edges", (part) => {
    const rule = css.match(new RegExp(`\\.${part}\\s*{([^}]*)}`))?.[1];
    const padding = `var(--zircon-drawer-${part}-padding, var(--_zircon-drawer-adapter-${part}-padding, 1rem))`;
    expect(rule).toContain(`padding-left: calc(${padding} + var(--_zircon-drawer-safe-left));`);
    expect(rule).toContain(`padding-right: calc(${padding} + var(--_zircon-drawer-safe-right));`);
    expect(css).not.toMatch(/padding-inline(?:-(?:start|end))?\s*:/);
  });

  it.each([
    ["right", ".drawer", "-24px 0"],
    ["left", '.drawer[data-side="left"]', "24px 0"],
    ["top", '.drawer[data-side="top"]', "0 24px"],
    ["bottom", '.drawer[data-side="bottom"]', "0 -24px"],
  ])("orients the %s standalone shadow toward the page interior", (_side, selector, offset) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rule = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`))?.[1];
    expect(rule).toContain(`--_zircon-drawer-shadow-fallback: ${offset} 48px rgb(15 23 42 / 0.18);`);
  });

  it("keeps public shadow overrides ahead of adapter and directional defaults", () => {
    expect(css).toContain("box-shadow: var(--zircon-drawer-shadow, var(--_zircon-drawer-adapter-shadow, var(--_zircon-drawer-shadow-fallback)));");
    expect(css).not.toMatch(/--zircon-drawer-shadow\s*:/);
    expect(css.match(/box-shadow\s*:/g)).toHaveLength(1);
  });

  it("does not shadow inherited public or adapter values on the dialog", () => {
    expect(css).not.toMatch(/--zircon-drawer-[\w-]+\s*:/);
    expect(css).not.toMatch(/--_zircon-drawer-adapter-[\w-]+\s*:/);
    expect(css).not.toMatch(/--_?iu-|!important|:global|animation|transition/);
  });

  it("retains safe areas, native visibility, physical anchoring, and internal scrolling", () => {
    expect(css).toContain(".drawer:not([open]) { display: none; }");
    expect(css).toContain(".drawer[open] { display: flex; flex-direction: column; }");
    for (const edge of ["top", "right", "bottom", "left"]) {
      expect(css).toContain(`env(safe-area-inset-${edge}, 0px)`);
    }
    expect(css).toContain("min-block-size: 0;");
    expect(css).toContain("overflow: auto;");
    expect(css).toContain("100dvw");
    expect(css).toContain("100dvh");
    expect(css).toContain("left: 0;");
    expect(css).toContain("right: 0;");
  });
});
