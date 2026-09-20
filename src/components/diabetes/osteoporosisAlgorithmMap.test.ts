import { describe, expect, it } from "vitest";
import { mapPatientInputToAlgorithm } from "./osteoporosisAlgorithmMap";
import { classifyOsteoporosis } from "./osteoporosisAlgorithm";
import type { NavigatorIntake } from "./osteoporosisAlgorithmMap";

function intake(partial: Partial<NavigatorIntake> = {}): NavigatorIntake {
  return {
    age: "72",
    sex: "female",
    postmenopausal: true,
    fragilityFractureTypes: [],
    fractureHistoryComplete: "yes",
    fractureHistory: [],
    femoralNeckTScore: "-1.6",
    totalHipTScore: "-1.4",
    lumbarSpineTScore: "-1.8",
    fraxAboveNationalThreshold: "no",
    fallsInPast12Months: "0",
    injuriousFallInPast12Months: "no",
    clinicianIdentifiedHighFallsRisk: "no",
    prednisoneEquivalentMgPerDay: "0",
    steroidDurationMonths: "0",
    currentDrug: "none",
    lastDenosumabDate: "",
    denosumabDurationYears: "",
    lastTeriparatideDate: "",
    crcl: "80",
    secondaryCauseFlags: [],
    clinicalReviewComplete: true,
    ...partial,
  };
}

