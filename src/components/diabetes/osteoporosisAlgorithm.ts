/**
 * Osteoporosis algorithm v2.0 — deterministic encoding of
 * `src/data/osteoporosis-algorithm-v2.json`.
 *
 * Clinician-reviewed decision support; not an autonomous prescribing engine.
 * FRAX probabilities are not calculated here — only a country-appropriate
 * threshold comparison (yes / no / unknown) is consumed.
 */

import algorithmJson from "@/data/osteoporosis-algorithm-v2.json";
import type { CkdQualifier } from "./ckdQualifier";
import type { FrailtyLevel } from "./frailtyLevel";

export const ALGORITHM_VERSION = algorithmJson.algorithm_version;
export const SCHEMA_VERSION = algorithmJson.schema_version;
export const ALGORITHM_TITLE = algorithmJson.title;
export const ALGORITHM_PURPOSE = algorithmJson.purpose;
export const ALGORITHM_SCOPE = algorithmJson.scope;

export type TriState = "yes" | "no" | "unknown";
export type BaselineCategory = "very_high" | "high" | "below_threshold_or_incomplete";
export type FinalCategory = "very_high" | "high" | "below_treatment_threshold" | "assessment_incomplete";
export type ReviewStatus = "complete" | "pending";
export type AssessmentItemStatus = "obtained" | "missing" | "unknown";
export type CurrentTherapy =
  | "none"
  | "oral_bisphosphonate"
  | "iv_bisphosphonate"
  | "denosumab"
  | "anabolic"
  | "unknown";

export const ASSESSMENT_ITEM_IDS = [
  "fracture_history",
  "dxa_hip_spine",
  "frax_threshold",
  "secondary_causes",
  "falls_frailty",
  "glucocorticoids",
  "renal_ckd_mbd",
  "current_therapy",
] as const;

export type AssessmentItemId = (typeof ASSESSMENT_ITEM_IDS)[number];

export const ASSESSMENT_ITEM_LABELS: Record<AssessmentItemId, string> = {
  fracture_history: "Fragility fracture site, number and dates",
  dxa_hip_spine: "DXA at hip and lumbar spine",
  frax_threshold: "Country-appropriate FRAX and treatment thresholds",
  secondary_causes: "Secondary causes",
  falls_frailty: "Falls and frailty",
  glucocorticoids: "Glucocorticoid dose in prednisolone equivalents and duration",
  renal_ckd_mbd: "Renal function and possible CKD-MBD",
  current_therapy: "Current osteoporosis therapy, duration, adherence and response",
};

export interface OsteoporosisAlgorithmInput {
  ageYears: number | null;
  sex: "female" | "male" | "";
  postmenopausal: boolean | null;

  vertebralFractureCount: number | null;
  hipFracture: TriState;
  otherFragilityFracture: TriState;

  femoralNeckTScore: number | null;
  totalHipTScore: number | null;
  lumbarSpineTScore: number | null;

  fraxAboveNationalThreshold: TriState;

  recentFragilityFracture: TriState;
  recentVertebralFracture: TriState;
  glucocorticoidMgPerDay: number | null;
  glucocorticoidMonths: number | null;
  frequentFalls: TriState;
  fractureOnTreatment: TriState;
  advancedCkdOrCkdMbd: TriState;

  assessmentItemStatus: Record<AssessmentItemId, AssessmentItemStatus>;
  clinicalReviewComplete: boolean;

  ageOver75: boolean;
  cardiovascularHistoryRomosozumabRestriction: TriState;
  giIntolerance: TriState;
  cancerHistory: TriState;
  adherenceConcern: TriState;

  currentTherapy: CurrentTherapy;
  therapyDurationYears: number | null;

