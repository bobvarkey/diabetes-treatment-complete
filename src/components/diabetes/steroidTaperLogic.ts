export const GLUCOCORTICOID_EQUIVALENTS = {
  Prednisone: 5,
  Prednisolone: 5,
  Methylprednisolone: 4,
  Hydrocortisone: 20,
  Dexamethasone: 0.75,
  Deflazacort: 6,
  Triamcinolone: 4,
  Betamethasone: 0.6,
} as const;

export type Glucocorticoid = keyof typeof GLUCOCORTICOID_EQUIVALENTS;
export type TaperPace = "faster" | "standard" | "slower";

export interface TaperStep {
  phase: "High dose" | "Moderate dose" | "Low dose" | "Physiologic / recovery";
  prednisoneEquivalentMg: number;
  selectedDrugMg: number;
  holdWeeks: number;
  guidance: string;
}

export interface EligibilityInput {
  durationWeeks: number;
  diseaseControlled: boolean;
  currentDoseNoLongerRequired: boolean;
  excludedScenario: boolean;
  adrenalCrisisConcern: boolean;
  repeatedRecentCourses: boolean;
}

export interface EligibilityResult {
  status: "blocked" | "short-course" | "taper";
  title: string;
  detail: string;
}

export function prednisoneEquivalent(drug: Glucocorticoid, doseMg: number): number {
  return (doseMg / GLUCOCORTICOID_EQUIVALENTS[drug]) * 5;
}

export function selectedDrugDose(drug: Glucocorticoid, prednisoneEquivalentMg: number): number {
  return (prednisoneEquivalentMg / 5) * GLUCOCORTICOID_EQUIVALENTS[drug];
}

export function assessTaperEligibility(input: EligibilityInput): EligibilityResult {
  if (input.adrenalCrisisConcern) {
    return {
      status: "blocked",
      title: "Emergency assessment required",
      detail: "Do not generate or follow a taper when adrenal crisis is suspected. Give emergency glucocorticoid treatment and urgent supportive care without waiting for confirmatory testing.",
    };
  }
  if (input.excludedScenario) {
    return {
      status: "blocked",
      title: "Outside this framework",
      detail: "This adult systemic-withdrawal framework does not cover known primary adrenal insufficiency, intentional adrenal replacement, acute adrenal crisis, or non-systemic exposure without substantial systemic absorption.",
    };
  }
  if (!input.diseaseControlled || !input.currentDoseNoLongerRequired) {
    return {
      status: "blocked",
      title: "Taper pathway not yet available",
      detail: "Confirm that the underlying disease is adequately controlled and that glucocorticoid therapy is no longer required at the current dose before beginning a taper.",
    };
  }
  if (input.durationWeeks < 3 && !input.repeatedRecentCourses) {
    return {
      status: "short-course",
      title: "HPA-protection taper usually not required",
      detail: "For systemic exposure under 3–4 weeks, most patients can stop without tapering solely to prevent HPA-axis suppression. The underlying disease may still require a disease-specific taper.",
    };
  }
  return {
    status: "taper",
    title: "Individualized taper may proceed",
    detail: "Reduce relatively rapidly at high supraphysiologic doses, then slow the taper from 10 mg toward the physiologic range of about 4–6 mg/day prednisone or prednisolone equivalent.",
  };
}

function stepRule(current: number) {
  if (current > 40) return { decrement: 10, weeks: 1, phase: "High dose" as const, guidance: "Reduce by 5–10 mg every 1–2 weeks while disease control remains secure." };
  if (current > 20) return { decrement: 5, weeks: 1, phase: "High dose" as const, guidance: "Reduce by 5 mg every 1–2 weeks and monitor disease activity." };
  if (current > 10) return { decrement: 2.5, weeks: 2, phase: "Moderate dose" as const, guidance: "Reduce by 2.5 mg every 1–4 weeks." };
  if (current > 5) return { decrement: 1, weeks: 3, phase: "Low dose" as const, guidance: "Reduce by 1 mg every 2–4 weeks; withdrawal and adrenal symptoms become more relevant." };
  return { decrement: 1, weeks: 4, phase: "Physiologic / recovery" as const, guidance: "Use an individualized slow taper or assess HPA-axis recovery." };
}

