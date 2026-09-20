import { describe, expect, it } from "vitest";
import {
  ckdQualifierReviewed,
  ckdQualifierSetsAdvancedScenario,
  normalizeCkdQualifier,
  triStateFromCkdQualifier,
} from "./ckdQualifier";

describe("ckdQualifier mapping", () => {
  it("unknown does not force the coarse algorithm flag", () => {
    expect(triStateFromCkdQualifier("unknown")).toBeNull();
    expect(triStateFromCkdQualifier(undefined)).toBeNull();
    expect(ckdQualifierReviewed("unknown")).toBe(false);
    expect(ckdQualifierSetsAdvancedScenario("unknown")).toBe(false);
  });

  it("none maps to no", () => {
    expect(triStateFromCkdQualifier("none")).toBe("no");
    expect(ckdQualifierSetsAdvancedScenario("none")).toBe(false);
    expect(ckdQualifierReviewed("none")).toBe(true);
  });

  it("advanced stages and CKD-MBD map to yes", () => {
    expect(triStateFromCkdQualifier("g4")).toBe("yes");
    expect(triStateFromCkdQualifier("g5")).toBe("yes");
    expect(triStateFromCkdQualifier("dialysis")).toBe("yes");
    expect(triStateFromCkdQualifier("advanced_unspecified")).toBe("yes");
    expect(triStateFromCkdQualifier("ckd_mbd_suspected")).toBe("yes");
    expect(triStateFromCkdQualifier("ckd_mbd_present")).toBe("yes");
  });

  it("normalises unknown junk to unknown", () => {
    expect(normalizeCkdQualifier("G3a")).toBe("unknown");
    expect(normalizeCkdQualifier(null)).toBe("unknown");
  });
});
