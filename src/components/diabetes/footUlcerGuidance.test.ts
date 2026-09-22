import { describe, expect, it } from "vitest";
import { iwgdfRiskCategories, wagnerGrades } from "./footUlcerGuidance";

describe("IWGDF risk categories", () => {
  it("lists risks 0–3 with the screening intervals", () => {
    expect(iwgdfRiskCategories.map((item) => [item.risk, item.label, item.frequency])).toEqual([
      ["0", "Very low risk", "Once a year"],
      ["1", "Low risk", "Once every 6 to 12 months"],
      ["2", "Moderate risk", "Once every 3 to 6 months"],
      ["3", "High risk", "Once every 1 to 3 months"],
    ]);
  });

  it("uses LOPS, PAD, deformity, ulcer, amputation, and ESRD criteria", () => {
    expect(iwgdfRiskCategories[0].criteria).toBe(
      "No loss of protective sensation (LOPS) and no peripheral artery disease (PAD).",
    );
    expect(iwgdfRiskCategories[1].criteria).toBe("LOPS or PAD present.");
    expect(iwgdfRiskCategories[2].criteria).toBe(
      "LOPS + PAD, LOPS + foot deformity, or PAD + foot deformity.",
    );
    expect(iwgdfRiskCategories[3].criteria).toContain("history of a foot ulcer");
    expect(iwgdfRiskCategories[3].criteria).toContain("lower-extremity amputation (minor or major)");
    expect(iwgdfRiskCategories[3].criteria).toContain("end-stage renal disease");
  });
});

describe("Wagner ulcer grades", () => {
  it("covers grades 0 through 5", () => {
    expect(wagnerGrades.map((item) => item.grade)).toEqual(["0", "1", "2", "3", "4", "5"]);
    expect(wagnerGrades[0].detail).toMatch(/pre-ulcerative/i);
    expect(wagnerGrades[5].finding).toMatch(/gangrene/i);
  });
});
