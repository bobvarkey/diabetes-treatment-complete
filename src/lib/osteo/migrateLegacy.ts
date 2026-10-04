import { initialState, type OsteoState } from "./types";

export interface LegacyOsteoporosisIntake {
  age?: string;
  sex?: "" | "female" | "male";
  postmenopausal?: boolean;
  parentHipFracture?: boolean;
  currentSmoking?: boolean;
  alcohol3OrMore?: boolean;
  fragilityFractureTypes?: string[];
  fractureHistory?: Array<{ site?: string; fragilityFracture?: string }>;
  vertebralFractureCount?: string;
  hipFracture?: "yes" | "no" | "unknown";
  otherFragilityFracture?: "yes" | "no" | "unknown";
  recentVertebralFracture?: "yes" | "no" | "unknown";
  recentFractureWithin12Months?: "yes" | "no" | "unknown";
  fractureWhileOnTherapy?: "yes" | "no" | "unknown";
  femoralNeckTScore?: string;
  totalHipTScore?: string;
  lumbarSpineTScore?: string;
  fraxAboveNationalThreshold?: "yes" | "no" | "unknown";
  fraxHipPercent?: string;
  fraxMajorOsteoporoticPercent?: string;
  fraxCountryModel?: string;
  prednisoneEquivalentMgPerDay?: string;
  steroidDurationMonths?: string;
  advancedCkdOrCkdMbd?: "yes" | "no" | "unknown";
  ckdQualifier?: string;
  crcl?: string;
  currentDrug?: string;
  lastDenosumabDate?: string;
  lastTeriparatideDate?: string;
  secondaryCauseFlags?: string[];
  frequentFalls?: "yes" | "no" | "unknown";
  clinicianIdentifiedHighFallsRisk?: "yes" | "no" | "unknown";
}

