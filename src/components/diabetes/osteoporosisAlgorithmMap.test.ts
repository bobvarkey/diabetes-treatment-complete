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
});