function paceWeeks(base: number, pace: TaperPace): number {
  if (pace === "faster") return Math.max(1, Math.ceil(base / 2));
  if (pace === "slower") return base * 2;
  return base;
}

export function buildTaperSchedule(
  drug: Glucocorticoid,
  startPrednisoneEquivalentMg: number,
  targetPrednisoneEquivalentMg: number,
  pace: TaperPace,
): TaperStep[] {
  if (
    !Number.isFinite(startPrednisoneEquivalentMg) ||
    !Number.isFinite(targetPrednisoneEquivalentMg) ||
    startPrednisoneEquivalentMg <= 0 ||
    targetPrednisoneEquivalentMg < 0 ||
    targetPrednisoneEquivalentMg >= startPrednisoneEquivalentMg
  ) return [];

  const steps: TaperStep[] = [];
  let current = startPrednisoneEquivalentMg;
  let guard = 0;
  while (current > targetPrednisoneEquivalentMg + 0.001 && guard < 100) {
    const rule = stepRule(current);
    const next = Math.max(targetPrednisoneEquivalentMg, Math.round((current - rule.decrement) * 100) / 100);
    steps.push({
      phase: rule.phase,
      prednisoneEquivalentMg: next,
      selectedDrugMg: Math.round(selectedDrugDose(drug, next) * 100) / 100,
      holdWeeks: paceWeeks(rule.weeks, pace),
      guidance: rule.guidance,
    });
    current = next;
    guard += 1;
  }
  return steps;
}

export function interpretMorningCortisol(value: number | null, unit: "nmol/L" | "µg/dL") {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  const micrograms = unit === "nmol/L" ? value / 27.6 : value;
  if (micrograms < 3) return { level: "low" as const, summary: "Adrenal insufficiency is likely", action: "Continue physiologic glucocorticoid coverage, provide sick-day advice, and seek endocrine review." };
  if (micrograms <= 15) return { level: "indeterminate" as const, summary: "HPA-axis recovery is indeterminate", action: "Consider ACTH stimulation testing and interpret with the local assay and endocrine protocol." };
  return { level: "recovered" as const, summary: "Adrenal insufficiency is unlikely", action: "If the underlying disease permits, withdrawal may be completed with clinical and local assay review." };
}

export interface ClinicalBranchInput {
  diseaseFlare: boolean;
  withdrawalSymptoms: boolean;
  adrenalSymptoms: boolean;
  crisisSymptoms: boolean;
}

export function clinicalResponse(input: ClinicalBranchInput) {
  if (input.crisisSymptoms) return { level: "danger" as const, title: "Possible adrenal crisis", action: "Emergency assessment and glucocorticoid treatment are required now; do not delay for test results." };
  if (input.diseaseFlare) return { level: "danger" as const, title: "Possible underlying disease flare", action: "Hold the taper, assess disease activity, and consider returning to the last effective dose or adjusting steroid-sparing treatment." };
  if (input.adrenalSymptoms) return { level: "warning" as const, title: "Possible adrenal insufficiency", action: "Maintain physiologic coverage, provide sick-day advice, and consider morning cortisol or endocrine assessment when appropriate." };
  if (input.withdrawalSymptoms) return { level: "warning" as const, title: "Possible glucocorticoid withdrawal syndrome", action: "Consider returning temporarily to the most recently tolerated dose and resuming with smaller reductions or longer intervals." };
  return { level: "info" as const, title: "No active symptom branch selected", action: "Continue monitoring disease activity, withdrawal symptoms, and adrenal-insufficiency features at each step." };
}