  /**
   * Selected secondary-cause labels from the live form. Classification does not
   * branch on individual labels; the mapper sets assessmentItemStatus.secondary_causes
   * and may derive advanced CKD from the CKD flag.
   */
  secondaryCauseFlags: string[];
  /** True when at least one pathologic secondary cause (not "None identified") is ticked. */
  hasSecondaryCause: boolean;
  /** Form qualifier; classification uses advancedCkdOrCkdMbd only. */
  ckdQualifier: CkdQualifier;
  /**
   * CFS 1–9 form qualifier; classification uses frequentFalls only (falls and
   * frailty special scenario). Persist the chosen level for the form, session
   * and Jev compact intake.
   */
  frailtyLevel: FrailtyLevel;
}

export interface SpecialScenarioFinding {
  id: "recent_fracture" | "glucocorticoids" | "frequent_falls" | "fracture_on_treatment" | "advanced_ckd";
  trigger: string;
  effect?: string;
  action: string;
  automaticUpgrade: boolean;
  veryHighRiskIndicator: boolean;
  possibleUpgradeAfterReview: boolean;
}

export interface AnabolicOption {
  drug: "romosozumab" | "abaloparatide" | "teriparatide";
  months: number;
  note?: string;
}

export interface DrugSelection {
  considerAnabolic: AnabolicOption[];
  sequence?: string;
  preferred?: string;
  alternative?: string;
  notes: string[];
}

export interface FollowUpPlan {
  ongoing: string[];
  formalDurationReview: string[];
  persistentHighRisk: string[];
  ifPersistentHighRisk: string[];
  ifLowOrControlledRisk: string[];
  earlyReviewTriggers: string[];
}

export interface OsteoporosisDecision {
  algorithmVersion: string;
  inScope: boolean;
  scopeNote: string;
  baselineCategory: BaselineCategory;
  baselineReasons: string[];
  specialScenariosPresent: SpecialScenarioFinding[];
  veryHighRiskIndicators: string[];
  clinicalReviewStatus: ReviewStatus;
  finalCategory: FinalCategory;
  rationale: string[];
  routing: string;
  drugSelection: DrugSelection;
  drugSuitabilityReview: string[];
  followUp: FollowUpPlan;
  safetyRules: string[];
  assessmentIncompleteReasons: string[];
}

export const SAFETY_RULES = [...algorithmJson.safety_rules];

export const DEFAULT_ASSESSMENT_STATUS: Record<AssessmentItemId, AssessmentItemStatus> = {
  fracture_history: "unknown",
  dxa_hip_spine: "unknown",
  frax_threshold: "unknown",
  secondary_causes: "unknown",
  falls_frailty: "unknown",
  glucocorticoids: "unknown",
  renal_ckd_mbd: "unknown",
  current_therapy: "unknown",
};

export function emptyAlgorithmInput(): OsteoporosisAlgorithmInput {
  return {
    ageYears: null,
    sex: "",
    postmenopausal: null,
    vertebralFractureCount: null,
    hipFracture: "unknown",
    otherFragilityFracture: "unknown",
    femoralNeckTScore: null,
    totalHipTScore: null,
    lumbarSpineTScore: null,
    fraxAboveNationalThreshold: "unknown",
    recentFragilityFracture: "unknown",
    recentVertebralFracture: "unknown",
    glucocorticoidMgPerDay: null,
    glucocorticoidMonths: null,
    frequentFalls: "unknown",
    fractureOnTreatment: "unknown",
    advancedCkdOrCkdMbd: "unknown",
    assessmentItemStatus: { ...DEFAULT_ASSESSMENT_STATUS },
    clinicalReviewComplete: false,
    ageOver75: false,
    cardiovascularHistoryRomosozumabRestriction: "unknown",
    giIntolerance: "unknown",
    cancerHistory: "unknown",
    adherenceConcern: "unknown",
    currentTherapy: "unknown",
    therapyDurationYears: null,
    secondaryCauseFlags: [],
    hasSecondaryCause: false,
    ckdQualifier: "unknown",
    frailtyLevel: "unknown",
  };
}

export function lowestKnownTScore(input: Pick<OsteoporosisAlgorithmInput, "femoralNeckTScore" | "totalHipTScore" | "lumbarSpineTScore">): number | null {
  const values = [input.femoralNeckTScore, input.totalHipTScore, input.lumbarSpineTScore].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  if (values.length === 0) return null;
  return Math.min(...values);
}

