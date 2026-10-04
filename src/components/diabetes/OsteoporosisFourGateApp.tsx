import { useEffect, useMemo, useState } from "react";

import {
  Conditional,
  DateField,
  Field,
  Gate,
  NumberField,
  PillMultiselect,
  PillRadio,
  TextField,
} from "@/components/osteo/controls";
import { ResultCard } from "@/components/osteo/ResultCard";
import { Button } from "@/components/ui/button";
import { entryRoute, evaluate } from "@/lib/osteo/logic";
import { migrateLegacyOsteoporosisIntake, type LegacyOsteoporosisIntake } from "@/lib/osteo/migrateLegacy";
import { SAFETY_KEYS, SPEC_VERSION, initialState, type OsteoState } from "@/lib/osteo/types";
import { label } from "@/lib/osteo/logic";


const SEX = ["female", "male", "other"] as const;
const MENOPAUSE = [
  "unknown",
  "premenopausal",
  "menopausal_transition",
  "postmenopausal",
] as const;
const FRACTURE = [
  "unknown",
  "none",
  "hip",
  "one_vertebral",
  "multiple_vertebral",
  "other_fragility",
] as const;
const TRI = ["unknown", "yes", "no"] as const;
const DXA = ["unknown", "available_valid", "unavailable_or_not_feasible"] as const;
const FRAX = [
  "not_assessed",
  "below_local_treatment_threshold",
  "above_local_treatment_threshold",
  "very_high_independently_confirmed",
] as const;
const CKD = ["unknown", "yes_or_suspected", "no"] as const;
const THERAPY = [
  "unknown",
  "none",
  "oral_bisphosphonate",
  "iv_bisphosphonate",
  "denosumab",
  "anabolic_or_romosozumab",
] as const;
const RISK_FACTORS = [
  "low_body_weight",
  "high_risk_medication",
  "bone_loss_condition",
  "parental_hip_fracture",
  "frequent_falls",
  "other_clinician_confirmed_risk",
  "none_identified",
] as const;
const BONE_LOSS = [
  "hypogonadism_or_early_menopause",
  "hyperthyroidism_or_overreplacement",
  "primary_hyperparathyroidism",
  "type_1_diabetes",
  "type_2_diabetes",
  "ckd",
  "chronic_liver_disease",
  "malabsorption_ibd_bariatric",
  "rheumatoid_or_inflammatory_disease",
  "mgus_or_suspected_myeloma",
  "osteomalacia_or_other_metabolic_bone_disease",
  "other_specify",
] as const;
const OTHER_RISKS = [
  "prior_fragility_fracture_confirm_above",
  "other_family_fracture_history",
  "current_smoking",
  "high_alcohol_intake",
  "recurrent_falls_or_frailty",
  "height_loss_possible_vertebral_fracture",
  "prolonged_immobility",
  "aromatase_inhibitor_or_androgen_deprivation",
  "other_specify",
] as const;

const STORAGE_KEY = "erx:osteoporosis-four-gate-intake";
const LEGACY_STORAGE_KEY = "erx:osteoporosis-live-intake";