const numberOrNull = (value?: string): number | null => {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const secondaryMap: Record<string, string> = {
  "Type 1 diabetes": "type_1_diabetes",
  "Type 2 diabetes": "type_2_diabetes",
  "Hypogonadism / early menopause": "hypogonadism_or_early_menopause",
  "Hyperthyroidism / over-replacement": "hyperthyroidism_or_overreplacement",
  "Primary hyperparathyroidism": "primary_hyperparathyroidism",
  CKD: "ckd",
  "Chronic liver disease": "chronic_liver_disease",
  "Malabsorption / IBD / bariatric": "malabsorption_ibd_bariatric",
  "Multiple myeloma / MGUS": "mgus_or_suspected_myeloma",
  "Rheumatoid arthritis": "rheumatoid_or_inflammatory_disease",
  "Aromatase inhibitor / ADT": "aromatase_inhibitor_or_androgen_deprivation",
};

export function migrateLegacyOsteoporosisIntake(
  legacy: LegacyOsteoporosisIntake | null | undefined,
): OsteoState {
  const next = initialState();
  if (!legacy) return next;

  next.age = numberOrNull(legacy.age);
  next.sex = legacy.sex || "unknown";
  next.menopause =
    legacy.sex === "female"
      ? legacy.postmenopausal
        ? "postmenopausal"
        : "unknown"
      : "unknown";

  const confirmed = (legacy.fractureHistory ?? []).filter((f) => f.fragilityFracture === "yes");
  const vertebralCount = Math.max(
    numberOrNull(legacy.vertebralFractureCount) ?? 0,
    confirmed.filter((f) => f.site === "vertebral").length,
    legacy.fragilityFractureTypes?.includes("vertebral") ? 1 : 0,
  );
  const hip =
    legacy.hipFracture === "yes" ||
    legacy.fragilityFractureTypes?.includes("hip") ||
    confirmed.some((f) => f.site === "hip");
  const other =
    legacy.otherFragilityFracture === "yes" ||
    legacy.fragilityFractureTypes?.some((site) =>
      ["distal-radius", "humerus", "other"].includes(site),
    ) ||
    confirmed.some((f) => !["hip", "vertebral"].includes(f.site ?? ""));
  next.fragility_fracture =
    vertebralCount >= 2
      ? "multiple_vertebral"
      : vertebralCount === 1
        ? "one_vertebral"
        : hip
          ? "hip"
          : other
            ? "other_fragility"
            : legacy.hipFracture === "no" && legacy.otherFragilityFracture === "no"
              ? "none"
              : "unknown";
  next.recent_vertebral_fracture_within_2_years = legacy.recentVertebralFracture ?? "unknown";
  next.recent_fracture_within_12_months = legacy.recentFractureWithin12Months ?? "unknown";
  next.fracture_while_on_osteoporosis_therapy = legacy.fractureWhileOnTherapy ?? "unknown";

  const scores = [
    numberOrNull(legacy.femoralNeckTScore),
    numberOrNull(legacy.totalHipTScore),
    numberOrNull(legacy.lumbarSpineTScore),
  ].filter((value): value is number => value !== null);
  next.dxa_status = scores.length ? "available_valid" : "unknown";
  next.lowest_valid_t_score = scores.length ? Math.min(...scores) : null;

  next.frax_comparison =
    legacy.fraxAboveNationalThreshold === "yes"
      ? "above_local_treatment_threshold"
      : legacy.fraxAboveNationalThreshold === "no"
        ? "below_local_treatment_threshold"
        : "not_assessed";
  next.frax_country_threshold_policy_version = legacy.fraxCountryModel ?? "";
  next.frax_hip_percent = numberOrNull(legacy.fraxHipPercent);
  next.frax_major_osteoporotic_percent = numberOrNull(legacy.fraxMajorOsteoporoticPercent);

  const dose = numberOrNull(legacy.prednisoneEquivalentMgPerDay);
  const months = numberOrNull(legacy.steroidDurationMonths);
  next.systemic_glucocorticoids =
    (dose ?? 0) > 0 || (months ?? 0) > 0
      ? "yes"
      : dose === 0 && months === 0
        ? "no"
        : "unknown";
  next.prednisolone_equivalent_mg_per_day = dose;
  next.glucocorticoid_duration_months = months;

  next.advanced_ckd_ckd_mbd_dialysis =
    legacy.advancedCkdOrCkdMbd === "yes" ||
    legacy.ckdQualifier === "g4" ||
    legacy.ckdQualifier === "g5" ||
    legacy.ckdQualifier === "dialysis" ||
    legacy.ckdQualifier === "advanced_unspecified" ||
    legacy.ckdQualifier === "ckd_mbd_suspected" ||
    legacy.ckdQualifier === "ckd_mbd_present"
      ? "yes_or_suspected"
      : legacy.advancedCkdOrCkdMbd === "no" || legacy.ckdQualifier === "none"
        ? "no"
        : "unknown";
  next.drug_specific_crcl_ml_min = numberOrNull(legacy.crcl);

  next.current_therapy =
    legacy.currentDrug === "oral-bp"
      ? "oral_bisphosphonate"
      : legacy.currentDrug === "iv-zoledronate"
        ? "iv_bisphosphonate"
        : legacy.currentDrug === "denosumab"
          ? "denosumab"
          : legacy.currentDrug === "teriparatide" || legacy.currentDrug === "romosozumab"
            ? "anabolic_or_romosozumab"
            : legacy.currentDrug === "none"
              ? "none"
              : "unknown";
  next.last_injection_or_infusion_date =
    legacy.currentDrug === "denosumab"
      ? legacy.lastDenosumabDate ?? ""
      : legacy.currentDrug === "teriparatide"
        ? legacy.lastTeriparatideDate ?? ""
        : "";

  const flags = legacy.secondaryCauseFlags ?? [];
  next.bone_loss_conditions = [...new Set(flags.map((flag) => secondaryMap[flag]).filter(Boolean))];
  const risks: string[] = [];
  if (legacy.parentHipFracture) risks.push("parental_hip_fracture");
  if (legacy.currentSmoking) risks.push("current_smoking");
  if (legacy.alcohol3OrMore) risks.push("high_alcohol_intake");
  if (legacy.frequentFalls === "yes" || legacy.clinicianIdentifiedHighFallsRisk === "yes") {
    risks.push("recurrent_falls_or_frailty");
  }
  next.other_confirmed_risks = risks;
  const dxaRisks: string[] = [];
  if (next.bone_loss_conditions.length) dxaRisks.push("bone_loss_condition");
  if (risks.length) dxaRisks.push("other_clinician_confirmed_risk");
  if (flags.includes("Chronic glucocorticoids")) dxaRisks.push("high_risk_medication");
  if (flags.includes("None identified") && dxaRisks.length === 0) dxaRisks.push("none_identified");
  next.dxa_risk_factors = dxaRisks;

  return next;
}