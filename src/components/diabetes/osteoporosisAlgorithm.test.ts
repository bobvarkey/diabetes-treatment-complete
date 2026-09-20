import { describe, it, expect } from "vitest";
import algorithmJson from "@/data/osteoporosis-algorithm-v2.json";
import {
  ALGORITHM_VERSION,
  SCHEMA_VERSION,
  ASSESSMENT_ITEM_LABELS,
  SAFETY_RULES,
  classifyOsteoporosis,
  denosumabHolidayMessage,
  emptyAlgorithmInput,
  lowestKnownTScore,
  type OsteoporosisAlgorithmInput,
} from "./osteoporosisAlgorithm";

function complete(partial: Partial<OsteoporosisAlgorithmInput> = {}): OsteoporosisAlgorithmInput {
  const base = emptyAlgorithmInput();
  return {
    ...base,
    ageYears: 68,
    sex: "female",
    postmenopausal: true,
    vertebralFractureCount: 0,
    hipFracture: "no",
    otherFragilityFracture: "no",
    femoralNeckTScore: -1.6,
    totalHipTScore: -1.4,
    lumbarSpineTScore: -1.8,
    fraxAboveNationalThreshold: "no",
    recentFragilityFracture: "no",
    recentVertebralFracture: "no",
    glucocorticoidMgPerDay: 0,
    glucocorticoidMonths: 0,
    frequentFalls: "no",
    fractureOnTreatment: "no",
    advancedCkdOrCkdMbd: "no",
    assessmentItemStatus: {
      fracture_history: "obtained",
      dxa_hip_spine: "obtained",
      frax_threshold: "obtained",
      secondary_causes: "obtained",
      falls_frailty: "obtained",
      glucocorticoids: "obtained",
      renal_ckd_mbd: "obtained",
      current_therapy: "obtained",
    },
    clinicalReviewComplete: true,
    currentTherapy: "none",
    ...partial,
  };
}

describe("algorithm provenance", () => {
  it("is schema 1.0 / algorithm 2.0 from the committed JSON", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
    expect(ALGORITHM_VERSION).toBe("2.0");
    expect(algorithmJson.title).toMatch(/integrated risk, treatment and follow-up/i);
    expect(algorithmJson.purpose).toMatch(/not a validated autonomous prescribing engine/i);
    expect(Object.values(ASSESSMENT_ITEM_LABELS)).toEqual(algorithmJson.assessment.items);
    expect(SAFETY_RULES).toEqual(algorithmJson.safety_rules);
  });
});

describe("lowestKnownTScore", () => {
  it("uses the lowest entered site and ignores nulls", () => {
    expect(lowestKnownTScore({ femoralNeckTScore: -2.1, totalHipTScore: -1.0, lumbarSpineTScore: -2.8 })).toBe(-2.8);
    expect(lowestKnownTScore({ femoralNeckTScore: null, totalHipTScore: null, lumbarSpineTScore: null })).toBeNull();
  });
});

