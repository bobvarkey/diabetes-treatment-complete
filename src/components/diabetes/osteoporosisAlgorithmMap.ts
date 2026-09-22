/**
 * Maps the osteoporosis navigator intake onto algorithm v2.0 inputs.
 * FRAX percentages are intentionally ignored — only a national-threshold
 * comparison is consumed.
 */

import {
  ASSESSMENT_ITEM_IDS,
  DEFAULT_ASSESSMENT_STATUS,
  classifyOsteoporosis,
  type AssessmentItemId,
  type AssessmentItemStatus,
  type CurrentTherapy,
  type OsteoporosisAlgorithmInput,
  type OsteoporosisDecision,
  type TriState,
} from "./osteoporosisAlgorithm";
import {
  CKD_SECONDARY_CAUSE_FLAG,
  actualSecondaryCauseFlags,
  hasSecondaryCause,
  secondaryCausesReviewed,
} from "./secondaryCauses";
import {
  earlyMenopauseImpliesPostmenopausal,
  normalizeSecondaryCauseQualifiers,
  qualifiersForSelectedFlags,
  type SecondaryCauseQualifiers,
} from "./secondaryCauseQualifiers";
import {
  ckdQualifierReviewed,
  normalizeCkdQualifier,
  triStateFromCkdQualifier,
  type CkdQualifier,
} from "./ckdQualifier";
import {
  combineFallsAndFrailty,
  frailtyLevelReviewed,
  normalizeFrailtyLevel,
  type FrailtyLevel,
} from "./frailtyLevel";

export interface NavigatorFractureEntry {
  site: "hip" | "vertebral" | "distal-radius" | "proximal_humerus" | "pelvis" | "other";
  date?: string;
  fragilityFracture: "yes" | "no" | "uncertain";
  occurredDuringTreatment: "yes" | "no" | "unknown";
}

export interface NavigatorIntake {
  age: string;
  sex: "" | "female" | "male";
  postmenopausal: boolean;
  fragilityFractureTypes: Array<
    "none" | "hip" | "vertebral" | "distal-radius" | "humerus" | "other"
  >;
  fractureHistoryComplete: "yes" | "no" | "unknown";
  fractureHistory: NavigatorFractureEntry[];
  femoralNeckTScore: string;
  totalHipTScore: string;
  lumbarSpineTScore: string;
  fraxAboveNationalThreshold: TriState;
  fallsInPast12Months: string;
  injuriousFallInPast12Months: TriState;
  clinicianIdentifiedHighFallsRisk: TriState;
  prednisoneEquivalentMgPerDay: string;
  steroidDurationMonths: string;
  currentDrug:
    | "unknown"
    | "none"
    | "oral-bp"
    | "iv-zoledronate"
    | "denosumab"
    | "teriparatide"
    | "romosozumab";
  lastDenosumabDate: string;
  denosumabDurationYears: string;
  lastTeriparatideDate: string;
  crcl: string;
  secondaryCauseFlags: string[];
  secondaryCauseQualifiers?: SecondaryCauseQualifiers;
  ckdQualifier?: CkdQualifier;
  frailtyLevel?: FrailtyLevel;
  currentSmoking?: boolean;
  alcohol3OrMore?: boolean;
  clinicalReviewComplete: boolean;
  /** Live-form overrides. When set to yes/no they win over derived history. */
  hipFracture?: TriState;
  vertebralFractureCount?: string;
  otherFragilityFracture?: TriState;
  recentFragilityFracture?: TriState;
  recentVertebralFracture?: TriState;
  fractureOnTreatment?: TriState;
  advancedCkdOrCkdMbd?: TriState;
  frequentFalls?: TriState;
}

