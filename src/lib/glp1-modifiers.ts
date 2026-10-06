// GLP-1RA modifier layer — pure decision engine layered on top of the base
// PreScreen rules in Glp1ScreeningApp.tsx. Structure mirrors the
// clinician-supplied modifier profile (v1):
//
//   absolute_contraindications → derived from the hard-stop inputs; any true ⇒ avoid
//   strong_cautions            → enum / numeric inputs; worst band ⇒ defer
//   conditional_risks          → structured risks with a selected plan;
//                                plan choices like defer_until_surgical_management ⇒ defer
//
// Outputs: decision ∈ { proceed_with_plan, defer, avoid } + follow_up_plan
// (visit interval, planned labs, stop rules). Escalation is monotonic: the
// worst fired tier wins; absolute contraindications are the only path to
// "avoid" (per the profile taxonomy).

export type ModifierDecision = "proceed_with_plan" | "defer" | "avoid";

export type PancreatitisHistory = "none" | "single_resolved" | "recurrent" | "chronic";
export type GastroparesisSeverity = "none" | "mild" | "moderate" | "severe";
export type GallbladderStatus = "none" | "asymptomatic_stones" | "prior_cholecystectomy" | "recent_biliary_event";
export type GallbladderPlan = "none" | "counsel_and_monitor" | "defer_until_surgical_management" | "consider_UDCA";
export type PancreatitisRiskPlan = "none" | "optimize_TG_and_alcohol" | "counsel_symptoms";
export type RetinopathyPlan = "none" | "ensure_retinal_screening_before_start";
export type RenalDehydrationPlan = "none" | "hydration_education_and_sick_day_rules";
export type ThyroidNonMtcPlan = "none" | "counsel_thyroid_tumor_symptoms";
export type BaselineGiSymptoms = "none" | "mild_nausea" | "moderate_nausea_vomiting" | "severe_gi_symptoms";
export type EatingDisorderScreen = "negative" | "equivocal" | "positive";
export type CkdStage = "none" | "1" | "2" | "3" | "4" | "5";

export type AbsoluteContraindications = {
  MTC_personal_or_family: boolean;
  MEN2: boolean;
  hypersensitivity_to_GLP1_RA: boolean;
  pregnancy_or_breastfeeding: boolean;
  active_eating_disorder_unsafe: boolean;
};

export type RetinopathyBlock = {
  history: boolean;
  last_exam_date: string; // yyyy-mm-dd or "" (not recorded)
  proliferative: boolean;
  plan: RetinopathyPlan;
};

// Form state mirrors the profile JSON. Numeric fields are kept as strings
// ("" = unknown) because the UI collects them as free text; the engine
// parses them via numOrNull().
export type Glp1ModifierForm = {
  strong_cautions: {
    history_of_pancreatitis: PancreatitisHistory;
    gastroparesis_severity: GastroparesisSeverity;
    renal_function: {
      eGFR: string; // mL/min/1.73m², "" = unknown
      exenatide_BID_allowed: boolean;
      exenatide_QW_allowed: boolean;
    };
    severe_liver_disease: boolean;
    uncontrolled_psychiatric_or_subuse: boolean; // key preserved verbatim from the profile JSON
  };
  conditional_risks: {
    gallbladder: {
      status: GallbladderStatus;
      last_event_months_ago: string; // "" = unknown
      plan: GallbladderPlan;
    };
    pancreatitis_risk: {
      alcohol_heavy: boolean;
      triglycerides_mmol_L: string; // "" = unknown
      known_gallstones: boolean;
      plan: PancreatitisRiskPlan;
    };
    renal_dehydration_risk: {
      CKD_stage: CkdStage;
      diuretics: boolean;
      plan: RenalDehydrationPlan;
    };
    thyroid_non_MTC: {
      history_goiter_nodules: boolean;
      plan: ThyroidNonMtcPlan;
    };
    GI_and_eating_behavior: {
      baseline_GI_symptoms: BaselineGiSymptoms;
      eating_disorder_screen: EatingDisorderScreen;
      plan: "none" | "slow_titration_and_GI_support";
    };
  };
};

export type Glp1ModifierResult = {
  absolute_contraindications: AbsoluteContraindications;
  decision: ModifierDecision;
  bullets: ModifierBullet[];
  exenatide_effective: { BID_allowed: boolean; QW_allowed: boolean };
  follow_up_plan: {
    visit_interval_weeks: number | null; // null when avoid — no start, no interval
    labs: string[];
    stop_rules: string[];
  };
};

export type ModifierBullet = { id: string; severity: ModifierDecision; message: string };

const RANK: Record<ModifierDecision, number> = { proceed_with_plan: 0, defer: 1, avoid: 2 };