export function hipAndSpineDxaComplete(input: OsteoporosisAlgorithmInput): boolean {
  if (input.assessmentItemStatus.dxa_hip_spine === "obtained") return true;
  const hip = input.femoralNeckTScore != null || input.totalHipTScore != null;
  const spine = input.lumbarSpineTScore != null;
  return hip && spine;
}

function knownYes(v: TriState): boolean {
  return v === "yes";
}

function isUnknown(v: TriState): boolean {
  return v === "unknown";
}

export function evaluateScope(input: OsteoporosisAlgorithmInput): { inScope: boolean; unknown: boolean; note: string } {
  const age = input.ageYears;
  if (input.sex === "female") {
    if (input.postmenopausal === true) {
      return { inScope: true, unknown: false, note: "Postmenopausal woman — within algorithm scope." };
    }
    if (input.postmenopausal === false) {
      return {
        inScope: false,
        unknown: false,
        note: "Premenopausal women are outside this algorithm. Do not apply postmenopausal / male ≥50 thresholds.",
      };
    }
    return { inScope: false, unknown: true, note: "Menopausal status unknown — scope cannot be confirmed." };
  }
  if (input.sex === "male") {
    if (age == null) {
      return { inScope: false, unknown: true, note: "Male patient with unknown age — scope (≥50 years) cannot be confirmed." };
    }
    if (age >= 50) {
      return { inScope: true, unknown: false, note: "Man aged 50 years or older — within algorithm scope." };
    }
    return {
      inScope: false,
      unknown: false,
      note: "Men younger than 50 years are outside this algorithm.",
    };
  }
  return { inScope: false, unknown: true, note: "Sex not recorded — scope cannot be confirmed." };
}

function knownVeryHighCriteria(input: OsteoporosisAlgorithmInput): string[] {
  const reasons: string[] = [];
  const t = lowestKnownTScore(input);
  const vertebral = input.vertebralFractureCount;
  const hip = knownYes(input.hipFracture);
  const hasVertebral = vertebral != null && vertebral >= 1;

  if (vertebral != null && vertebral >= 2) {
    reasons.push("At least 2 vertebral fractures");
  }
  if (hasVertebral && hip) {
    reasons.push("Coexisting vertebral and hip fracture");
  }
  if (t != null && t < -3.5) {
    reasons.push(`T-score ${t.toFixed(1)} < −3.5`);
  }
  if ((hip || hasVertebral) && t != null && t < -3.0) {
    reasons.push(`Hip or vertebral fracture with T-score ${t.toFixed(1)} < −3.0`);
  }
  return reasons;
}

function knownHighCriteria(input: OsteoporosisAlgorithmInput, alreadyVeryHigh: boolean): string[] {
  if (alreadyVeryHigh) return [];
  const reasons: string[] = [];
  const t = lowestKnownTScore(input);
  const vertebral = input.vertebralFractureCount;
  const hip = knownYes(input.hipFracture);
  const hasVertebral = vertebral != null && vertebral >= 1;

  if (knownYes(input.otherFragilityFracture)) {
    reasons.push("Other fragility fracture, including humeral or pelvic fracture");
  }
  if (hip || hasVertebral) {
    reasons.push("Hip or vertebral fracture not meeting very-high-risk criteria");
  }
  if (t != null && t <= -2.5) {
    reasons.push(`T-score ${t.toFixed(1)} ≤ −2.5`);
  }
  if (knownYes(input.fraxAboveNationalThreshold)) {
    reasons.push("FRAX above applicable national treatment threshold");
  }
  return reasons;
}

function highDoseLongGlucocorticoid(input: OsteoporosisAlgorithmInput): boolean {
  const dose = input.glucocorticoidMgPerDay;
  const months = input.glucocorticoidMonths;
  return dose != null && months != null && dose >= 7.5 && months > 3;
}

