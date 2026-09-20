/**
 * Regression: pages sliding sideways from page-level horizontal overflow.
 * Prefer overflow-x: clip (not hidden) so position:sticky result columns still work.
 *
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme";
import SecondaryCausesChecklist from "@/components/diabetes/SecondaryCausesChecklist";
import CkdQualifierField from "@/components/diabetes/CkdQualifierField";

describe("horizontal overflow guards", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  });

  it("clips page-level overflow-x on html/body without using hidden (sticky-safe)", () => {
    const css = readFileSync(resolve(import.meta.dirname, "styles.css"), "utf8");
    const htmlBlock = css.match(/html\s*\{[^}]+\}/)?.[0] ?? "";
    const bodyBlock = css.match(/body\s*\{[^}]+\}/)?.[0] ?? "";
    expect(htmlBlock).toMatch(/overflow-x:\s*clip/);
    expect(bodyBlock).toMatch(/overflow-x:\s*clip/);
    expect(htmlBlock).toMatch(/overscroll-behavior-x:\s*none/);
    expect(css).not.toMatch(/html\s*\{[^}]*overflow-x:\s*hidden/);
  });

  it("collapses the secondary-causes checklist to one column and wraps long labels", () => {
    render(
      <ThemeProvider>
        <SecondaryCausesChecklist flags={[]} onChange={() => undefined} />
      </ThemeProvider>,
    );
    const grid = screen.getByTestId("secondary-causes-grid");
    expect(grid.className).toMatch(/\bgrid-cols-1\b/);
    expect(grid.className).toMatch(/\bmin-w-0\b/);
    expect(grid.className).not.toMatch(/grid-cols-3/);
    const long = screen.getByText("Chronic PPI / anticonvulsants / heparin");
    expect(long.className).toMatch(/\bmin-w-0\b/);
    expect(long.className).toMatch(/break-words/);
  });

  it("keeps the CKD qualifier radio grid shrinkable", () => {
    render(
      <ThemeProvider>
        <CkdQualifierField value="unknown" onChange={() => undefined} />
      </ThemeProvider>,
    );
    const group = screen.getByRole("radiogroup");
    expect(group.className).toMatch(/\bgrid-cols-1\b/);
    expect(group.className).toMatch(/\bmin-w-0\b/);
    expect(group.className).not.toMatch(/grid-cols-3/);
  });
});