function numOrNull(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function examOlderThan12Months(iso: string): boolean {
  if (!iso) return true; // missing exam record is treated as stale
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return true;
  return Date.now() - d.getTime() > 365.25 * 24 * 3600 * 1000;
}

// Clinical blank: every band at its safest-to-start default (no risks fired).
export const BLANK_MODIFIER_STATE: Glp1ModifierForm = {
  strong_cautions: {
    history_of_pancreatitis: "none",
    gastroparesis_severity: "none",
    renal_function: { eGFR: "", exenatide_BID_allowed: true, exenatide_QW_allowed: true },
    severe_liver_disease: false,
    uncontrolled_psychiatric_or_subuse: false,
  },
  conditional_risks: {
    gallbladder: { status: "none", last_event_months_ago: "", plan: "none" },
    pancreatitis_risk: { alcohol_heavy: false, triglycerides_mmol_L: "", known_gallstones: false, plan: "none" },
    renal_dehydration_risk: { CKD_stage: "none", diuretics: false, plan: "none" },
    thyroid_non_MTC: { history_goiter_nodules: false, plan: "none" },
    GI_and_eating_behavior: {
      baseline_GI_symptoms: "none",
      eating_disorder_screen: "negative",
      plan: "none",
    },
  },
};

// Worked example profile exactly as supplied by the clinician (v1).
export const EXAMPLE_MODIFIER_STATE: Glp1ModifierForm = {
  strong_cautions: {
    history_of_pancreatitis: "none",
    gastroparesis_severity: "none",
    renal_function: { eGFR: "62", exenatide_BID_allowed: true, exenatide_QW_allowed: true },
    severe_liver_disease: false,
    uncontrolled_psychiatric_or_subuse: false,
  },
  conditional_risks: {
    gallbladder: { status: "none", last_event_months_ago: "", plan: "none" },
    pancreatitis_risk: {
      alcohol_heavy: false,
      triglycerides_mmol_L: "2.1",
      known_gallstones: true,
      plan: "counsel_symptoms",
    },
    renal_dehydration_risk: { CKD_stage: "3", diuretics: true, plan: "hydration_education_and_sick_day_rules" },
    thyroid_non_MTC: { history_goiter_nodules: true, plan: "counsel_thyroid_tumor_symptoms" },
    GI_and_eating_behavior: {
      baseline_GI_symptoms: "mild_nausea",
      eating_disorder_screen: "negative",
      plan: "slow_titration_and_GI_support",
    },
  },
};

export function applyGlp1Modifiers(
  form: Glp1ModifierForm,
  retinopathy: RetinopathyBlock,
  abs: AbsoluteContraindications,
): Glp1ModifierResult {
  const bullets: ModifierBullet[] = [];
  const add = (id: string, severity: ModifierDecision, message: string) => {
    bullets.push({ id, severity, message });
  };
  const labs = new Set<string>(["eGFR", "LFTs", "lipids", "HbA1c"]);
  const stopRules = new Set<string>([
    "persistent_severe_abdominal_pain → evaluate_pancreatitis",
    "RUQ_pain_fever_jaundice → evaluate_gallbladder",
    "neck_mass_dysphagia_hoarseness → evaluate_thyroid",
  ]);

  // ---- absolute contraindications (derived) → avoid
  if (abs.MTC_personal_or_family)
    add("abs MTC_personal_or_family", "avoid", "Personal or family history of medullary thyroid carcinoma — do not start any GLP-1RA or dual GIP–GLP-1 agonist.");
  if (abs.MEN2)
    add("abs MEN2", "avoid", "MEN2 present — do not start; select an alternative strategy.");
  if (abs.hypersensitivity_to_GLP1_RA)
    add("abs hypersensitivity_to_GLP1_RA", "avoid", "Prior serious hypersensitivity to the agent/excipients — avoid the implicated product; document the reaction.");
  if (abs.pregnancy_or_breastfeeding)
    add("abs pregnancy_or_breastfeeding", "avoid", "Pregnancy or breastfeeding — avoid; alternative strategy and contraception advice required.");
  if (abs.active_eating_disorder_unsafe)
    add("abs active_eating_disorder_unsafe", "avoid", "Eating-disorder screen positive — appetite-suppressing therapy is unsafe; involve eating-disorder services first.");

  // ---- strong cautions
  const sc = form.strong_cautions;

  if (sc.history_of_pancreatitis !== "none") {
    labs.add("Lipase/amylase (symptom-triggered)");
    if (sc.history_of_pancreatitis === "single_resolved")
      add("Pancreatitis single/resolved", "proceed_with_plan", "Single resolved episode — confirm no active disease, counsel on the severe-abdominal-pain stop rule before starting.");
    if (sc.history_of_pancreatitis === "recurrent")
      add("Pancreatitis recurrent", "defer", "Recurrent pancreatitis — defer: pancreatology/hepatobiliary review and documented risk-benefit before any incretin therapy.");
    if (sc.history_of_pancreatitis === "chronic")
      add("Pancreatitis chronic", "defer", "Chronic pancreatitis — defer: specialist consensus and exocrine/endocrine status review required before any incretin therapy.");
  }

  if (sc.gastroparesis_severity !== "none") {
    if (sc.gastroparesis_severity === "mild")
      add("Gastroparesis mild", "proceed_with_plan", "Mild gastroparesis — start at the lowest dose, titrate no faster than one step per 4 weeks with GI symptom review.");
    if (sc.gastroparesis_severity === "moderate")
      add("Gastroparesis moderate", "defer", "Moderate gastroparesis — defer: assess aetiology and obtain specialist review. GLP-1RAs slow gastric emptying and may worsen symptoms.");
    if (sc.gastroparesis_severity === "severe")
      add("Gastroparesis severe", "defer", "Severe gastroparesis — high risk of worsening nausea, vomiting and dehydration; do not start now. Most reviews recommend an alternative agent; document specialist consensus only if proceeding.");
    stopRules.add("severe_persistent_vomiting_or_food_intolerance → hold_agent_review_gastroparesis");
  }

  const egfr = numOrNull(sc.renal_function.eGFR);
  if (egfr === null) {
    add("Renal eGFR unknown", "proceed_with_plan", "eGFR not recorded — obtain before initiation and before allowing any exenatide formulation.");
  } else if (egfr < 30) {
    if (sc.renal_function.exenatide_BID_allowed)
      add("Exenatide BID auto-restricted", "proceed_with_plan", "exenatide_BID_allowed downgraded by engine: eGFR <30 is below label for exenatide — not allowed.");
    if (sc.renal_function.exenatide_QW_allowed)
      add("Exenatide QW auto-restricted", "proceed_with_plan", "exenatide_QW_allowed downgraded by engine: eGFR <30 — extended-release exenatide not recommended.");
    add("Renal eGFR <30", "defer", "eGFR <30: avoid exenatide. Other GLP-1RAs need no dose adjustment, but monitor renal function and hydration closely.");
  } else if (egfr < 60) {
    add("Renal eGFR 30–59", "proceed_with_plan", "Impaired renal clearance (eGFR 30–59): use exenatide with caution; hydration education, sick-day rules and eGFR recheck after titration steps.");
  }

  if (sc.severe_liver_disease)
    add("Severe liver disease", "defer", "Severe hepatic impairment — defer: limited pharmacokinetic data and clinical experience; hepatology review before initiation.");

  if (sc.uncontrolled_psychiatric_or_subuse)
    add("Psychiatric/substance uncontrolled", "defer", "Uncontrolled psychiatric or substance-use disorder — defer; coordinate mental-health/substance services and secure adherence and monitoring safeguards.");

  // ---- conditional risks
  const gb = form.conditional_risks.gallbladder;
  const gbMonths = numOrNull(gb.last_event_months_ago);
  if (gb.status === "recent_biliary_event" || gb.plan === "defer_until_surgical_management" || (gbMonths !== null && gbMonths < 3))
    add("Gallbladder recent/pending", "defer", `Recent biliary event or surgical management pending${gbMonths !== null ? ` ~${gbMonths} months ago` : ""} — defer until surgically managed and recovered; rapid GLP-1-induced weight loss can precipitate new biliary disease.`);
  else if (gb.status === "asymptomatic_stones")
    add("Gallbladder asymptomatic stones", "proceed_with_plan", "Asymptomatic gallstones — counsel on RUQ pain/fever/jaundice red flags and monitor; rapid weight loss increases gallstone risk.");
  else if (gb.status === "prior_cholecystectomy")
    add("Gallbladder prior cholecystectomy", "proceed_with_plan", "Prior cholecystectomy — biliary risk materially lower; standard red-flag counselling applies.");
  else if (gb.plan === "consider_UDCA")
    add("Gallbladder UDCA discussed", "proceed_with_plan", "Discuss ursodeoxycholic acid per local practice if rapid weight loss or stone disease is expected.");

  const pr = form.conditional_risks.pancreatitis_risk;
  const tg = numOrNull(pr.triglycerides_mmol_L);
  if (tg === null)
    add("Pancreatitis risk TG unknown", "proceed_with_plan", "Fasting triglycerides not recorded — check before initiation.");
  else if (tg >= 5.6)
    add("Pancreatitis risk TG ≥5.6", "defer", "Fasting triglycerides ≥5.6 mmol/L (≈500 mg/dL) — defer: optimise triglycerides (fibrate/lifestyle/alcohol) before starting; pancreatitis risk.");
  else if (tg >= 2.6)
    add("Pancreatitis risk TG 2.6–5.6", "proceed_with_plan", "Triglycerides 2.6–5.6 mmol/L — optimise lipids and alcohol; keep symptom-triggered lipase in the plan.");
  if (pr.alcohol_heavy) {
    if (pr.plan === "optimize_TG_and_alcohol")
      add("Pancreatitis risk alcohol pathway", "defer", "Heavy alcohol use with the optimisation pathway selected — defer until reduction/targets are documented.");
    else
      add("Pancreatitis risk alcohol counsel", "proceed_with_plan", "Heavy alcohol use — counsel on alcohol reduction and pancreatitis warning symptoms.");
  }
  if (pr.known_gallstones)
    add("Pancreatitis risk known gallstones", "proceed_with_plan", "Known gallstones — counsel on biliary warning symptoms; weight loss can mobilise sludge/stones.");

  if (retinopathy.plan === "ensure_retinal_screening_before_start" &&
      (retinopathy.history || !retinopathy.last_exam_date || examOlderThan12Months(retinopathy.last_exam_date)))
    add("Retinopathy screening due", "proceed_with_plan", retinopathy.history
      ? "Retinopathy history present and exam record missing or stale — ensure dilated retinal screening before or at initiation; avoid rapid glycaemic correction."
      : "No recent retinal exam on record — obtain baseline dilated retinal screening before or at initiation.");
  if (retinopathy.proliferative)
    add("Retinopathy proliferative", "defer", "Proliferative retinopathy — defer: retinal specialist review and a stabilisation plan before/contemporaneous with initiation.");

  const rd = form.conditional_risks.renal_dehydration_risk;
  if (rd.CKD_stage === "4" || rd.CKD_stage === "5")
    add(`Renal dehydration CKD stage ${rd.CKD_stage}`, "defer", `CKD stage ${rd.CKD_stage} — nephrology-coordinated review before initiation; expect careful titration and eGFR monitoring.`);
  else if (rd.CKD_stage === "3" || rd.diuretics) {
    add("Renal dehydration CKD3/diuretics", "proceed_with_plan", `${rd.CKD_stage === "3" ? "CKD stage 3" : "Diuretic therapy"} — hydration education and sick-day rules${rd.diuretics ? "; review diuretic dosing around titration steps" : ""}; recheck eGFR at each titration step.`);
    if (rd.plan === "hydration_education_and_sick_day_rules")
      stopRules.add("acute_illness_or_dehydration → sick_day_rules_pause_and_review");
  }

  const thy = form.conditional_risks.thyroid_non_MTC;
  if (thy.history_goiter_nodules)
    add("Thyroid non-MTC nodules/goiter", "proceed_with_plan", "Goiter/nodules without MTC or MEN2 — counsel on neck mass, dysphagia, hoarseness red flags; routine surveillance per local policy.");

  const gi = form.conditional_risks.GI_and_eating_behavior;
  if (gi.baseline_GI_symptoms === "mild_nausea")
    add("Baseline GI mild nausea", "proceed_with_plan", "Baseline mild nausea — use the slow-titration plan with GI support and symptom follow-up.");
  else if (gi.baseline_GI_symptoms !== "none")
    add("Baseline GI moderate/severe", "defer", "Moderate or severe baseline GI symptoms — defer until controlled; overlapping gastroparesis risk raises intolerance and dehydration risk.");
  if (gi.eating_disorder_screen === "equivocal")
    add("ED screen equivocal", "defer", "Equivocal eating-disorder screen — defer; formal eating-disorder assessment before initiation.");

  // ---- follow-up plan scales with the worst fired tier
  const worst = bullets.reduce<ModifierDecision>((acc, b) => (RANK[b.severity] > RANK[acc] ? b.severity : acc), "proceed_with_plan");
  const interval = worst === "avoid" ? null : worst === "defer" ? 2 : 4;

  return {
    absolute_contraindications: abs,
    decision: worst,
    bullets,
    exenatide_effective: {
      BID_allowed: sc.renal_function.exenatide_BID_allowed && !(egfr !== null && egfr < 30),
      QW_allowed: sc.renal_function.exenatide_QW_allowed && !(egfr !== null && egfr < 30),
    },
    follow_up_plan: {
      visit_interval_weeks: interval,
      labs: [...labs],
      stop_rules: [...stopRules],
    },
  };
}