function anyGlucocorticoidExposure(input: OsteoporosisAlgorithmInput): boolean {
  const dose = input.glucocorticoidMgPerDay;
  const months = input.glucocorticoidMonths;
  if (dose != null && dose >= 5) return true;
  if (months != null && months > 0 && dose != null && dose > 0) return true;
  return false;
}

function glucocorticoidUnknown(input: OsteoporosisAlgorithmInput): boolean {
  if (input.assessmentItemStatus.glucocorticoids === "obtained") {
    return input.glucocorticoidMgPerDay == null || input.glucocorticoidMonths == null;
  }
  if (input.assessmentItemStatus.glucocorticoids === "missing") return true;
  return input.glucocorticoidMgPerDay == null && input.glucocorticoidMonths == null;
}

function reviewSpecialScenarios(input: OsteoporosisAlgorithmInput): SpecialScenarioFinding[] {
  const findings: SpecialScenarioFinding[] = [];

  const recentVert = knownYes(input.recentVertebralFracture);
  const recentOther = knownYes(input.recentFragilityFracture) && !recentVert;
  if (recentVert || recentOther || knownYes(input.recentFragilityFracture)) {
    if (recentVert) {
      findings.push({
        id: "recent_fracture",
        trigger: "Fragility fracture within previous 2 years",
        effect: "Increased imminent refracture risk",
        action: "Flag very-high-risk indicator and specialist assessment under NOGG, even without very low BMD.",
        automaticUpgrade: false,
        veryHighRiskIndicator: true,
        possibleUpgradeAfterReview: false,
      });
    } else if (recentOther || knownYes(input.recentFragilityFracture)) {
      findings.push({
        id: "recent_fracture",
        trigger: "Fragility fracture within previous 2 years",
        effect: "Increased imminent refracture risk",
        action:
          "Reassess site, age, BMD, falls and other risk factors; possible upgrade after clinical review, not automatic very high risk solely from recency.",
        automaticUpgrade: false,
        veryHighRiskIndicator: false,
        possibleUpgradeAfterReview: true,
      });
    }
  }

  if (highDoseLongGlucocorticoid(input)) {
    findings.push({
      id: "glucocorticoids",
      trigger: "Systemic prednisolone-equivalent ≥5 mg/day in supplied table",
      effect: "Dose- and duration-dependent risk; assess glucocorticoid-induced osteoporosis",
      action: "Flag NOGG very-high-risk indicator; prompt specialist assessment.",
      automaticUpgrade: false,
      veryHighRiskIndicator: true,
      possibleUpgradeAfterReview: false,
    });
  } else if (anyGlucocorticoidExposure(input)) {
    findings.push({
      id: "glucocorticoids",
      trigger: "Systemic prednisolone-equivalent ≥5 mg/day in supplied table",
      effect: "Dose- and duration-dependent risk; assess glucocorticoid-induced osteoporosis",
      action:
        "Review dose, duration, fractures, BMD and applicable glucocorticoid guidance; do not automatically label very high risk.",
      automaticUpgrade: false,
      veryHighRiskIndicator: false,
      possibleUpgradeAfterReview: true,
    });
  }

  if (knownYes(input.frequentFalls)) {
    findings.push({
      id: "frequent_falls",
      trigger: "Frequent falls or high falls risk",
      effect: "May increase risk beyond standard FRAX, which does not directly include falls",
      action:
        "Consider upgrade when combined with high baseline risk, frailty, low BMD or recent fracture; provide falls assessment and prevention.",
      automaticUpgrade: false,
      veryHighRiskIndicator: false,
      possibleUpgradeAfterReview: true,
    });
  }

  if (knownYes(input.fractureOnTreatment)) {
    findings.push({
      id: "fracture_on_treatment",
      trigger: "New fragility fracture during osteoporosis treatment",
      action:
        "Review adherence, adequate treatment exposure, administration, secondary causes and BMD response; consider escalation or specialist referral.",
      automaticUpgrade: false,
      veryHighRiskIndicator: false,
      possibleUpgradeAfterReview: true,
    });
  }

  if (knownYes(input.advancedCkdOrCkdMbd)) {
    findings.push({
      id: "advanced_ckd",
      trigger: "Advanced CKD or suspected CKD-MBD",
      action:
        "Individualize fracture assessment; evaluate calcium, phosphate, PTH and alkaline phosphatase with renal/bone specialist input as appropriate. Assess bone turnover and drug suitability.",
      automaticUpgrade: false,
      veryHighRiskIndicator: false,
      possibleUpgradeAfterReview: false,
    });
  }

  return findings;
}