describe("very high vs high T-score thresholds", () => {
  it("T-score −3.5 is not very high from T-score alone (strict < −3.5)", () => {
    const r = classifyOsteoporosis(complete({ femoralNeckTScore: -3.5, totalHipTScore: -3.5, lumbarSpineTScore: -3.5 }));
    expect(r.finalCategory).toBe("high");
    expect(r.baselineReasons.join(" ")).toMatch(/≤ −2\.5/);
    expect(r.veryHighRiskIndicators.join(" ")).not.toMatch(/< −3\.5/);
  });

  it("T-score −3.6 without fracture is very high", () => {
    const r = classifyOsteoporosis(complete({ femoralNeckTScore: -3.6, lumbarSpineTScore: -3.2 }));
    expect(r.finalCategory).toBe("very_high");
    expect(r.veryHighRiskIndicators.join(" ")).toMatch(/< −3\.5/);
  });

  it("hip fracture with T −3.0 is high, not very high (strict < −3.0)", () => {
    const r = classifyOsteoporosis(complete({ hipFracture: "yes", femoralNeckTScore: -3.0, totalHipTScore: -3.0, lumbarSpineTScore: -2.4 }));
    expect(r.finalCategory).toBe("high");
    expect(r.veryHighRiskIndicators).toHaveLength(0);
  });

  it("vertebral fracture with T −3.1 is very high", () => {
    const r = classifyOsteoporosis(complete({ vertebralFractureCount: 1, femoralNeckTScore: -3.1, lumbarSpineTScore: -2.8 }));
    expect(r.finalCategory).toBe("very_high");
    expect(r.veryHighRiskIndicators.join(" ")).toMatch(/< −3\.0/);
  });

  it("T-score −2.5 without fracture is high", () => {
    const r = classifyOsteoporosis(complete({ femoralNeckTScore: -2.5, totalHipTScore: -2.2, lumbarSpineTScore: -2.1 }));
    expect(r.finalCategory).toBe("high");
  });

  it("T-score −2.4 without other criteria is below threshold when review is complete", () => {
    const r = classifyOsteoporosis(complete({ femoralNeckTScore: -2.4, totalHipTScore: -2.0, lumbarSpineTScore: -2.1 }));
    expect(r.finalCategory).toBe("below_treatment_threshold");
  });
});

describe("fracture-based very high vs high", () => {
  it("two vertebral fractures are very high regardless of BMD", () => {
    const r = classifyOsteoporosis(complete({ vertebralFractureCount: 2, femoralNeckTScore: -1.2, lumbarSpineTScore: -1.0 }));
    expect(r.finalCategory).toBe("very_high");
    expect(r.veryHighRiskIndicators.join(" ")).toMatch(/2 vertebral/);
  });

  it("coexisting vertebral and hip fracture is very high", () => {
    const r = classifyOsteoporosis(complete({ vertebralFractureCount: 1, hipFracture: "yes", femoralNeckTScore: -1.8, lumbarSpineTScore: -1.5 }));
    expect(r.finalCategory).toBe("very_high");
    expect(r.veryHighRiskIndicators.join(" ")).toMatch(/vertebral and hip/);
  });

  it("single hip fracture without very-low BMD is high", () => {
    const r = classifyOsteoporosis(complete({ hipFracture: "yes", femoralNeckTScore: -2.2, lumbarSpineTScore: -2.0 }));
    expect(r.finalCategory).toBe("high");
    expect(r.baselineReasons.join(" ")).toMatch(/Hip or vertebral/);
  });

  it("humeral or pelvic fragility is high, not very high", () => {
    const r = classifyOsteoporosis(complete({ otherFragilityFracture: "yes", femoralNeckTScore: -1.9, lumbarSpineTScore: -1.7 }));
    expect(r.finalCategory).toBe("high");
    expect(r.veryHighRiskIndicators).toHaveLength(0);
  });
});

describe("FRAX is a threshold comparison only", () => {
  it("FRAX above the applicable national threshold is high when no VH criterion is present", () => {
    const r = classifyOsteoporosis(complete({ fraxAboveNationalThreshold: "yes" }));
    expect(r.finalCategory).toBe("high");
    expect(r.baselineReasons.join(" ")).toMatch(/national treatment threshold/);
  });

  it("does not invent a FRAX multiplier or numeric cutoff", () => {
    const r = classifyOsteoporosis(complete({ fraxAboveNationalThreshold: "yes" }));
    expect(JSON.stringify(r)).not.toMatch(/≥ 20%|≥ 30%/);
    expect(r.rationale.join(" ")).toMatch(/no invented FRAX multiplier/i);
  });
});

