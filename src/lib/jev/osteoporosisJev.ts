import {
  categoryLabel,
  withFinalCategory,
  type FinalCategory,
  type OsteoporosisAlgorithmInput,
  type OsteoporosisDecision,
} from "@/components/diabetes/osteoporosisAlgorithm";
import { applyJevFinalCategory, applyJevNoul, applyJevScore } from "./gates";
import type { ClosedFinalCategory, JevCallResult, JevQuestion } from "./types";

export const OSTEOPOROSIS_JEV_QUESTIONS: Record<string, JevQuestion> = {
  needs_judgment: {
    type: "noul",
    instructions:
      "Do the special-scenario findings still require clinician judgment before locking the final osteoporosis risk category? Unknown values must never be treated as negative.",
    criteria: {
      true: "Upgrade is possible but not automatic (recent non-vertebral fracture, sub-threshold glucocorticoids, falls, fracture on treatment, CKD-MBD) or review is still pending.",
      false:
        "The deterministic algorithm already has a closed, unambiguous category (very high from hard criteria, complete below-threshold review, or missing data that only yields assessment_incomplete).",
    },
  },
  final_category: {
    type: "choice",
    instructions:
      "Which algorithm v2.0 final category should this compact case route to? Prefer the deterministic category when hard criteria already decide it. Do not invent a FRAX multiplier or a universal one-category upgrade.",
    criteria: {
      very_high:
        "Very high risk: ≥2 vertebral fractures, coexisting vertebral+hip fracture, T-score < −3.5, hip/vertebral fracture with T-score < −3.0, or a flagged very-high-risk indicator (recent vertebral fracture, prednisolone-equivalent ≥7.5 mg/day for >3 months).",
      high: "High risk: other fragility fracture, hip/vertebral fracture not meeting very-high criteria, T-score ≤ −2.5, or FRAX above the applicable national treatment threshold.",
      below_treatment_threshold:
        "Completed assessment and necessary special-scenario review; no treatment-threshold criterion remains.",
      assessment_incomplete:
        "Scope unknown, missing data that could change classification, or necessary special-scenario review still pending — do not assign low risk.",
    },
  },
  need_specialist: {
    type: "score",
    instructions:
      "How urgently does this case need bone-specialist assessment under algorithm v2.0 / NOGG-style pathways?",
    criteria: [
      "Routine primary-care or general bone-clinic follow-up is sufficient.",
      "Consider specialist input; not automatically anabolic.",
      "Prompt specialist assessment indicated (very-high pathway or complex CKD-MBD / fracture-on-treatment).",
    ],
  },
};

export type CompactOsteoporosisState = {
  algorithmVersion: string;
  inScope: boolean;
  baselineCategory: string;
  deterministicFinalCategory: FinalCategory;
  baselineReasons: string[];
  specialScenarios: Array<{
    id: string;
    veryHighRiskIndicator: boolean;
    possibleUpgradeAfterReview: boolean;
    automaticUpgrade: boolean;
  }>;
  veryHighRiskIndicators: string[];
  clinicalReviewStatus: string;
  assessmentIncompleteReasons: string[];
  intake: {
    ageYears: number | null;
    sex: string;
    postmenopausal: boolean | null;
    vertebralFractureCount: number | null;
    hipFracture: string;
    otherFragilityFracture: string;
    tScores: { femoralNeck: number | null; totalHip: number | null; lumbarSpine: number | null };
    fraxAboveNationalThreshold: string;
    recentFragilityFracture: string;
    recentVertebralFracture: string;
    glucocorticoidMgPerDay: number | null;
    glucocorticoidMonths: number | null;
    frequentFalls: string;
    fractureOnTreatment: string;
    advancedCkdOrCkdMbd: string;
    currentTherapy: string;
    hasSecondaryCause: boolean;
    secondaryCauseFlags: string[];
    ckdQualifier: string;
    frailtyLevel: string;
  };
};

export function compactOsteoporosisState(
  input: OsteoporosisAlgorithmInput,
  decision: OsteoporosisDecision,
): CompactOsteoporosisState {
  return {
    algorithmVersion: decision.algorithmVersion,
    inScope: decision.inScope,
    baselineCategory: decision.baselineCategory,
    deterministicFinalCategory: decision.finalCategory,
    baselineReasons: decision.baselineReasons,
    specialScenarios: decision.specialScenariosPresent.map((s) => ({
      id: s.id,
      veryHighRiskIndicator: s.veryHighRiskIndicator,
      possibleUpgradeAfterReview: s.possibleUpgradeAfterReview,
      automaticUpgrade: s.automaticUpgrade,
    })),
    veryHighRiskIndicators: decision.veryHighRiskIndicators,
    clinicalReviewStatus: decision.clinicalReviewStatus,
    assessmentIncompleteReasons: decision.assessmentIncompleteReasons,
    intake: {
      ageYears: input.ageYears,
      sex: input.sex,
      postmenopausal: input.postmenopausal,
      vertebralFractureCount: input.vertebralFractureCount,
      hipFracture: input.hipFracture,
      otherFragilityFracture: input.otherFragilityFracture,
      tScores: {
        femoralNeck: input.femoralNeckTScore,
        totalHip: input.totalHipTScore,
        lumbarSpine: input.lumbarSpineTScore,
      },
      fraxAboveNationalThreshold: input.fraxAboveNationalThreshold,
      recentFragilityFracture: input.recentFragilityFracture,
      recentVertebralFracture: input.recentVertebralFracture,
      glucocorticoidMgPerDay: input.glucocorticoidMgPerDay,
      glucocorticoidMonths: input.glucocorticoidMonths,
      frequentFalls: input.frequentFalls,
      fractureOnTreatment: input.fractureOnTreatment,
      advancedCkdOrCkdMbd: input.advancedCkdOrCkdMbd,
      currentTherapy: input.currentTherapy,
      hasSecondaryCause: input.hasSecondaryCause,
      secondaryCauseFlags: [...input.secondaryCauseFlags],
      ckdQualifier: input.ckdQualifier,
      frailtyLevel: input.frailtyLevel,
    },
  };
}