function missingCouldChangeClassification(
  input: OsteoporosisAlgorithmInput,
  knownVH: string[],
  knownHigh: string[],
): string[] {
  if (knownVH.length > 0) return [];

  const missing: string[] = [];
  const t = lowestKnownTScore(input);
  const dxaComplete = hipAndSpineDxaComplete(input);
  const fractureHistoryKnown = input.assessmentItemStatus.fracture_history === "obtained";
  const hasVertebral = input.vertebralFractureCount != null && input.vertebralFractureCount >= 1;
  const hip = knownYes(input.hipFracture);

  if (!fractureHistoryKnown) {
    if (input.vertebralFractureCount == null) {
      missing.push("Vertebral fracture number unknown — ≥2 vertebral fractures would meet very-high-risk criteria.");
    }
    if (isUnknown(input.hipFracture) && hasVertebral) {
      missing.push("Hip-fracture status unknown — coexisting vertebral and hip fracture would be very high risk.");
    }
    if (isUnknown(input.hipFracture) && !hasVertebral) {
      missing.push("Hip-fracture status unknown — a hip fracture would at least meet high-risk criteria.");
    }
    if (isUnknown(input.otherFragilityFracture) && knownHigh.length === 0) {
      missing.push("Other fragility fracture (humeral/pelvic) unknown — could meet high-risk criteria.");
    }
  } else {
    if (hasVertebral && isUnknown(input.hipFracture)) {
      missing.push("Hip-fracture status unknown — coexisting vertebral and hip fracture would be very high risk.");
    }
  }

  if (!dxaComplete || t == null) {
    if ((hip || hasVertebral) && (t == null || t >= -3.0)) {
      missing.push("Complete hip and spine DXA unknown — T-score < −3.0 with hip/vertebral fracture would be very high risk.");
    } else if (t == null || t >= -3.5) {
      missing.push("Complete hip and spine DXA unknown — T-score < −3.5 would be very high risk, and T-score ≤ −2.5 would be high risk.");
    }
  }

  if (input.assessmentItemStatus.frax_threshold !== "obtained" && isUnknown(input.fraxAboveNationalThreshold) && knownHigh.length === 0) {
    missing.push("Country-appropriate FRAX threshold comparison unknown — could meet high-risk criteria.");
  }

  const recentCouldBeVertebral =
    isUnknown(input.recentVertebralFracture) &&
    (knownYes(input.recentFragilityFracture) || isUnknown(input.recentFragilityFracture) || !fractureHistoryKnown);
  if (recentCouldBeVertebral) {
    missing.push("Recent vertebral-fracture status unknown — a vertebral fracture within 2 years is a very-high-risk indicator.");
  }

  if (glucocorticoidUnknown(input)) {
    missing.push(
      "Glucocorticoid dose and duration unknown — prednisolone-equivalent ≥7.5 mg/day for >3 months is a very-high-risk indicator.",
    );
  }

  return missing;
}

function necessaryReviewPending(findings: SpecialScenarioFinding[], reviewComplete: boolean): boolean {
  if (reviewComplete) return false;
  return findings.some((f) => f.possibleUpgradeAfterReview || f.id === "advanced_ckd" || f.id === "fracture_on_treatment");
}