describe("incomplete assessment — unknown is never negative", () => {
  it("empty input is assessment_incomplete, not below threshold", () => {
    const r = classifyOsteoporosis(emptyAlgorithmInput());
    expect(r.finalCategory).toBe("assessment_incomplete");
    expect(r.assessmentIncompleteReasons.length).toBeGreaterThan(0);
  });

  it("hip fracture with unknown T-score is incomplete (could be very high if T < −3.0)", () => {
    const r = classifyOsteoporosis(
      complete({
        hipFracture: "yes",
        femoralNeckTScore: null,
        totalHipTScore: null,
        lumbarSpineTScore: null,
        assessmentItemStatus: { ...complete().assessmentItemStatus, dxa_hip_spine: "missing" },
      }),
    );
    expect(r.finalCategory).toBe("assessment_incomplete");
    expect(r.baselineCategory).toBe("high");
    expect(r.assessmentIncompleteReasons.join(" ")).toMatch(/< −3\.0/);
    expect(r.routing).toMatch(/do not auto-prescribe or assign low risk/i);
  });

  it("unknown FRAX threshold without other criteria is incomplete", () => {
    const r = classifyOsteoporosis(
      complete({
        fraxAboveNationalThreshold: "unknown",
        assessmentItemStatus: { ...complete().assessmentItemStatus, frax_threshold: "missing" },
      }),
    );
    expect(r.finalCategory).toBe("assessment_incomplete");
    expect(r.assessmentIncompleteReasons.join(" ")).toMatch(/FRAX threshold/);
  });

  it("known very high is not downgraded by missing DXA", () => {
    const r = classifyOsteoporosis(
      complete({
        vertebralFractureCount: 2,
        femoralNeckTScore: null,
        totalHipTScore: null,
        lumbarSpineTScore: null,
        assessmentItemStatus: { ...complete().assessmentItemStatus, dxa_hip_spine: "missing" },
      }),
    );
    expect(r.finalCategory).toBe("very_high");
  });

  it("premenopausal woman is out of scope and incomplete", () => {
    const r = classifyOsteoporosis(complete({ postmenopausal: false }));
    expect(r.inScope).toBe(false);
    expect(r.finalCategory).toBe("assessment_incomplete");
  });

  it("man aged 49 is out of scope", () => {
    const r = classifyOsteoporosis(complete({ sex: "male", postmenopausal: null, ageYears: 49 }));
    expect(r.inScope).toBe(false);
    expect(r.finalCategory).toBe("assessment_incomplete");
  });

  it("man aged 50 is in scope", () => {
    const r = classifyOsteoporosis(complete({ sex: "male", postmenopausal: null, ageYears: 50, femoralNeckTScore: -2.6, lumbarSpineTScore: -2.4 }));
    expect(r.inScope).toBe(true);
    expect(r.finalCategory).toBe("high");
  });
});