export function osteoporosisRoutingIsAmbiguous(decision: OsteoporosisDecision): boolean {
  if (!decision.inScope) return false;
  const scenarios = decision.specialScenariosPresent;
  if (
    scenarios.some(
      (s) =>
        s.possibleUpgradeAfterReview || s.id === "advanced_ckd" || s.id === "fracture_on_treatment",
    )
  ) {
    return true;
  }
  if (
    decision.finalCategory === "assessment_incomplete" &&
    scenarios.length > 0 &&
    decision.assessmentIncompleteReasons.some((r) => /review/i.test(r))
  ) {
    return true;
  }
  return false;
}

export type MergedOsteoporosisDecision = {
  decision: OsteoporosisDecision;
  jevAvailable: boolean;
  jevUnavailableReason?: string;
  calledJev: boolean;
  ambiguous: boolean;
  categoryGate: ReturnType<typeof applyJevFinalCategory>;
  specialistGate: ReturnType<typeof applyJevScore>;
  judgmentGate: ReturnType<typeof applyJevNoul>;
  banner: string;
};

export function mergeJevIntoDecision(opts: {
  input: OsteoporosisAlgorithmInput;
  deterministic: OsteoporosisDecision;
  jev: JevCallResult | null;
  calledJev: boolean;
}): MergedOsteoporosisDecision {
  const ambiguous = osteoporosisRoutingIsAmbiguous(opts.deterministic);
  const answers = opts.jev?.available ? opts.jev.answers : {};

  if (!opts.calledJev) {
    return {
      decision: opts.deterministic,
      jevAvailable: opts.jev?.available !== false,
      jevUnavailableReason: opts.jev && !opts.jev.available ? opts.jev.reason : undefined,
      calledJev: false,
      ambiguous,
      categoryGate: {
        displayed: opts.deterministic.finalCategory as ClosedFinalCategory,
        jevChoice: null,
        applied: false,
        mode: "keep_deterministic",
        reviewFlag: false,
        confidence: null,
        gate: "review",
      },
      specialistGate: applyJevScore(undefined),
      judgmentGate: applyJevNoul(undefined),
      banner:
        opts.jev && !opts.jev.available
          ? "Jev unavailable"
          : "Jev skipped — routing is not ambiguous",
    };
  }

  if (!opts.jev || !opts.jev.available) {
    const reason = opts.jev && !opts.jev.available ? opts.jev.reason : "missing_key";
    return {
      decision: opts.deterministic,
      jevAvailable: false,
      jevUnavailableReason: reason,
      calledJev: true,
      ambiguous,
      categoryGate: {
        displayed: opts.deterministic.finalCategory as ClosedFinalCategory,
        jevChoice: null,
        applied: false,
        mode: "keep_deterministic",
        reviewFlag: true,
        clinicianPrompt:
          "Jev unavailable or failed — keep the deterministic result and review clinically.",
        confidence: null,
        gate: "review",
      },
      specialistGate: applyJevScore(undefined),
      judgmentGate: applyJevNoul(undefined),
      banner: "Jev unavailable",
    };
  }

  const categoryGate = applyJevFinalCategory({
    deterministic: opts.deterministic.finalCategory as ClosedFinalCategory,
    answer: answers.final_category,
  });
  const specialistGate = applyJevScore(answers.need_specialist);
  const judgmentGate = applyJevNoul(answers.needs_judgment);

  const replaced =
    categoryGate.mode === "replace"
      ? withFinalCategory(opts.input, opts.deterministic, categoryGate.displayed, "jev_replace")
      : opts.deterministic;

  let banner = "Deterministic algorithm v2.0";
  if (!opts.calledJev) {
    banner = "Jev skipped — routing is not ambiguous";
  } else if (categoryGate.mode === "replace") {
    banner = `Jev replaced category → ${categoryLabel(categoryGate.displayed)}`;
  } else if (categoryGate.mode === "ask_clinician") {
    banner = "Jev ask clinician";
  } else if (opts.calledJev) {
    banner = "Jev review flag — deterministic result kept";
  }

  return {
    decision: replaced,
    jevAvailable: true,
    calledJev: opts.calledJev,
    ambiguous,
    categoryGate,
    specialistGate,
    judgmentGate,
    banner,
  };
}