export default function OsteoporosisFourGateApp() {
  const [state, setState] = useState<OsteoState>(initialState);
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setDateISO(new Date().toISOString().slice(0, 10));
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState({ ...initialState(), ...(JSON.parse(saved) as Partial<OsteoState>) });
      } else {
        const legacy = sessionStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          setState(migrateLegacyOsteoporosisIntake(JSON.parse(legacy) as LegacyOsteoporosisIntake));
        }
      }
    } catch {
      setState(initialState());
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, storageReady]);

  const set = <K extends keyof OsteoState>(key: K, value: OsteoState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const today = useMemo(
    () => (dateISO ? new Date(dateISO + "T00:00:00Z") : new Date("2026-01-01T00:00:00Z")),
    [dateISO],
  );

  const route = entryRoute(state);
  const gate1Resolved = route.id !== "incomplete";
  const pediatric = route.id === "pediatric";
  const showRest = gate1Resolved && !pediatric;

  const result = useMemo(() => evaluate(state, today), [state, today]);

  const showExtreme = [state.lowest_valid_t_score, state.lowest_valid_z_score].some(
    (v) => typeof v === "number" && (v < -5 || v > 4),
  );
  const showZ = route.pathway !== "standard_adult";
  const therapyDetail = ["denosumab", "iv_bisphosphonate", "anabolic_or_romosozumab"].includes(
    state.current_therapy,
  );

  return (
    <div className="osteo-four-gate min-w-0 space-y-4">


      <main className="min-w-0">
        <div className="mb-5 max-w-3xl">
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
            Osteoporosis clinical pathway
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Unknown is never treated as no. Missing data never produces a below-threshold or
            low-risk result. Clinical decision support only — not validated, not auto-prescribing,
            and clinical sign-off is required.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* ---------------- Gated intake ---------------- */}
          <div className="space-y-5">
            <Gate
              index="1"
              title="Age, sex, menopause"
              purpose="Assigns the pathway and the DXA screening prompt. Menopause is never inferred from age."
            >
              <Field title="Age" hint="Blank is unknown, not 18. Under 18 is paediatric and outside scope.">
                <NumberField
                  value={state.age}
                  onChange={(v) => set("age", v)}
                  unit="years"
                  step="1"
                />
              </Field>
              <Field title="Sex">
                <PillRadio
                  options={SEX}
                  value={state.sex}
                  onChange={(v) =>
                    setState((p) => ({
                      ...p,
                      sex: v,
                      menopause: v === "female" ? p.menopause : "unknown",
                    }))
                  }
                />
              </Field>
              {state.sex === "female" ? (
                <Conditional>
                  <Field title="Menopause status">
                    <PillRadio
                      options={MENOPAUSE}
                      value={state.menopause}
                      onChange={(v) => set("menopause", v)}
                    />
                  </Field>
                </Conditional>
              ) : null}
              {!gate1Resolved ? (
                <p className="rounded-2xl bg-mist/80 p-3 text-[13px] leading-relaxed ring-1 ring-border">
                  Enter age and sex to start. No risk card, warnings, drug cards or report appear
                  until Gate 1 can assign a pathway.
                </p>
              ) : null}
              {pediatric ? (
                <p className="rounded-2xl bg-destructive/10 p-3 text-[13px] leading-relaxed ring-1 ring-destructive/35">
                  Age under 18 is paediatric and outside the scope of this pathway. No adult risk
                  card or medication options are produced. Refer to paediatric bone health services.
                </p>
              ) : null}
            </Gate>

            {showRest ? (
              <>
                <Gate
                  index="2"
                  title="Documented fragility fracture"
                  purpose="A hip or any vertebral fracture is secondary prevention, not screening. Multiple or recent vertebral is very-high evidence."
                  delay={60}
                >
                  <Field title="Fragility fracture">
                    <PillRadio
                      options={FRACTURE}
                      value={state.fragility_fracture}
                      onChange={(v) =>
                        setState((p) => ({
                          ...p,
                          fragility_fracture: v,
                          other_fracture_site: v === "other_fragility" ? p.other_fracture_site : "",
                        }))
                      }
                    />
                  </Field>
                  <Field title="Any fragility fracture within the last 12 months">
                    <PillRadio
                      options={TRI}
                      value={state.recent_fracture_within_12_months}
                      onChange={(v) => set("recent_fracture_within_12_months", v)}
                    />
                  </Field>
                  {state.fragility_fracture === "other_fragility" ? (
                    <Conditional>
                      <Field
                        title="Other fracture site"
                        hint="Wrist, humerus, pelvis or another low-trauma site. Exclude malignant pathological fracture."
                      >
                        <TextField
                          value={state.other_fracture_site}
                          onChange={(v) => set("other_fracture_site", v)}
                          placeholder="e.g. distal radius"
                        />
                      </Field>
                    </Conditional>
                  ) : null}
                  <Field title="Vertebral fracture within the last 2 years">
                    <PillRadio
                      options={TRI}
                      value={state.recent_vertebral_fracture_within_2_years}
                      onChange={(v) => set("recent_vertebral_fracture_within_2_years", v)}
                    />
                  </Field>
                  <Field title="Fracture while receiving osteoporosis therapy">
                    <PillRadio
                      options={TRI}
                      value={state.fracture_while_on_osteoporosis_therapy}
                      onChange={(v) => set("fracture_while_on_osteoporosis_therapy", v)}
                    />
                  </Field>
                </Gate>

                <Gate
                  index="3"
                  title="Lowest valid DXA score"
                  purpose="A score counts only when DXA is available and valid. Unavailable ignores stale scores and never means normal BMD."
                  delay={120}
                >
                  <Field title="DXA status">
                    <PillRadio
                      options={DXA}
                      value={state.dxa_status}
                      onChange={(v) => set("dxa_status", v)}
                    />
                  </Field>
                  {state.dxa_status === "available_valid" ? (
                    <Conditional>
                      <div className="space-y-4">
                        {!showZ ? (
                          <Field title="Lowest valid T-score" hint="Standard adult pathway.">
                            <NumberField
                              value={state.lowest_valid_t_score}
                              onChange={(v) => set("lowest_valid_t_score", v)}
                              unit="SD"
                              step="0.1"
                            />
                          </Field>
                        ) : (
                          <Field
                            title="Lowest valid Z-score"
                            hint="Younger, premenopausal or individualised pathway."
                          >
                            <NumberField
                              value={state.lowest_valid_z_score}
                              onChange={(v) => set("lowest_valid_z_score", v)}
                              unit="SD"
                              step="0.1"
                            />
                          </Field>
                        )}
                        {showExtreme ? (
                          <Field
                            title="Extreme score verified"
                            hint="A score beyond −5.0 or 4.0 is held out of the risk rules until verified."
                          >
                            <PillRadio
                              options={TRI}
                              value={state.extreme_verified}
                              onChange={(v) => set("extreme_verified", v)}
                            />
                          </Field>
                        ) : null}
                      </div>
                    </Conditional>
                  ) : null}
                  {state.dxa_status === "unavailable_or_not_feasible" &&
                  (state.lowest_valid_t_score !== null || state.lowest_valid_z_score !== null) ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        setState((p) => ({
                          ...p,
                          lowest_valid_t_score: null,
                          lowest_valid_z_score: null,
                        }))
                      }
                    >
                      Clear the stale scores
                    </Button>
                  ) : null}
                </Gate>

                <Gate
                  index="4"
                  title="Clinical risk factors"
                  purpose="Drives risk-based DXA for men 50–69 and for younger or premenopausal adults. An empty list is incomplete, not none."
                  delay={180}
                >
                  <Field title="Risk factors">
                    <PillMultiselect
                      options={RISK_FACTORS}
                      value={state.dxa_risk_factors}
                      exclusive="none_identified"
                      onChange={(v) =>
                        setState((p) => ({
                          ...p,
                          dxa_risk_factors: v,
                          bone_loss_conditions: v.includes("bone_loss_condition")
                            ? p.bone_loss_conditions
                            : [],
                          other_confirmed_risks: v.includes("other_clinician_confirmed_risk")
                            ? p.other_confirmed_risks
                            : [],
                        }))
                      }
                    />
                  </Field>
                  {state.dxa_risk_factors.includes("bone_loss_condition") ? (
                    <Conditional>
                      <Field
                        title="Conditions causing bone loss"
                        hint="Selecting the parent without a subtype leaves the factor unconfirmed."
                      >
                        <PillMultiselect
                          options={BONE_LOSS}
                          value={state.bone_loss_conditions}
                          onChange={(v) => set("bone_loss_conditions", v)}
                        />
                      </Field>
                    </Conditional>
                  ) : null}
                  {state.dxa_risk_factors.includes("other_clinician_confirmed_risk") ? (
                    <Conditional>
                      <Field
                        title="Other clinician-confirmed risks"
                        hint="Documented and investigated. No automatic FRAX multiplier or risk-class upgrade."
                      >
                        <PillMultiselect
                          options={OTHER_RISKS}
                          value={state.other_confirmed_risks}
                          onChange={(v) => set("other_confirmed_risks", v)}
                        />
                      </Field>
                    </Conditional>
                  ) : null}
                  {state.sex === "male" &&
                  typeof state.age === "number" &&
                  state.age >= 50 &&
                  state.age < 70 ? (
                    <Conditional>
                      <Field
                        title="DXA risk review complete (man 50–69)"
                        hint="An age-only negative decision is only available after a completed negative review."
                      >
                        <PillRadio
                          options={TRI}
                          value={state.male_50_69_dxa_risk_review_complete}
                          onChange={(v) => set("male_50_69_dxa_risk_review_complete", v)}
                        />
                      </Field>
                    </Conditional>
                  ) : null}
                </Gate>

                <Gate
                  index="5"
                  title="Branch modifiers"
                  purpose="FRAX comparison, glucocorticoids, renal status and current therapy. Each branch runs only on explicit values."
                  delay={240}
                >
                  <Field title="FRAX comparison against the local threshold">
                    <PillRadio
                      options={FRAX}
                      value={state.frax_comparison}
                      onChange={(v) => set("frax_comparison", v)}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field title="FRAX 10-year hip fracture probability" hint="Optional numeric probability; do not multiply for prior fracture.">
                      <NumberField
                        value={state.frax_hip_percent}
                        onChange={(v) => set("frax_hip_percent", v)}
                        unit="%"
                        step="0.1"
                      />
                    </Field>
                    <Field title="FRAX 10-year major osteoporotic fracture probability" hint="Optional numeric probability for a treatment-naïve patient.">
                      <NumberField
                        value={state.frax_major_osteoporotic_percent}
                        onChange={(v) => set("frax_major_osteoporotic_percent", v)}
                        unit="%"
                        step="0.1"
                      />
                    </Field>
                  </div>
                  {state.frax_comparison !== "not_assessed" ? (
                    <Conditional>
                      <Field
                        title="Country and threshold policy version"
                        hint="FRAX rules do not fire until this is documented."
                      >
                        <TextField
                          value={state.frax_country_threshold_policy_version}
                          onChange={(v) => set("frax_country_threshold_policy_version", v)}
                          placeholder="e.g. UK NOGG 2021 thresholds"
                        />
                      </Field>
                    </Conditional>
                  ) : null}

                  <Field title="Systemic glucocorticoids">
                    <PillRadio
                      options={TRI}
                      value={state.systemic_glucocorticoids}
                      onChange={(v) =>
                        setState((p) => ({
                          ...p,
                          systemic_glucocorticoids: v,
                          prednisolone_equivalent_mg_per_day:
                            v === "yes" ? p.prednisolone_equivalent_mg_per_day : null,
                          glucocorticoid_duration_months:
                            v === "yes" ? p.glucocorticoid_duration_months : null,
                        }))
                      }
                    />
                  </Field>
                  {state.systemic_glucocorticoids === "yes" ? (
                    <Conditional>
                      <div className="flex flex-wrap gap-5">
                        <Field title="Prednisolone equivalent">
                          <NumberField
                            value={state.prednisolone_equivalent_mg_per_day}
                            onChange={(v) => set("prednisolone_equivalent_mg_per_day", v)}
                            unit="mg/day"
                            step="0.5"
                          />
                        </Field>
                        <Field title="Duration">
                          <NumberField
                            value={state.glucocorticoid_duration_months}
                            onChange={(v) => set("glucocorticoid_duration_months", v)}
                            unit="months"
                            step="1"
                          />
                        </Field>
                      </div>
                    </Conditional>
                  ) : null}

                  <Field title="Advanced CKD, CKD-MBD or dialysis">
                    <PillRadio
                      options={CKD}
                      value={state.advanced_ckd_ckd_mbd_dialysis}
                      onChange={(v) => set("advanced_ckd_ckd_mbd_dialysis", v)}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-5">
                    <Field title="eGFR">
                      <NumberField
                        value={state.egfr_ml_min_1_73m2}
                        onChange={(v) => set("egfr_ml_min_1_73m2", v)}
                        unit="mL/min/1.73m²"
                        step="1"
                      />
                    </Field>
                    <Field title="Drug-specific CrCl" hint="eGFR is not a substitute for the renal gates.">
                      <NumberField
                        value={state.drug_specific_crcl_ml_min}
                        onChange={(v) => set("drug_specific_crcl_ml_min", v)}
                        unit="mL/min"
                        step="1"
                      />
                    </Field>
                  </div>

                  <Field title="Current therapy">
                    <PillRadio
                      options={THERAPY}
                      value={state.current_therapy}
                      onChange={(v) =>
                        setState((p) => ({
                          ...p,
                          current_therapy: v,
                          last_injection_or_infusion_date: [
                            "denosumab",
                            "iv_bisphosphonate",
                            "anabolic_or_romosozumab",
                          ].includes(v)
                            ? p.last_injection_or_infusion_date
                            : "",
                        }))
                      }
                    />
                  </Field>
                  {therapyDetail ? (
                    <Conditional>
                      <Field title="Last injection or infusion date">
                        <DateField
                          value={state.last_injection_or_infusion_date}
                          onChange={(v) => set("last_injection_or_infusion_date", v)}
                        />
                      </Field>
                    </Conditional>
                  ) : null}
                </Gate>

                <Gate
                  index="6"
                  title="Medication safety gates"
                  purpose="Every gate must be explicit. Unknown means needs-review, never cleared."
                  delay={300}
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {SAFETY_KEYS.map((k) => (
                      <Field key={k} title={label(k)}>
                        <PillRadio
                          options={TRI}
                          value={state.safety[k]}
                          onChange={(v) =>
                            setState((p) => ({ ...p, safety: { ...p.safety, [k]: v } }))
                          }
                        />
                      </Field>
                    ))}
                  </div>
                </Gate>
              </>
            ) : null}
          </div>

          {/* ---------------- Sticky result ---------------- */}
          <aside className="lg:sticky lg:top-6">
            {gate1Resolved && dateISO ? (
              <ResultCard state={state} result={result} assessmentDate={dateISO} />
            ) : (
              <div className="glass rounded-3xl p-6">
                <p className="font-display text-[15px] font-bold tracking-tight">
                  Waiting on Gate 1
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  The result card stays empty until age and sex assign a pathway. Nothing is guessed
                  and nothing is defaulted.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
