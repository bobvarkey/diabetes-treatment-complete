import { describe, expect, it } from "vitest";
import {
  classifyLiveIntake,
  mapPatientInputToAlgorithm,
  type NavigatorIntake,
} from "./osteoporosisAlgorithmMap";
import { withFinalCategory } from "./osteoporosisAlgorithm";
import { mergeJevIntoDecision, osteoporosisRoutingIsAmbiguous, compactOsteoporosisState } from "@/lib/jev/osteoporosisJev";

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
    hipFracture: "no",
    vertebralFractureCount: "0",
    otherFragilityFracture: "no",
    recentFragilityFracture: "no",
    recentVertebralFracture: "no",
    fractureOnTreatment: "no",
    advancedCkdOrCkdMbd: "no",
    frequentFalls: "no",
    ...partial,
  };
}

describe("form → classification reactivity (no submit)", () => {
  it("reclassifies when T-score crosses the very-high threshold", () => {
    const high = classifyLiveIntake(
      intake({ femoralNeckTScore: "-3.5", lumbarSpineTScore: "-3.5" }),
    );
    expect(high.decision.finalCategory).toBe("high");

    const veryHigh = classifyLiveIntake(
      intake({ femoralNeckTScore: "-3.6", lumbarSpineTScore: "-3.5" }),
    );
    expect(veryHigh.decision.finalCategory).toBe("very_high");
  });

  it("reclassifies when FRAX threshold comparison flips to yes", () => {
    const below = classifyLiveIntake(intake({ fraxAboveNationalThreshold: "no" }));
    expect(below.decision.finalCategory).toBe("below_treatment_threshold");

    const high = classifyLiveIntake(intake({ fraxAboveNationalThreshold: "yes" }));
    expect(high.decision.finalCategory).toBe("high");
  });

  it("reclassifies when vertebral fracture count becomes 2", () => {
    const one = classifyLiveIntake(intake({ vertebralFractureCount: "1" }));
    expect(one.decision.finalCategory).toBe("high");

    const two = classifyLiveIntake(intake({ vertebralFractureCount: "2" }));
    expect(two.decision.finalCategory).toBe("very_high");
  });

  it("honours live-form hip / CKD / fracture-on-treatment / glucocorticoid fields", () => {
    const hip = classifyLiveIntake(
      intake({ hipFracture: "yes", femoralNeckTScore: "-2.2", lumbarSpineTScore: "-2.0" }),
    );
    expect(hip.mapped.hipFracture).toBe("yes");
    expect(hip.decision.finalCategory).toBe("high");

    const ckd = classifyLiveIntake(intake({ advancedCkdOrCkdMbd: "yes" }));
    expect(ckd.decision.specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(true);

    const fot = classifyLiveIntake(
      intake({ otherFragilityFracture: "yes", fractureOnTreatment: "yes", currentDrug: "oral-bp" }),
    );
    expect(fot.mapped.fractureOnTreatment).toBe("yes");
    expect(fot.decision.specialScenariosPresent.some((s) => s.id === "fracture_on_treatment")).toBe(
      true,
    );

    const gc = classifyLiveIntake(
      intake({ prednisoneEquivalentMgPerDay: "7.5", steroidDurationMonths: "4" }),
    );
    expect(gc.decision.finalCategory).toBe("very_high");
  });

  it("unknown FRAX is never treated as below threshold", () => {
    const r = classifyLiveIntake(intake({ fraxAboveNationalThreshold: "unknown" }));
    expect(r.decision.finalCategory).toBe("assessment_incomplete");
  });

  it("reclassifies assessment and CKD special-scenario from secondary-cause ticks", () => {
    const empty = classifyLiveIntake(intake({ advancedCkdOrCkdMbd: "unknown" }));
    expect(empty.mapped.hasSecondaryCause).toBe(false);
    expect(empty.mapped.assessmentItemStatus.secondary_causes).toBe("unknown");
    expect(empty.decision.specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(false);
    expect(empty.decision.finalCategory).toBe("below_treatment_threshold");

    const t1d = classifyLiveIntake(
      intake({ advancedCkdOrCkdMbd: "unknown", secondaryCauseFlags: ["Type 1 diabetes"] }),
    );
    expect(t1d.mapped.hasSecondaryCause).toBe(true);
    expect(t1d.mapped.assessmentItemStatus.secondary_causes).toBe("obtained");
    expect(t1d.decision.finalCategory).toBe("below_treatment_threshold");

    const ckd = classifyLiveIntake(
      intake({ advancedCkdOrCkdMbd: "unknown", secondaryCauseFlags: ["CKD"] }),
    );
    expect(ckd.mapped.hasSecondaryCause).toBe(true);
    expect(ckd.mapped.advancedCkdOrCkdMbd).toBe("yes");
    expect(ckd.decision.specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(true);
    expect(osteoporosisRoutingIsAmbiguous(ckd.decision)).toBe(true);
  });

  it("puts selected secondary causes on the Jev compact intake", () => {
    const { mapped, decision } = classifyLiveIntake(
      intake({ secondaryCauseFlags: ["Type 1 diabetes", "Rheumatoid arthritis"] }),
    );
    const compact = compactOsteoporosisState(mapped, decision);
    expect(compact.intake.hasSecondaryCause).toBe(true);
    expect(compact.intake.secondaryCauseFlags).toEqual(["Type 1 diabetes", "Rheumatoid arthritis"]);
  });

  it("reclassifies the advanced-CKD special scenario from the qualifier", () => {
    const none = classifyLiveIntake(intake({ ckdQualifier: "none", advancedCkdOrCkdMbd: "unknown" }));
    expect(none.mapped.advancedCkdOrCkdMbd).toBe("no");
    expect(none.decision.specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(false);

    const dialysis = classifyLiveIntake(
      intake({ ckdQualifier: "dialysis", advancedCkdOrCkdMbd: "unknown" }),
    );
    expect(dialysis.mapped.ckdQualifier).toBe("dialysis");
    expect(dialysis.mapped.advancedCkdOrCkdMbd).toBe("yes");
    expect(dialysis.decision.specialScenariosPresent.some((s) => s.id === "advanced_ckd")).toBe(true);
    expect(osteoporosisRoutingIsAmbiguous(dialysis.decision)).toBe(true);

    const compact = compactOsteoporosisState(dialysis.mapped, dialysis.decision);
    expect(compact.intake.ckdQualifier).toBe("dialysis");
    expect(compact.intake.advancedCkdOrCkdMbd).toBe("yes");
  });

  it("reclassifies the frequent-falls special scenario from CFS frailty levels", () => {
    const fit = classifyLiveIntake(
      intake({
        frailtyLevel: "cfs_2",
        frequentFalls: "unknown",
        clinicianIdentifiedHighFallsRisk: "unknown",
        injuriousFallInPast12Months: "unknown",
        fallsInPast12Months: "",
      }),
    );
    expect(fit.mapped.frailtyLevel).toBe("cfs_2");
    expect(fit.mapped.frequentFalls).toBe("no");
    expect(fit.decision.specialScenariosPresent.some((s) => s.id === "frequent_falls")).toBe(false);

    const moderately = classifyLiveIntake(
      intake({
        frailtyLevel: "cfs_6",
        frequentFalls: "no",
        clinicianIdentifiedHighFallsRisk: "no",
        injuriousFallInPast12Months: "no",
        fallsInPast12Months: "0",
      }),
    );
    expect(moderately.mapped.frailtyLevel).toBe("cfs_6");
    expect(moderately.mapped.frequentFalls).toBe("yes");
    expect(moderately.mapped.assessmentItemStatus.falls_frailty).toBe("obtained");
    expect(moderately.decision.specialScenariosPresent.some((s) => s.id === "frequent_falls")).toBe(true);
    expect(osteoporosisRoutingIsAmbiguous(moderately.decision)).toBe(true);

    const compact = compactOsteoporosisState(moderately.mapped, moderately.decision);
    expect(compact.intake.frailtyLevel).toBe("cfs_6");
    expect(compact.intake.frequentFalls).toBe("yes");
  });
});

describe("mapPatientInputToAlgorithm live overrides", () => {
  it("does not consume raw FRAX percentages from leftover intake fields", () => {
    const mapped = mapPatientInputToAlgorithm(intake({ fraxAboveNationalThreshold: "yes" }));
    expect(mapped.fraxAboveNationalThreshold).toBe("yes");
  });
});

describe("withFinalCategory REPLACE", () => {
  it("rebuilds routing and anabolic options when Jev replaces high → very_high", () => {
    const { mapped, decision } = classifyLiveIntake(
      intake({ femoralNeckTScore: "-2.7", lumbarSpineTScore: "-2.4" }),
    );
    expect(decision.finalCategory).toBe("high");
    const replaced = withFinalCategory(mapped, decision, "very_high", "jev_replace");
    expect(replaced.finalCategory).toBe("very_high");
    expect(replaced.routing).toMatch(/bone-forming/i);
    expect(replaced.drugSelection.considerAnabolic.length).toBe(3);
    expect(replaced.rationale.join(" ")).toMatch(/replaced by high-confidence Jev/i);
  });

  it("mergeJevIntoDecision REPLACES at ≥0.75 and keeps deterministic on failure", () => {
    const { mapped, decision } = classifyLiveIntake(
      intake({ femoralNeckTScore: "-2.7", lumbarSpineTScore: "-2.4", frequentFalls: "yes" }),
    );
    expect(osteoporosisRoutingIsAmbiguous(decision)).toBe(true);

    const replaced = mergeJevIntoDecision({
      input: mapped,
      deterministic: decision,
      calledJev: true,
      jev: {
        available: true,
        answers: {
          final_category: {
            type: "choice",
            choice: "very_high",
            confidence: 0.88,
            probabilities: {
              very_high: 0.88,
              high: 0.1,
              below_treatment_threshold: 0.01,
              assessment_incomplete: 0.01,
            },
          },
        },
      },
    });
    expect(replaced.categoryGate.mode).toBe("replace");
    expect(replaced.decision.finalCategory).toBe("very_high");

    const failed = mergeJevIntoDecision({
      input: mapped,
      deterministic: decision,
      calledJev: true,
      jev: { available: false, reason: "network", reviewFlag: true },
    });
    expect(failed.banner).toMatch(/Jev unavailable/i);
    expect(failed.decision.finalCategory).toBe("high");
    expect(failed.categoryGate.reviewFlag).toBe(true);
  });
});