function num(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function daysBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function mapTherapy(drug: NavigatorIntake["currentDrug"]): CurrentTherapy {
  if (drug === "oral-bp") return "oral_bisphosphonate";
  if (drug === "iv-zoledronate") return "iv_bisphosphonate";
  if (drug === "denosumab") return "denosumab";
  if (drug === "teriparatide" || drug === "romosozumab") return "anabolic";
  if (drug === "none") return "none";
  return "unknown";
}

function preferTri(explicit: TriState | undefined, derived: TriState): TriState {
  if (explicit === "yes" || explicit === "no") return explicit;
  if (derived !== "unknown") return derived;
  return explicit ?? "unknown";
}

function confirmed(p: NavigatorIntake) {
  return p.fractureHistory.filter((f) => f.fragilityFracture === "yes");
}

export function mapPatientInputToAlgorithm(p: NavigatorIntake): OsteoporosisAlgorithmInput {
  const today = new Date().toISOString().split("T")[0];
  const yes = confirmed(p);
  const vertebralEntries = yes.filter((f) => f.site === "vertebral");
  const hipFromHistory = yes.some((f) => f.site === "hip");
  const hipFromTypes = p.fragilityFractureTypes.includes("hip");
  const vertebralFromTypes = p.fragilityFractureTypes.includes("vertebral");
  const otherFromHistory = yes.some(
    (f) =>
      f.site === "proximal_humerus" ||
      f.site === "pelvis" ||
      f.site === "other" ||
      f.site === "distal-radius",
  );
  const otherFromTypes = p.fragilityFractureTypes.some(
    (t) => t === "humerus" || t === "other" || t === "distal-radius",
  );

  const historyComplete = p.fractureHistoryComplete === "yes";
  const derivedVertebralCount = historyComplete
    ? vertebralEntries.length || (vertebralFromTypes ? 1 : 0)
    : vertebralEntries.length > 0
      ? vertebralEntries.length
      : vertebralFromTypes
        ? 1
        : p.fractureHistoryComplete === "unknown" || p.fractureHistoryComplete === "no"
          ? null
          : 0;
  const explicitVertebral =
    p.vertebralFractureCount != null && String(p.vertebralFractureCount).trim() !== ""
      ? num(String(p.vertebralFractureCount))
      : null;
  const vertebralCount = explicitVertebral != null ? explicitVertebral : derivedVertebralCount;

  const derivedHip: TriState =
    hipFromHistory || hipFromTypes ? "yes" : historyComplete ? "no" : "unknown";
  const derivedOther: TriState =
    otherFromHistory || otherFromTypes ? "yes" : historyComplete ? "no" : "unknown";
  const hipFracture: TriState = preferTri(p.hipFracture, derivedHip);
  const otherFragilityFracture: TriState = preferTri(p.otherFragilityFracture, derivedOther);

  const recentYes = yes.filter((f) => {
    const d = daysBetween(f.date, today);
    return d != null && d <= 730;
  });
  const datedYes = yes.filter((f) => f.date);
  const derivedRecent: TriState =
    recentYes.length > 0
      ? "yes"
      : historyComplete && datedYes.length === yes.length
        ? "no"
        : yes.length > 0
          ? "unknown"
          : historyComplete
            ? "no"
            : "unknown";
  const recentFragilityFracture: TriState = preferTri(p.recentFragilityFracture, derivedRecent);
  const derivedRecentVert: TriState = recentYes.some((f) => f.site === "vertebral")
    ? "yes"
    : historyComplete &&
        vertebralEntries.every((f) => f.date && (daysBetween(f.date, today) ?? 9999) > 730)
      ? "no"
      : vertebralEntries.length > 0 || recentFragilityFracture === "yes"
        ? "unknown"
        : historyComplete
          ? "no"
          : "unknown";
  const recentVertebralFracture: TriState = preferTri(p.recentVertebralFracture, derivedRecentVert);

  const derivedOnTx: TriState = yes.some((f) => f.occurredDuringTreatment === "yes")
    ? "yes"
    : historyComplete && yes.every((f) => f.occurredDuringTreatment === "no")
      ? "no"
      : yes.length > 0
        ? "unknown"
        : historyComplete
          ? "no"
          : "unknown";
  const fractureOnTreatment: TriState = preferTri(p.fractureOnTreatment, derivedOnTx);

  const age = num(p.age);
  const fn = num(p.femoralNeckTScore);
  const th = num(p.totalHipTScore);
  const ls = num(p.lumbarSpineTScore);
  const dose = num(p.prednisoneEquivalentMgPerDay);
  const months = num(p.steroidDurationMonths);
  const crcl = num(p.crcl);

  const derivedFalls: TriState =
    p.clinicianIdentifiedHighFallsRisk === "yes" ||
    p.injuriousFallInPast12Months === "yes" ||
    (num(p.fallsInPast12Months) != null && (num(p.fallsInPast12Months) as number) >= 2)
      ? "yes"
      : p.clinicianIdentifiedHighFallsRisk === "no" && p.injuriousFallInPast12Months === "no"
        ? "no"
        : "unknown";
  const frailty = normalizeFrailtyLevel(p.frailtyLevel);
  const frequentFalls: TriState = combineFallsAndFrailty(
    preferTri(p.frequentFalls, derivedFalls),
    frailty,
  );

  const actualFlags = actualSecondaryCauseFlags(p.secondaryCauseFlags);
  const reviewedSecondary = secondaryCausesReviewed(p.secondaryCauseFlags);
  const hasCause = hasSecondaryCause(p.secondaryCauseFlags);
  const secondaryQualifiers = qualifiersForSelectedFlags(
    actualFlags,
    normalizeSecondaryCauseQualifiers(p.secondaryCauseQualifiers),
  );
  const postmenopausal: boolean | null =
    p.sex === "female"
      ? p.postmenopausal || earlyMenopauseImpliesPostmenopausal(actualFlags, secondaryQualifiers)
      : null;
  const qualifier = normalizeCkdQualifier(p.ckdQualifier);
  const fromQualifier = triStateFromCkdQualifier(qualifier);
  const derivedCkd: TriState =
    actualFlags.includes(CKD_SECONDARY_CAUSE_FLAG) || (crcl != null && crcl < 30)
      ? "yes"
      : crcl != null || reviewedSecondary
        ? "no"
        : "unknown";
  const advancedCkd: TriState =
    fromQualifier != null ? fromQualifier : preferTri(p.advancedCkdOrCkdMbd, derivedCkd);

  const assessmentItemStatus: Record<AssessmentItemId, AssessmentItemStatus> = {
    ...DEFAULT_ASSESSMENT_STATUS,
  };
  assessmentItemStatus.fracture_history =
    p.fractureHistoryComplete === "yes"
      ? "obtained"
      : p.fractureHistoryComplete === "no"
        ? "missing"
        : "unknown";
  assessmentItemStatus.dxa_hip_spine =
    (fn != null || th != null) && ls != null
      ? "obtained"
      : fn != null || th != null || ls != null
        ? "missing"
        : "unknown";
  assessmentItemStatus.frax_threshold =
    p.fraxAboveNationalThreshold === "unknown" ? "unknown" : "obtained";
  assessmentItemStatus.secondary_causes = reviewedSecondary ? "obtained" : "unknown";
  assessmentItemStatus.falls_frailty =
    frequentFalls === "unknown" && !frailtyLevelReviewed(frailty) ? "unknown" : "obtained";
  assessmentItemStatus.glucocorticoids =
    dose != null && months != null
      ? "obtained"
      : dose != null || months != null
        ? "missing"
        : "unknown";
  assessmentItemStatus.renal_ckd_mbd =
    ckdQualifierReviewed(qualifier) ||
    p.advancedCkdOrCkdMbd === "yes" ||
    p.advancedCkdOrCkdMbd === "no" ||
    crcl != null ||
    actualFlags.includes(CKD_SECONDARY_CAUSE_FLAG)
      ? "obtained"
      : "unknown";
  assessmentItemStatus.current_therapy =
    p.currentDrug === "unknown"
      ? "unknown"
      : p.currentDrug !== "none" ||
          p.lastDenosumabDate ||
          p.lastTeriparatideDate ||
          p.currentDrug === "none"
        ? "obtained"
        : "unknown";

  return {
    ageYears: age,
    sex: p.sex,
    postmenopausal,
    vertebralFractureCount: vertebralCount,
    hipFracture,
    otherFragilityFracture,
    femoralNeckTScore: fn,
    totalHipTScore: th,
    lumbarSpineTScore: ls,
    fraxAboveNationalThreshold: p.fraxAboveNationalThreshold,
    recentFragilityFracture,
    recentVertebralFracture,
    glucocorticoidMgPerDay: dose,
    glucocorticoidMonths: months,
    frequentFalls,
    fractureOnTreatment,
    advancedCkdOrCkdMbd: advancedCkd,
    assessmentItemStatus,
    clinicalReviewComplete: p.clinicalReviewComplete,
    ageOver75: age != null && age > 75,
    cardiovascularHistoryRomosozumabRestriction: "unknown",
    giIntolerance: "unknown",
    cancerHistory: "unknown",
    adherenceConcern: "unknown",
    currentTherapy: mapTherapy(p.currentDrug),
    therapyDurationYears: num(p.denosumabDurationYears),
    secondaryCauseFlags: actualFlags,
    hasSecondaryCause: hasCause,
    ckdQualifier: qualifier,
    frailtyLevel: frailty,
    secondaryCauseQualifiers: secondaryQualifiers,
  };
}

export function assessmentProgress(status: Record<AssessmentItemId, AssessmentItemStatus>): {
  obtained: number;
  total: number;
} {
  const obtained = ASSESSMENT_ITEM_IDS.filter((id) => status[id] === "obtained").length;
  return { obtained, total: ASSESSMENT_ITEM_IDS.length };
}

/** Live form → classification with no submit step. */
export function classifyLiveIntake(p: NavigatorIntake): {
  mapped: OsteoporosisAlgorithmInput;
  decision: OsteoporosisDecision;
} {
  const mapped = mapPatientInputToAlgorithm(p);
  return { mapped, decision: classifyOsteoporosis(mapped) };
}
