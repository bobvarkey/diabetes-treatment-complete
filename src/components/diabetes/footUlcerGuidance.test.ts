import { describe, expect, it } from "vitest";
import {
  iwgdfRiskCategories,
  iwgdfRiskInputs,
  padAssessment,
  wagnerGrades,
} from "./footUlcerGuidance";

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
    expect(iwgdfRiskCategories[0].criteria).toContain("LOPS confirmed absent");
    expect(iwgdfRiskCategories[0].criteria).toContain("PAD confirmed absent");
    expect(iwgdfRiskCategories[1].criteria).toBe(
      "LOPS or PAD present, and category 2 or 3 criteria are not met.",
    );
    expect(iwgdfRiskCategories[2].criteria).toContain("LOPS + PAD");
    expect(iwgdfRiskCategories[2].criteria).toContain("category 3 criteria are not met");
    expect(iwgdfRiskCategories[3].criteria).toContain("history of a foot ulcer");
    expect(iwgdfRiskCategories[3].criteria).toContain("lower-extremity amputation (minor or major)");
    expect(iwgdfRiskCategories[3].criteria).toContain("end-stage renal disease");
  });

  it("tracks yes/no/unknown classification inputs", () => {
    expect(iwgdfRiskInputs.map((item) => item.id)).toEqual([
      "LOPS",
      "PAD",
      "foot_deformity",
      "previous_foot_ulcer",
      "previous_lower_extremity_amputation",
      "end_stage_renal_disease",
    ]);
  });
});

describe("PAD assessment", () => {
  it("includes ABI thresholds and safeguards for diabetic foot risk", () => {
    expect(padAssessment.restingAbi.map((row) => row.criterion)).toEqual([
      "ABI ≤ 0.90",
      "0.90 < ABI < 1.00",
      "1.00 ≤ ABI ≤ 1.40",
      "ABI > 1.40",
    ]);
    expect(padAssessment.tbi.accAhaAbnormal).toBe("TBI ≤ 0.70");
    expect(padAssessment.tbi.iwgdfAbnormal).toBe("TBI < 0.70");
    expect(padAssessment.pedalDopplerAbnormal).toEqual(["Monophasic waveform", "Absent signal"]);
    expect(padAssessment.safeguards).toContain("Record unresolved PAD status as unknown, not absent.");
  });

  it("prioritizes toe-pressure zones for diabetes PAD assessment", () => {
    expect(padAssessment.toePressure.zones.map((row) => [row.label, row.criterion])).toEqual([
      ["Normal target", "70–100 mmHg"],
      ["Healing probability zone", "≥ 30 mmHg"],
      ["Severe ischemia zone", "< 30 mmHg"],
    ]);
    expect(padAssessment.toePressure.rationale).toMatch(/noncompressible/i);
  });
});

describe("Wagner ulcer grades", () => {
  it("covers grades 0 through 5", () => {
    expect(wagnerGrades.map((item) => item.grade)).toEqual(["0", "1", "2", "3", "4", "5"]);
    expect(wagnerGrades[0].detail).toMatch(/pre-ulcerative/i);
    expect(wagnerGrades[5].finding).toMatch(/gangrene/i);
  });
});
