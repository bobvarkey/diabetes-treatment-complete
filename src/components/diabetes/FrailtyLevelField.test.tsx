/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme";
import FrailtyLevelField from "./FrailtyLevelField";
import { CFS_FRAILTY_ICON_ATTRIBUTION } from "./CfsFrailtyIcon";
import { FRAILTY_LEVEL_IDS } from "./frailtyLevel";

describe("FrailtyLevelField CFS icons", () => {
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

  it("shows a compact Rockwood silhouette beside each CFS 1–9 option", () => {
    render(
      <ThemeProvider>
        <FrailtyLevelField value="unknown" onChange={() => undefined} />
      </ThemeProvider>,
    );

    for (const id of FRAILTY_LEVEL_IDS) {
      if (id === "unknown") {
        expect(screen.queryByTestId(`frailty-cfs-icon-${id}`)).toBeNull();
        continue;
      }
      const icon = screen.getByTestId(`frailty-cfs-icon-${id}`);
      expect(icon.className).toMatch(/\bsize-7\b/);
      expect(icon.className).toMatch(/\bshrink-0\b/);
      expect(icon.className).toMatch(/dark:bg-emerald-400/);
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("keeps Dalhousie attribution next to the checklist", () => {
    render(
      <ThemeProvider>
        <FrailtyLevelField value="cfs_5" onChange={() => undefined} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("frailty-cfs-attribution").textContent).toBe(
      CFS_FRAILTY_ICON_ATTRIBUTION,
    );
    expect(screen.getByRole("radio", { name: /CFS 5 — Mildly frail/i })).toBeTruthy();
  });
});
