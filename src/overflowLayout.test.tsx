/**
 * Regression: pages sliding sideways from page-level horizontal overflow.
 * Prefer overflow-x: clip (not hidden) so position:sticky result columns still work.
 *
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme";
import SecondaryCausesChecklist from "@/components/diabetes/SecondaryCausesChecklist";
import CkdQualifierField from "@/components/diabetes/CkdQualifierField";
import FrailtyLevelField from "@/components/diabetes/FrailtyLevelField";

describe("horizontal overflow guards", () => {
  afterEach(() => {
    cleanup();
  });
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
    expect(css).toMatch(/\.osteo-live-helper/);
    expect(css).toMatch(/osteo-live-pill/);
    expect(css).toMatch(/secondary-cause-row/);
    expect(css).toMatch(/secondary-cause-qualifier-/);
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

  it("keeps selected secondary-cause qualifier fields shrinkable (no 3-col overflow)", () => {
    render(
      <ThemeProvider>
        <SecondaryCausesChecklist
          flags={["Chronic PPI / anticonvulsants / heparin", "Hypogonadism / early menopause"]}
          onChange={() => undefined}
          qualifiers={{
            ppiOther: { agent: "ppi", status: "current", durationMonths: "24", highDosePpi: true },
            hypogonadism: {
              phenotype: "early_menopause",
              menopauseAgeYears: "38",
              menopauseOnset: "surgical",
            },
          }}
        />
      </ThemeProvider>,
    );
    const grid = screen.getByTestId("secondary-causes-grid");
    expect(grid.className).toMatch(/\bgrid-cols-1\b/);
    expect(grid.className).not.toMatch(/grid-cols-3/);
    const ppi = screen.getByTestId("secondary-cause-qualifier-ppi-other");
    expect(ppi.className).toMatch(/\bmin-w-0\b/);
    const hypo = screen.getByTestId("secondary-cause-qualifier-hypogonadism");
    expect(hypo.className).toMatch(/\bmin-w-0\b/);
    expect(screen.getByLabelText("Age at menopause (years)").className).toMatch(/\bmin-w-0\b/);
    const selectedRows = screen
      .getAllByTestId("secondary-cause-row")
      .filter((row) => row.getAttribute("data-selected") === "true");
    expect(selectedRows).toHaveLength(2);
    expect(selectedRows.every((row) => /\bsm:col-span-2\b/.test(row.className))).toBe(true);
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

  it("keeps the frailty CFS radio grid shrinkable and wraps long labels", () => {
    render(
      <ThemeProvider>
        <FrailtyLevelField value="unknown" onChange={() => undefined} />
      </ThemeProvider>,
    );
    const grid = screen.getByTestId("frailty-level-grid");
    expect(grid.className).toMatch(/\bgrid-cols-1\b/);
    expect(grid.className).toMatch(/\bmin-w-0\b/);
    expect(grid.className).not.toMatch(/grid-cols-3/);
    const long = screen.getByText("CFS 8 — Very severely frail");
    expect(long.className).toMatch(/leading-snug/);
    const icon = screen.getByTestId("frailty-cfs-icon-cfs_8");
    expect(icon.className).toMatch(/\bshrink-0\b/);
    expect(icon.className).toMatch(/\bsize-7\b/);
  });
});
