// Pure logic for the denosumab stop / transition planner.
// Extracted so bridging windows, zoledronate dose selection, and CrCl-based
// safety branches can be unit-tested independently of the React UI.

export type Duration = "short" | "long"; // <2.5 y vs ≥2.5 y
export type TransitionPlan = "zoledronate" | "oral_bp" | "continue";

export interface BridgingWindow {
  /** Earliest recommended date to give the follow-on antiresorptive (6 mo). */
  start: Date;
  /** End of the ideal window (7 mo). */
  end: Date;
  /** Hard deadline after which rebound-fracture risk climbs sharply (9 mo). */
  hard: Date;
}

/**
 * Compute the bridging window from the date of the LAST denosumab dose.
 * Ideal: 6–7 months post-dose. Hard deadline: 9 months post-dose.
 * Returns null for missing / unparseable input.
 */
export function bridgingWindow(lastDoseISO: string): BridgingWindow | null {
  if (!lastDoseISO) return null;
  const d = new Date(lastDoseISO);
  if (isNaN(d.getTime())) return null;
  const start = new Date(d); start.setMonth(start.getMonth() + 6);
  const end = new Date(d); end.setMonth(end.getMonth() + 7);
  const hard = new Date(d); hard.setMonth(hard.getMonth() + 9);
  return { start, end, hard };
}

export interface ZolPlan {
  /** Number of scheduled zoledronate infusions in the bridge. */
  infusions: 0 | 1 | 2;
  /** Months after last denosumab dose for each infusion. */
  monthsAfterLastDose: number[];
  doseMg: 5 | null;
  notes: string[];
}

/**
 * Zoledronate dose / count selection for a denosumab-stop bridge.
 * - Short-duration (<2.5 y) denosumab: single 5 mg IV at 6 mo.
 * - Long-duration (≥2.5 y) or prior vertebral fracture: two 5 mg IV
 *   infusions at 0 and ~6 mo (i.e. months 6 and 12 after last denosumab dose).
 */
export function zoledronatePlan(duration: Duration, priorVertFx: boolean): ZolPlan {
  const needsTwo = duration === "long" || priorVertFx;
  if (needsTwo) {
    return {
      infusions: 2,
      monthsAfterLastDose: [6, 12],
      doseMg: 5,
      notes: [
        "Two zoledronate infusions are usually needed to fully suppress rebound turnover.",
        duration === "long" ? "≥ 2.5 y of denosumab drives higher rebound turnover." : "",
        priorVertFx ? "Prior vertebral fracture — very high rebound-fracture risk." : "",
      ].filter(Boolean),
    };
  }
  return {
    infusions: 1,
    monthsAfterLastDose: [6],
    doseMg: 5,
    notes: ["Short-duration denosumab: single zoledronate infusion at 6 months."],
  };
}

export type Severity = "ok" | "info" | "warning" | "danger";

export interface SafetyDecision {
  severity: Severity;
  /** Whether the currently selected plan is safe / allowed. */
  allowed: boolean;
  /** Recommended plan if the requested one is unsafe. */
  recommendedPlan: TransitionPlan;
  messages: string[];
}

/**
 * CrCl-based safety branching for the chosen transition plan.
 * - CrCl < 35 mL/min: zoledronate contraindicated → recommend oral BP or continuing denosumab.
 * - CrCl 35–59: caution, hydrate, verify vitamin D.
 * - CrCl ≥ 60 or unknown-but-plan!=zoledronate: allowed.
 */
export function crClSafety(plan: TransitionPlan, crCl: number | null): SafetyDecision {
  const messages: string[] = [];
  if (plan === "continue") {
    return { severity: "info", allowed: true, recommendedPlan: "continue", messages: ["Continuing denosumab — no bridge required."] };
  }
  if (crCl === null || isNaN(crCl)) {
    messages.push("CrCl not entered — check renal function before any bisphosphonate.");
    return { severity: "warning", allowed: plan !== "zoledronate", recommendedPlan: plan, messages };
  }
  if (plan === "zoledronate") {
    if (crCl < 35) {
      return {
        severity: "danger",
        allowed: false,
        recommendedPlan: "oral_bp",
        messages: [
          `CrCl ${crCl} mL/min < 35 — zoledronate is contraindicated.`,
          "Switch to an oral bisphosphonate (alendronate/risedronate) or continue denosumab.",
        ],
      };
    }
    if (crCl < 60) {
      return {
        severity: "warning",
        allowed: true,
        recommendedPlan: "zoledronate",
        messages: [`CrCl ${crCl} mL/min — hydrate, confirm 25-OH-D ≥ 30 ng/mL and normal corrected Ca before infusion.`],
      };
    }
    return { severity: "ok", allowed: true, recommendedPlan: "zoledronate", messages: [`CrCl ${crCl} mL/min — safe for IV zoledronate.`] };
  }
  // oral_bp
  if (crCl < 30) {
    return {
      severity: "danger",
      allowed: false,
      recommendedPlan: "continue",
      messages: [`CrCl ${crCl} mL/min < 30 — oral bisphosphonates also contraindicated; continue denosumab under specialist care.`],
    };
  }
  return { severity: "ok", allowed: true, recommendedPlan: "oral_bp", messages: [`CrCl ${crCl} mL/min — oral bisphosphonate acceptable.`] };
}