describe("mandatory special-scenario review", () => {
  it("recent vertebral fracture flags a very-high-risk indicator even without very low BMD", () => {
    const r = classifyOsteoporosis(
      complete({
        vertebralFractureCount: 1,
        recentFragilityFracture: "yes",
        recentVertebralFracture: "yes",
        femoralNeckTScore: -1.5,
        lumbarSpineTScore: -1.4,
      }),
    );
    expect(r.specialScenariosPresent.some((s) => s.id === "recent_fracture" && s.veryHighRiskIndicator)).toBe(true);
    expect(r.finalCategory).toBe("very_high");
    expect(r.veryHighRiskIndicators.join(" ")).toMatch(/specialist assessment/i);
  });

  it("other recent fragility is not an automatic very-high upgrade", () => {
    const r = classifyOsteoporosis(
      complete({
        otherFragilityFracture: "yes",
        recentFragilityFracture: "yes",
        recentVertebralFracture: "no",
        femoralNeckTScore: -1.7,
        lumbarSpineTScore: -1.5,
      }),
    );
    const recent = r.specialScenariosPresent.find((s) => s.id === "recent_fracture");
    expect(recent?.automaticUpgrade).toBe(false);
    expect(recent?.veryHighRiskIndicator).toBe(false);
    expect(recent?.possibleUpgradeAfterReview).toBe(true);
    expect(r.finalCategory).toBe("high");
  });

  it("prednisolone ≥7.5 mg/day for >3 months flags a NOGG very-high-risk indicator", () => {
    const r = classifyOsteoporosis(complete({ glucocorticoidMgPerDay: 7.5, glucocorticoidMonths: 4 }));
    expect(r.specialScenariosPresent.some((s) => s.id === "glucocorticoids" && s.veryHighRiskIndicator)).toBe(true);
    expect(r.finalCategory).toBe("very_high");
  });

  it("≥7.5 mg/day for exactly 3 months is not the >3-month very-high flag", () => {
    const r = classifyOsteoporosis(complete({ glucocorticoidMgPerDay: 7.5, glucocorticoidMonths: 3 }));
    const gc = r.specialScenariosPresent.find((s) => s.id === "glucocorticoids");
    expect(gc?.veryHighRiskIndicator).toBe(false);
    expect(r.finalCategory).not.toBe("very_high");
  });

  it("≥5 but <7.5 mg/day does not automatically label very high risk", () => {
    const r = classifyOsteoporosis(complete({ glucocorticoidMgPerDay: 5, glucocorticoidMonths: 12 }));
    const gc = r.specialScenariosPresent.find((s) => s.id === "glucocorticoids");
    expect(gc?.veryHighRiskIndicator).toBe(false);
    expect(gc?.action).toMatch(/do not automatically label very high risk/i);
    expect(r.finalCategory).toBe("below_treatment_threshold");
  });

  it("frequent falls do not automatically upgrade", () => {
    const r = classifyOsteoporosis(complete({ frequentFalls: "yes", femoralNeckTScore: -2.6, lumbarSpineTScore: -2.4 }));
    const falls = r.specialScenariosPresent.find((s) => s.id === "frequent_falls");
    expect(falls?.automaticUpgrade).toBe(false);
    expect(r.finalCategory).toBe("high");
  });

  it("fracture on treatment is not automatic treatment failure or upgrade", () => {
    const r = classifyOsteoporosis(
      complete({
        otherFragilityFracture: "yes",
        fractureOnTreatment: "yes",
        currentTherapy: "oral_bisphosphonate",
      }),
    );
    const fot = r.specialScenariosPresent.find((s) => s.id === "fracture_on_treatment");
    expect(fot?.automaticUpgrade).toBe(false);
    expect(r.finalCategory).toBe("high");
    expect(r.drugSelection.notes.join(" ")).toMatch(/does not automatically establish treatment failure/i);
  });

  it("advanced CKD is not an automatic anabolic route or risk upgrade", () => {
    const r = classifyOsteoporosis(complete({ advancedCkdOrCkdMbd: "yes" }));
    const ckd = r.specialScenariosPresent.find((s) => s.id === "advanced_ckd");
    expect(ckd?.automaticUpgrade).toBe(false);
    expect(r.finalCategory).toBe("below_treatment_threshold");
    expect(r.drugSelection.considerAnabolic).toHaveLength(0);
    expect(r.drugSuitabilityReview.join(" ")).toMatch(/CKD-MBD/);
  });

  it("pending review of a below-threshold case does not default to low risk", () => {
    const r = classifyOsteoporosis(complete({ frequentFalls: "yes", clinicalReviewComplete: false }));
    expect(r.finalCategory).toBe("assessment_incomplete");
    expect(r.clinicalReviewStatus).toBe("pending");
    expect(r.routing).toMatch(/do not auto-prescribe or assign low risk/i);
  });

  it("absence of special scenarios does not downgrade established very high risk", () => {
    const r = classifyOsteoporosis(complete({ femoralNeckTScore: -3.8, lumbarSpineTScore: -3.6 }));
    expect(r.specialScenariosPresent).toHaveLength(0);
    expect(r.finalCategory).toBe("very_high");
    expect(r.rationale.join(" ")).toMatch(/not downgraded/i);
  });
});