function buildDrugSelection(
  category: FinalCategory,
  findings: SpecialScenarioFinding[],
  input: OsteoporosisAlgorithmInput,
): DrugSelection {
  const notes: string[] = [];
  if (category === "assessment_incomplete") {
    return {
      considerAnabolic: [],
      notes: ["Complete assessment and necessary clinical review before selecting therapy. Do not auto-prescribe."],
    };
  }
  if (category === "below_treatment_threshold") {
    return {
      considerAnabolic: [],
      notes: ["Lifestyle, falls prevention and surveillance. Pharmacotherapy is not indicated on current completed review."],
    };
  }

  if (category === "very_high") {
    const consider: AnabolicOption[] = [
      { drug: "romosozumab", months: 12 },
      { drug: "abaloparatide", months: 18, note: "Source duration; local approved duration varies." },
      { drug: "teriparatide", months: 24 },
    ];
    notes.push("Specialist assessment; consider initial bone-forming therapy, individualized to approvals and suitability.");
    notes.push("An upgrade or very-high-risk flag prompts consideration of bone-forming therapy, not mandatory anabolic treatment.");
    if (findings.some((f) => f.id === "advanced_ckd")) {
      notes.push("Advanced CKD is not an automatic indication for anabolic therapy.");
    }
    return {
      considerAnabolic: consider,
      sequence: "Immediately follow a completed bone-forming course with an appropriate antiresorptive.",
      notes,
    };
  }

  notes.push("Antiresorptive treatment if suitable after drug-suitability review.");
  return {
    considerAnabolic: [],
    preferred: "Oral or IV bisphosphonate, if suitable",
    alternative: "Denosumab with a planned long-term and exit strategy",
    notes,
  };
}

function buildSuitability(input: OsteoporosisAlgorithmInput, findings: SpecialScenarioFinding[]): string[] {
  const rows: string[] = [];
  if (input.ageOver75 || (input.ageYears != null && input.ageYears > 75)) {
    rows.push("Age >75 — factor into agent choice, falls risk and monitoring intensity.");
  }
  if (knownYes(input.advancedCkdOrCkdMbd) || findings.some((f) => f.id === "advanced_ckd")) {
    rows.push("Renal function / CKD-MBD — individualize; assess turnover and drug suitability with specialist input as appropriate.");
  }
  if (knownYes(input.cardiovascularHistoryRomosozumabRestriction)) {
    rows.push("Cardiovascular history — romosozumab restrictions apply; do not bypass contraindications.");
  }
  if (knownYes(input.giIntolerance)) {
    rows.push("GI intolerance — oral bisphosphonate may be unsuitable; consider IV or alternative.");
  }
  if (knownYes(input.cancerHistory)) {
    rows.push("Cancer history — review skeletal malignancy / radiotherapy restrictions for PTH analogues.");
  }
  if (knownYes(input.adherenceConcern)) {
    rows.push("Adherence concerns — prefer supervised IV or 6-monthly injectable regimens when otherwise suitable.");
  }
  rows.push("Sex-specific and local approvals must be checked before prescribing.");
  rows.push("Risk upgrade does not bypass drug contraindications or local prescribing approvals.");
  return rows;
}