describe("mapPatientInputToAlgorithm", () => {
  it("does not consume raw FRAX percentages from leftover intake fields", () => {
    const mapped = mapPatientInputToAlgorithm(intake({ fraxAboveNationalThreshold: "yes" }));
    expect(mapped.fraxAboveNationalThreshold).toBe("yes");
    expect(classifyOsteoporosis(mapped).finalCategory).toBe("high");
  });

  it("counts two dated vertebral fractures as very high", () => {
    const mapped = mapPatientInputToAlgorithm(
      intake({
        fractureHistory: [
          { site: "vertebral", date: "2020-01-01", fragilityFracture: "yes", occurredDuringTreatment: "no" },
          { site: "vertebral", date: "2021-06-01", fragilityFracture: "yes", occurredDuringTreatment: "no" },
        ],
      }),
    );
    expect(mapped.vertebralFractureCount).toBe(2);
    expect(classifyOsteoporosis(mapped).finalCategory).toBe("very_high");
  });

  it("unknown fracture history is not treated as no fractures", () => {
    const mapped = mapPatientInputToAlgorithm(intake({ fractureHistoryComplete: "unknown" }));
    expect(mapped.hipFracture).toBe("unknown");
    expect(mapped.vertebralFractureCount).toBeNull();
    expect(classifyOsteoporosis(mapped).finalCategory).toBe("assessment_incomplete");
  });

  it("maps checklist selection onto hasSecondaryCause and assessment status", () => {
    const empty = mapPatientInputToAlgorithm(intake());
    expect(empty.hasSecondaryCause).toBe(false);
    expect(empty.secondaryCauseFlags).toEqual([]);
    expect(empty.assessmentItemStatus.secondary_causes).toBe("unknown");

    const t1d = mapPatientInputToAlgorithm(intake({ secondaryCauseFlags: ["Type 1 diabetes"] }));
    expect(t1d.hasSecondaryCause).toBe(true);
    expect(t1d.secondaryCauseFlags).toEqual(["Type 1 diabetes"]);
    expect(t1d.assessmentItemStatus.secondary_causes).toBe("obtained");
    expect(classifyOsteoporosis(t1d).finalCategory).toBe("below_treatment_threshold");

    const none = mapPatientInputToAlgorithm(intake({ secondaryCauseFlags: ["None identified"] }));
    expect(none.hasSecondaryCause).toBe(false);
    expect(none.secondaryCauseFlags).toEqual([]);
    expect(none.assessmentItemStatus.secondary_causes).toBe("obtained");
  });

  it("CKD checklist flag derives advanced CKD when the dedicated field is unknown", () => {
    const mapped = mapPatientInputToAlgorithm(
      intake({ secondaryCauseFlags: ["CKD"], advancedCkdOrCkdMbd: "unknown" }),
    );
    expect(mapped.advancedCkdOrCkdMbd).toBe("yes");
    expect(mapped.hasSecondaryCause).toBe(true);
    expect(classifyOsteoporosis(mapped).specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(
      true,
    );
  });

  it("explicit advanced-CKD no wins over a CKD checklist tick", () => {
    const mapped = mapPatientInputToAlgorithm(
      intake({ secondaryCauseFlags: ["CKD"], advancedCkdOrCkdMbd: "no" }),
    );
    expect(mapped.advancedCkdOrCkdMbd).toBe("no");
    expect(classifyOsteoporosis(mapped).specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(
      false,
    );
  });

  it("maps the CKD qualifier onto the coarse advanced-CKD flag", () => {
    const g5 = mapPatientInputToAlgorithm(intake({ ckdQualifier: "g5", advancedCkdOrCkdMbd: "unknown" }));
    expect(g5.ckdQualifier).toBe("g5");
    expect(g5.advancedCkdOrCkdMbd).toBe("yes");
    expect(g5.assessmentItemStatus.renal_ckd_mbd).toBe("obtained");
    expect(classifyOsteoporosis(g5).specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(true);

    const mbd = mapPatientInputToAlgorithm(
      intake({ ckdQualifier: "ckd_mbd_suspected", advancedCkdOrCkdMbd: "no" }),
    );
    expect(mbd.advancedCkdOrCkdMbd).toBe("yes");

    const none = mapPatientInputToAlgorithm(
      intake({ ckdQualifier: "none", crcl: "20", advancedCkdOrCkdMbd: "unknown" }),
    );
    expect(none.advancedCkdOrCkdMbd).toBe("no");
    expect(classifyOsteoporosis(none).specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(
      false,
    );
  });

  it("maps CFS frailty levels onto the coarse frequentFalls flag", () => {
    const unknown = mapPatientInputToAlgorithm(intake({ frailtyLevel: "unknown" }));
    expect(unknown.frailtyLevel).toBe("unknown");
    expect(unknown.frequentFalls).toBe("no");
    expect(unknown.assessmentItemStatus.falls_frailty).toBe("obtained");

    const mildly = mapPatientInputToAlgorithm(
      intake({
        frailtyLevel: "cfs_5",
        frequentFalls: "no",
        clinicianIdentifiedHighFallsRisk: "no",
        injuriousFallInPast12Months: "no",
        fallsInPast12Months: "0",
      }),
    );
    expect(mildly.frailtyLevel).toBe("cfs_5");
    expect(mildly.frequentFalls).toBe("yes");
    expect(mildly.assessmentItemStatus.falls_frailty).toBe("obtained");
    expect(classifyOsteoporosis(mildly).specialScenariosPresent.some((s) => s.id === "frequent_falls")).toBe(
      true,
    );

    const fitWithFalls = mapPatientInputToAlgorithm(
      intake({ frailtyLevel: "cfs_1", frequentFalls: "yes", clinicianIdentifiedHighFallsRisk: "yes" }),
    );
    expect(fitWithFalls.frequentFalls).toBe("yes");
    expect(classifyOsteoporosis(fitWithFalls).specialScenariosPresent.some((s) => s.id === "frequent_falls")).toBe(
      true,
    );

    const managing = mapPatientInputToAlgorithm(
      intake({
        frailtyLevel: "cfs_3",
        frequentFalls: "unknown",
        clinicianIdentifiedHighFallsRisk: "unknown",
        injuriousFallInPast12Months: "unknown",
        fallsInPast12Months: "",
      }),
    );
    expect(managing.frequentFalls).toBe("no");
    expect(managing.assessmentItemStatus.falls_frailty).toBe("obtained");
    expect(classifyOsteoporosis(managing).specialScenariosPresent.some((s) => s.id === "frequent_falls")).toBe(
      false,
    );
  });
});
