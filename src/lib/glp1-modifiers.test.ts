import { describe, expect, it } from "vitest";
import {
  applyGlp1Modifiers, BLANK_MODIFIER_STATE, EXAMPLE_MODIFIER_STATE,
  type AbsoluteContraindications, type RetinopathyBlock,
} from "./glp1-modifiers";

const NO_ABS: AbsoluteContraindications = {
  MTC_personal_or_family: false,
  MEN2: false,
  hypersensitivity_to_GLP1_RA: false,
  pregnancy_or_breastfeeding: false,
  active_eating_disorder_unsafe: false,
};

const NO_RETINOPATHY: RetinopathyBlock = {
  history: false,
  last_exam_date: "",
  proliferative: false,
  plan: "none",
};

const run = (form = BLANK_MODIFIER_STATE, retinopathy = NO_RETINOPATHY, abs = NO_ABS) =>
  applyGlp1Modifiers(form, retinopathy, abs);

describe("GLP-1 modifier engine", () => {
  it("clinical blank stays startable with base labs and the three core stop rules", () => {
    const r = run();
    expect(r.decision).toBe("proceed_with_plan");
    expect(r.follow_up_plan.visit_interval_weeks).toBe(4);
    expect(r.follow_up_plan.labs).toEqual(expect.arrayContaining(["eGFR", "LFTs", "lipids", "HbA1c"]));
    // blank form still prompts baseline data capture (eGFR and TG unknown)
    const ids = r.bullets.map((b) => b.id);
    expect(ids).toContain("Renal eGFR unknown");
    expect(ids).toContain("Pancreatitis risk TG unknown");
    // exactly the three core stop rules
    expect(r.follow_up_plan.stop_rules).toHaveLength(3);
  });

  it("any absolute contraindication forces avoid and nulls the visit interval", () => {
    for (const key of Object.keys(NO_ABS) as (keyof AbsoluteContraindications)[]) {
      const r = run(BLANK_MODIFIER_STATE, NO_RETINOPATHY, { ...NO_ABS, [key]: true });
      expect(r.decision).toBe("avoid");
      expect(r.follow_up_plan.visit_interval_weeks).toBeNull();
    }
  });

  it("escalation is monotonic: worst fired tier wins, avoid only via absolutes", () => {
    const form = structuredClone(EXAMPLE_MODIFIER_STATE);
    form.strong_cautions.history_of_pancreatitis = "recurrent"; // defer-tier bullet
    form.conditional_risks.gallbladder.plan = "consider_UDCA"; // proceed-tier bullet
    const r = run(form);
    expect(r.decision).toBe("defer");
    expect(r.follow_up_plan.visit_interval_weeks).toBe(2);
  });

  it("worked clinician example (v1) remains startable", () => {
    const r = run(EXAMPLE_MODIFIER_STATE);
    expect(r.decision).toBe("proceed_with_plan");
    expect(r.follow_up_plan.visit_interval_weeks).toBe(4);
  });

  it("eGFR <30 downgrades exenatide and defers", () => {
    const form = structuredClone(BLANK_MODIFIER_STATE);
    form.strong_cautions.renal_function.eGFR = "25";
    const r = run(form);
    expect(r.exenatide_effective.BID_allowed).toBe(false);
    expect(r.exenatide_effective.QW_allowed).toBe(false);
    expect(r.decision).toBe("defer");
  });

  it("eGFR 30–59 keeps exenatide with caution at proceed tier", () => {
    const form = structuredClone(EXAMPLE_MODIFIER_STATE); // eGFR 62 → no renal band
    form.strong_cautions.renal_function.eGFR = "45";
    const r = run(form);
    expect(r.exenatide_effective.BID_allowed).toBe(true);
    const ids = r.bullets.map((b) => b.id);
    expect(ids).toContain("Renal eGFR 30–59");
  });

  it("triglyceride bands: ≥5.6 defers, 2.6–5.6 counsels at proceed tier", () => {
    const high = structuredClone(BLANK_MODIFIER_STATE);
    high.conditional_risks.pancreatitis_risk.triglycerides_mmol_L = "6.1";
    expect(run(high).decision).toBe("defer");

    const mid = structuredClone(BLANK_MODIFIER_STATE);
    mid.conditional_risks.pancreatitis_risk.triglycerides_mmol_L = "3.3";
    const rMid = run(mid);
    expect(rMid.decision).toBe("proceed_with_plan");
    expect(rMid.bullets.map((b) => b.id)).toContain("Pancreatitis risk TG 2.6–5.6");
  });

  it("pending gallbladder surgical management defers", () => {
    const form = structuredClone(BLANK_MODIFIER_STATE);
    form.conditional_risks.gallbladder.plan = "defer_until_surgical_management";
    const r = run(form);
    expect(r.decision).toBe("defer");
    expect(r.bullets.map((b) => b.id)).toContain("Gallbladder recent/pending");
  });

  it("proliferative retinopathy defers pending specialist review", () => {
    const ret: RetinopathyBlock = { ...NO_RETINOPATHY, proliferative: true };
    expect(run(BLANK_MODIFIER_STATE, ret).decision).toBe("defer");
  });

  it("equivocal eating-disorder screen defers; the absolute flag avoids", () => {
    const equivocal = structuredClone(BLANK_MODIFIER_STATE);
    equivocal.conditional_risks.GI_and_eating_behavior.eating_disorder_screen = "equivocal";
    expect(run(equivocal).decision).toBe("defer");

    const unsafe = structuredClone(BLANK_MODIFIER_STATE);
    unsafe.conditional_risks.GI_and_eating_behavior.eating_disorder_screen = "positive";
    expect(run(unsafe, NO_RETINOPATHY, { ...NO_ABS, active_eating_disorder_unsafe: true }).decision).toBe("avoid");
  });

  it("preserve the clinician profile keys and unicode stop rules verbatim", () => {
    const form = structuredClone(BLANK_MODIFIER_STATE);
    form.strong_cautions.uncontrolled_psychiatric_or_subuse = true;
    const r = run(form);
    expect(r.decision).toBe("defer");
    expect(r.bullets.some((b) => b.id === "Psychiatric/substance uncontrolled")).toBe(true);

    const all = run(EXAMPLE_MODIFIER_STATE).follow_up_plan.stop_rules.join(" | ");
    expect(all).toContain("persistent_severe_abdominal_pain → evaluate_pancreatitis");
    expect(all).toContain("RUQ_pain_fever_jaundice → evaluate_gallbladder");
    expect(all).toContain("neck_mass_dysphagia_hoarseness → evaluate_thyroid");
  });

  it("sick-day stop rule appears when hydration education is selected with CKD3/diuretics", () => {
    const r = run(EXAMPLE_MODIFIER_STATE); // CKD stage 3 + diuretics + hydration plan
    expect(r.follow_up_plan.stop_rules).toContain("acute_illness_or_dehydration → sick_day_rules_pause_and_review");
  });
});