function buildFollowUp(input: OsteoporosisAlgorithmInput, category: FinalCategory): FollowUpPlan {
  const fu = algorithmJson.follow_up;
  const formal: string[] = [
    `Oral bisphosphonate: formal duration review at ${fu.formal_duration_review.oral_bisphosphonate_years} years.`,
    `IV bisphosphonate: formal duration review at ${fu.formal_duration_review.iv_bisphosphonate_years} years.`,
    `Denosumab: ${fu.formal_duration_review.denosumab}.`,
  ];

  const persistent = [...fu.persistent_high_risk.source_indicators, fu.persistent_high_risk.additional_requirement];

  const ifPersistent = [
    `Oral bisphosphonate: ${fu.if_persistent_high_risk.oral_bisphosphonate}.`,
    `IV bisphosphonate: ${fu.if_persistent_high_risk.iv_bisphosphonate}.`,
    `Denosumab: ${fu.if_persistent_high_risk.denosumab}.`,
    `New fracture: ${fu.if_persistent_high_risk.new_fracture}`,
  ];

  const ifLow = [
    `Bisphosphonate: ${fu.if_low_or_controlled_risk.bisphosphonate}.`,
    `Denosumab: ${fu.if_low_or_controlled_risk.denosumab}`,
  ];

  if (input.currentTherapy === "denosumab") {
    ifLow.unshift("Denosumab — no drug holiday. Never stop without a planned subsequent antiresorptive strategy.");
  }

  if (category === "below_treatment_threshold") {
    formal.push("No pharmacological duration clock until treatment starts.");
  }

  return {
    ongoing: [...fu.ongoing],
    formalDurationReview: formal,
    persistentHighRisk: persistent,
    ifPersistentHighRisk: ifPersistent,
    ifLowOrControlledRisk: ifLow,
    earlyReviewTriggers: [...fu.early_review_triggers],
  };
}