describe("drug selection, follow-up and safety", () => {
  it("very high offers the three bone-forming courses and mandatory antiresorptive sequence", () => {
    const r = classifyOsteoporosis(complete({ vertebralFractureCount: 2 }));
    expect(r.drugSelection.considerAnabolic.map((d) => [d.drug, d.months])).toEqual([
      ["romosozumab", 12],
      ["abaloparatide", 18],
      ["teriparatide", 24],
    ]);
    expect(r.drugSelection.sequence).toMatch(/Immediately follow/i);
    expect(r.routing).toMatch(/bone-forming/i);
  });

  it("high prefers oral or IV bisphosphonate with denosumab as planned alternative", () => {
    const r = classifyOsteoporosis(complete({ femoralNeckTScore: -2.7, lumbarSpineTScore: -2.4 }));
    expect(r.drugSelection.preferred).toMatch(/bisphosphonate/i);
    expect(r.drugSelection.alternative).toMatch(/Denosumab/i);
    expect(r.routing).toBe("Antiresorptive treatment.");
  });

  it("below-threshold complete review routes to lifestyle and surveillance", () => {
    const r = classifyOsteoporosis(complete());
    expect(r.finalCategory).toBe("below_treatment_threshold");
    expect(r.routing).toMatch(/Lifestyle, falls prevention and surveillance/);
    expect(r.drugSelection.notes.join(" ")).toMatch(/not indicated/i);
  });

  it("follow-up durations match the JSON (oral 5 y, IV 3 y, denosumab 5–10 y)", () => {
    const r = classifyOsteoporosis(complete({ femoralNeckTScore: -2.7, lumbarSpineTScore: -2.5 }));
    expect(r.followUp.formalDurationReview.join(" ")).toMatch(/5 years/);
    expect(r.followUp.formalDurationReview.join(" ")).toMatch(/3 years/);
    expect(r.followUp.formalDurationReview.join(" ")).toMatch(/5–10 years/);
  });

  it("denosumab has no holiday and requires a planned transition", () => {
    const r = classifyOsteoporosis(complete({ femoralNeckTScore: -2.7, lumbarSpineTScore: -2.4, currentTherapy: "denosumab" }));
    expect(denosumabHolidayMessage()).toMatch(/No drug holiday/i);
    expect(r.followUp.ifLowOrControlledRisk.join(" ")).toMatch(/No drug holiday/i);
    expect(r.drugSelection.notes.join(" ")).toMatch(/Never stop denosumab/i);
    expect(r.safetyRules.some((s) => /Never stop denosumab/i.test(s))).toBe(true);
  });

  it("advanced CKD on a very-high pathway still blocks automatic anabolic routing", () => {
    const r = classifyOsteoporosis(complete({ vertebralFractureCount: 2, advancedCkdOrCkdMbd: "yes" }));
    expect(r.finalCategory).toBe("very_high");
    expect(r.drugSelection.notes.join(" ")).toMatch(/not an automatic indication for anabolic/i);
    expect(r.safetyRules.join(" ")).toMatch(/Advanced CKD is not an automatic indication for anabolic therapy/);
  });

  it("required decision fields are always populated", () => {
    const r = classifyOsteoporosis(complete({ hipFracture: "yes" }));
    expect(r.baselineCategory).toBeTruthy();
    expect(Array.isArray(r.specialScenariosPresent)).toBe(true);
    expect(Array.isArray(r.veryHighRiskIndicators)).toBe(true);
    expect(["complete", "pending"]).toContain(r.clinicalReviewStatus);
    expect(["very_high", "high", "below_treatment_threshold", "assessment_incomplete"]).toContain(r.finalCategory);
    expect(r.rationale.length).toBeGreaterThan(0);
    expect(r.drugSuitabilityReview.length).toBeGreaterThan(0);
  });
});
