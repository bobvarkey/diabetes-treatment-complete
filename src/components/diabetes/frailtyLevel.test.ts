import { describe, expect, it } from "vitest";
import {
  FRAILTY_LEVEL_OPTIONS,
  combineFallsAndFrailty,
  frailtyLevelReviewed,
  frailtyLevelSetsFallsScenario,
  normalizeFrailtyLevel,
  triStateFromFrailtyLevel,
} from "./frailtyLevel";

describe("frailtyLevel mapping", () => {
  it("unknown does not force the coarse algorithm flag", () => {
    expect(triStateFromFrailtyLevel("unknown")).toBeNull();
    expect(triStateFromFrailtyLevel(undefined)).toBeNull();
    expect(frailtyLevelReviewed("unknown")).toBe(false);
    expect(frailtyLevelSetsFallsScenario("unknown")).toBe(false);
  });

  it("CFS 1–4 (not frail) map to no", () => {
    for (const id of ["cfs_1", "cfs_2", "cfs_3", "cfs_4"] as const) {
      expect(triStateFromFrailtyLevel(id)).toBe("no");
      expect(frailtyLevelSetsFallsScenario(id)).toBe(false);
      expect(frailtyLevelReviewed(id)).toBe(true);
    }
  });

  it("CFS 5–9 (frail through terminally ill) map to yes", () => {
    for (const id of ["cfs_5", "cfs_6", "cfs_7", "cfs_8", "cfs_9"] as const) {
      expect(triStateFromFrailtyLevel(id)).toBe("yes");
      expect(frailtyLevelSetsFallsScenario(id)).toBe(true);
    }
  });

  it("lists all CFS 1–9 levels plus unknown", () => {
    expect(FRAILTY_LEVEL_OPTIONS.map((o) => o.id)).toEqual([
      "unknown",
      "cfs_1",
      "cfs_2",
      "cfs_3",
      "cfs_4",
      "cfs_5",
      "cfs_6",
      "cfs_7",
      "cfs_8",
      "cfs_9",
    ]);
  });

  it("normalises unknown junk to unknown", () => {
    expect(normalizeFrailtyLevel("fried_positive")).toBe("unknown");
    expect(normalizeFrailtyLevel("mild")).toBe("unknown");
    expect(normalizeFrailtyLevel(null)).toBe("unknown");
  });

  it("combines CFS with documented falls without clearing a falls yes", () => {
    expect(combineFallsAndFrailty("unknown", "unknown")).toBe("unknown");
    expect(combineFallsAndFrailty("unknown", "cfs_2")).toBe("no");
    expect(combineFallsAndFrailty("unknown", "cfs_6")).toBe("yes");
    expect(combineFallsAndFrailty("no", "cfs_6")).toBe("yes");
    expect(combineFallsAndFrailty("yes", "cfs_1")).toBe("yes");
    expect(combineFallsAndFrailty("no", "cfs_1")).toBe("no");
    expect(combineFallsAndFrailty("unknown", "cfs_4")).toBe("no");
  });
});