function uniqueStrings(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function routingFor(category: FinalCategory): string {
  if (category === "assessment_incomplete") {
    return "Complete assessment; do not auto-prescribe or assign low risk.";
  }
  if (category === "very_high") {
    return "Specialist assessment; consider initial bone-forming therapy, individualized to approvals and suitability.";
  }
  if (category === "high") {
    return "Antiresorptive treatment.";
  }
  return "Lifestyle, falls prevention and surveillance.";
}

export function classifyOsteoporosis(input: OsteoporosisAlgorithmInput): OsteoporosisDecision {
  const scope = evaluateScope(input);
  const baselineVH = knownVeryHighCriteria(input);
  const baselineHigh = knownHighCriteria(input, baselineVH.length > 0);
  const findings = reviewSpecialScenarios(input);

  const vhFromScenarios = findings.filter((f) => f.veryHighRiskIndicator).map((f) => f.action);
  const veryHighRiskIndicators = [...baselineVH, ...findings.filter((f) => f.veryHighRiskIndicator).map((f) => f.trigger + " — " + f.action)];

  const baselineCategory: BaselineCategory =
    baselineVH.length > 0 ? "very_high" : baselineHigh.length > 0 ? "high" : "below_threshold_or_incomplete";

  const missing = scope.unknown
    ? [scope.note, ...missingCouldChangeClassification(input, baselineVH, baselineHigh)]
    : missingCouldChangeClassification(input, [...baselineVH, ...vhFromScenarios], baselineHigh);

  const reviewPending = necessaryReviewPending(findings, input.clinicalReviewComplete);
  const clinicalReviewStatus: ReviewStatus = input.clinicalReviewComplete ? "complete" : "pending";

  // Existing very-high-risk status is not downgraded by absence of special scenarios.
  let finalCategory: FinalCategory;
  const assessmentOrReviewBlocksLow =
    missing.length > 0 || (reviewPending && baselineCategory === "below_threshold_or_incomplete") || !scope.inScope;

  if (!scope.inScope) {
    finalCategory = "assessment_incomplete";
  } else if (veryHighRiskIndicators.length > 0 && missing.length === 0) {
    finalCategory = "very_high";
  } else if (veryHighRiskIndicators.length > 0 && missing.length > 0) {
    // Known VH indicators stand; missing data cannot downgrade.
    finalCategory = "very_high";
  } else if (missing.length > 0) {
    finalCategory = "assessment_incomplete";
  } else if (reviewPending && baselineCategory === "below_threshold_or_incomplete") {
    finalCategory = "assessment_incomplete";
  } else if (baselineCategory === "high") {
    finalCategory = "high";
  } else if (baselineCategory === "very_high") {
    finalCategory = "very_high";
  } else if (input.clinicalReviewComplete) {
    finalCategory = "below_treatment_threshold";
  } else {
    finalCategory = "assessment_incomplete";
  }

  const rationale: string[] = [];
  rationale.push(`Baseline classification (order very_high → high → below_threshold_or_incomplete): ${baselineCategory.replace(/_/g, " ")}.`);
  if (baselineVH.length) rationale.push(`Very-high baseline: ${baselineVH.join("; ")}.`);
  if (baselineHigh.length) rationale.push(`High baseline: ${baselineHigh.join("; ")}.`);
  if (findings.length) {
    rationale.push(`Special-scenario review (${findings.length}): ${findings.map((f) => f.id).join(", ")}.`);
  } else {
    rationale.push("Special-scenario review completed: no triggered modifiers. Existing very-high-risk status is not downgraded by their absence.");
  }
  rationale.push("No universal one-category upgrade and no invented FRAX multiplier were applied.");
  if (finalCategory === "assessment_incomplete") {
    rationale.push("Unknown values were not treated as negative. Missing data that could change classification returns assessment_incomplete.");
  }
  if (!scope.inScope) rationale.push(scope.note);

  const drugSelection = buildDrugSelection(finalCategory, findings, input);
  if (knownYes(input.fractureOnTreatment)) {
    drugSelection.notes.push("A single on-treatment fracture does not automatically establish treatment failure.");
  }
  if (input.currentTherapy === "denosumab") {
    drugSelection.notes.push("Never stop denosumab without a planned subsequent antiresorptive strategy.");
  }

  return {
    algorithmVersion: ALGORITHM_VERSION,
    inScope: scope.inScope,
    scopeNote: scope.note,
    baselineCategory,
    baselineReasons: baselineVH.length ? baselineVH : baselineHigh,
    specialScenariosPresent: findings,
    veryHighRiskIndicators,
    clinicalReviewStatus,
    finalCategory,
    rationale,
    routing: routingFor(finalCategory),
    drugSelection,
    drugSuitabilityReview: buildSuitability(input, findings),
    followUp: buildFollowUp(input, finalCategory),
    safetyRules: SAFETY_RULES,
    assessmentIncompleteReasons: uniqueStrings([
      ...(!scope.inScope ? [scope.note] : []),
      ...missing,
      ...(reviewPending && baselineCategory === "below_threshold_or_incomplete"
        ? ["Necessary clinical review of special scenarios is pending — do not default to low risk or automatic treatment."]
        : []),
    ]),
  };
}

export function denosumabHolidayMessage(): string {
  return algorithmJson.follow_up.if_low_or_controlled_risk.denosumab;
}

/** Rebuild routing and drug guidance after a closed-category REPLACE (e.g. high-confidence Jev Choice). */
export function withFinalCategory(
  input: OsteoporosisAlgorithmInput,
  decision: OsteoporosisDecision,
  category: FinalCategory,
  source: "deterministic" | "jev_replace" = "deterministic",
): OsteoporosisDecision {
  if (category === decision.finalCategory && source === "deterministic") return decision;
  const rationale =
    source === "jev_replace"
      ? [
          ...decision.rationale.filter((r) => !r.startsWith("Final category replaced by high-confidence Jev")),
          `Final category replaced by high-confidence Jev Choice (${category.replace(/_/g, " ")}).`,
        ]
      : decision.rationale;
  return {
    ...decision,
    finalCategory: category,
    routing: routingFor(category),
    drugSelection: buildDrugSelection(category, decision.specialScenariosPresent, input),
    followUp: buildFollowUp(input, category),
    rationale,
  };
}

export function categoryLabel(category: FinalCategory | BaselineCategory): string {
  switch (category) {
    case "very_high":
      return "Very high risk";
    case "high":
      return "High risk";
    case "below_treatment_threshold":
      return "Below treatment threshold";
    case "below_threshold_or_incomplete":
      return "Below threshold or incomplete";
    case "assessment_incomplete":
      return "Assessment incomplete";
    default:
      return category;
  }
}

export function categoryTone(category: FinalCategory): "danger" | "warning" | "success" | "info" {
  if (category === "very_high") return "danger";
  if (category === "high") return "warning";
  if (category === "below_treatment_threshold") return "success";
  return "info";
}
