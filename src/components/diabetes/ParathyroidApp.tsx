import { useMemo, useState } from "react";
import { Calculator, Activity, BookOpen, AlertTriangle } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

/* ---------------- logic ---------------- */

type Dx =
  | "unclassified"
  | "hypoparathyroidism"
  | "hyperparathyroidism"
  | "secondary hyperparathyroidism"
  | "needs_repeat_testing";

type Flags = {
  kidney_stone: boolean;
  osteoporosis_or_fragility_fracture: boolean;
  hypercalcemia_symptoms: boolean;
  post_surgical_neck_history: boolean;
  ckd: boolean;
  vitamin_d_deficiency_risk: boolean;
};

type Inputs = {
  ca: number; // albumin-adjusted / total calcium mg/dL
  ica: number; // ionized mmol/L
  pth: number; // pg/mL
  phos: number;
  mg: number;
  cr: number; // serum creatinine mg/dL
  egfr: number;
  vitd: number;
  uCa: number; // spot urine calcium mg/dL (or 24-h mg/dL equivalent)
  uCr: number; // urine creatinine mg/dL
  uCa24: number; // 24-h urine calcium mg/24h
  flags: Flags;
};

type CccrState = "fhh" | "indeterminate" | "phpt" | "unknown";

type Result = {
  dx: Dx;
  confidence: "low" | "moderate" | "high";
  rules: string[];
  next: string[];
  caState: "low" | "normal" | "high" | "unknown";
  pthState: "low" | "normal" | "high" | "unknown";
  cacr: number; // simple urine Ca:Cr ratio (mg/mg)
  cccr: number; // calcium clearance : creatinine clearance ratio
  cccrState: CccrState;
  cccrNote: string;
};

/**
 * Calcium clearance to creatinine clearance ratio (CCCR)
 *   CCCR = (urine Ca x serum Cr) / (serum Ca x urine Cr)
 * All four values in mg/dL (units cancel). Valid only when hypercalcaemia is
 * PTH-dependent, vitamin D is replete and the patient is not on thiazides/lithium.
 */
export function calcCccr(i: {
  uCa: number;
  cr: number;
  ca: number;
  uCr: number;
}): number {
  const { uCa, cr, ca, uCr } = i;
  if (![uCa, cr, ca, uCr].every((v) => isFinite(v) && v > 0)) return NaN;
  return (uCa * cr) / (ca * uCr);
}

export function classifyCccr(cccr: number): { state: CccrState; note: string } {
  if (!isFinite(cccr)) {
    return {
      state: "unknown",
      note: "Enter urine calcium, urine creatinine, serum calcium and serum creatinine to compute the ratio.",
    };
  }
  if (cccr < 0.01)
    return {
      state: "fhh",
      note: "CCCR <0.01 — favours familial hypocalciuric hypercalcaemia (FHH). ~80% of FHH sits below this cut-off; do not proceed to parathyroidectomy on this pattern alone.",
    };
  if (cccr <= 0.02)
    return {
      state: "indeterminate",
      note: "CCCR 0.01–0.02 — indeterminate zone; both FHH and primary hyperparathyroidism occur here. Repeat off thiazides/lithium after vitamin D repletion, and consider CASR genetic testing plus family calcium screening.",
    };
  return {
    state: "phpt",
    note: "CCCR >0.02 — favours primary hyperparathyroidism over FHH.",
  };
}

const CA_LOW = 8.5;
const CA_HIGH = 10.2;
const PTH_LOW = 15;
const PTH_HIGH = 65;

function classify(i: Inputs): Result {
  const rules: string[] = [];
  const next: string[] = [];

  // Prefer total/adjusted calcium; fall back to ionized calcium (ref 1.15–1.30 mmol/L).
  let caState: Result["caState"] = "unknown";
  if (isFinite(i.ca)) caState = i.ca < CA_LOW ? "low" : i.ca > CA_HIGH ? "high" : "normal";
  else if (isFinite(i.ica)) caState = i.ica < 1.15 ? "low" : i.ica > 1.3 ? "high" : "normal";

  const pthState: Result["pthState"] = !isFinite(i.pth)
    ? "unknown"
    : i.pth < PTH_LOW
      ? "low"
      : i.pth > PTH_HIGH
        ? "high"
        : "normal";

  const cacr =
    isFinite(i.uCa) && isFinite(i.uCr) && i.uCr > 0 ? i.uCa / i.uCr : NaN;
  const cccr = calcCccr({ uCa: i.uCa, cr: i.cr, ca: i.ca, uCr: i.uCr });
  const { state: cccrState, note: cccrNote } = classifyCccr(cccr);

  let dx: Dx = "unclassified";
  let confidence: Result["confidence"] = "low";

  if (caState === "unknown" || pthState === "unknown") {
    return {
      dx: "unclassified",
      confidence: "low",
      rules: ["Calcium and PTH must be entered together — PTH is only interpretable against a simultaneous calcium."],
      next: ["Order simultaneous serum calcium (with albumin) and intact PTH.", "Add phosphate, magnesium, creatinine/eGFR and 25-OH vitamin D."],
      caState,
      pthState,
      cacr,
      cccr,
      cccrState,
      cccrNote,
    };
  }

  // Node B — hypercalcaemia
  if (caState === "high") {
    if (pthState === "high" || pthState === "normal") {
      dx = "hyperparathyroidism";
      confidence = pthState === "high" ? "high" : "moderate";
      rules.push(
        pthState === "high"
          ? "B: High calcium with elevated PTH — PTH-dependent hypercalcaemia."
          : "B: High calcium with inappropriately normal (non-suppressed) PTH — PTH-dependent hypercalcaemia.",
      );
      next.push(
        "Confirm on a repeat simultaneous Ca + PTH sample.",
        "24-h urine calcium and calcium:creatinine clearance ratio (CCCR) to exclude familial hypocalciuric hypercalcaemia (FHH).",
        "Check 25-OH vitamin D, phosphate, creatinine/eGFR; replete vitamin D before interpreting PTH magnitude.",
        "Assess end-organ disease: DXA (distal 1/3 radius, spine, hip) and renal imaging for stones/nephrocalcinosis.",
      );

      // ---- FHH vs primary hyperparathyroidism discrimination ----
      if (cccrState === "fhh") {
        rules.push(`CCCR ${cccr.toFixed(4)} (<0.01) — favours FHH over primary hyperparathyroidism.`);
        confidence = "low";
        next.push(
          "Do not refer for parathyroidectomy on this pattern — surgery does not correct FHH.",
          "CASR (± AP2S1, GNA11) genetic testing and screen first-degree relatives' serum calcium.",
          "Exclude confounders that lower CCCR: thiazides, lithium, vitamin D deficiency, low calcium intake, CKD (eGFR <60), pregnancy/lactation.",
        );
      } else if (cccrState === "indeterminate") {
        rules.push(`CCCR ${cccr.toFixed(4)} (0.01–0.02) — indeterminate; FHH and primary hyperparathyroidism overlap in this band.`);
        confidence = "low";
        next.push(
          "Repeat CCCR after vitamin D repletion and off thiazides/lithium for ≥2–4 weeks (where safe).",
          "Add 24-h urine calcium and family calcium screening; consider CASR genetic testing before surgery.",
        );
      } else if (cccrState === "phpt") {
        rules.push(`CCCR ${cccr.toFixed(4)} (>0.02) — favours primary hyperparathyroidism; FHH unlikely.`);
        if (pthState === "high") confidence = "high";
      } else {
        next.push(
          "Compute CCCR: enter urine calcium, urine creatinine, serum calcium and serum creatinine (all mg/dL from the same collection).",
        );
      }

      if (isFinite(i.uCa24)) {
        if (i.uCa24 < 100) {
          rules.push(`24-h urine calcium ${i.uCa24} mg/24h (<100) — hypocalciuric; supports FHH.`);
        } else if (i.uCa24 > 400) {
          rules.push(`24-h urine calcium ${i.uCa24} mg/24h (>400) — hypercalciuric; supports primary hyperparathyroidism and raises stone risk.`);
        }
      }

      if (isFinite(i.egfr) && i.egfr < 60 && cccrState !== "unknown") {
        rules.push("eGFR <60 — reduced filtered calcium lowers CCCR and can mimic FHH; interpret the ratio with caution.");
      }
      if (isFinite(i.vitd) && i.vitd < 20 && cccrState !== "unknown") {
        rules.push("25-OH vitamin D <20 ng/mL — vitamin D deficiency lowers urine calcium and can falsely suggest FHH; repeat CCCR after repletion.");
      }

      if (i.flags.kidney_stone || i.flags.osteoporosis_or_fragility_fracture || i.flags.hypercalcemia_symptoms) {
        next.push(
          cccrState === "fhh"
            ? "End-organ findings with a FHH-range CCCR are discordant — confirm FHH genetically before considering surgery."
            : "End-organ involvement or symptoms present — refer for surgical (parathyroidectomy) assessment.",
        );
      }
    } else {
      dx = "unclassified";
      confidence = "moderate";
      rules.push("High calcium with suppressed PTH — non-PTH-mediated hypercalcaemia (not hyperparathyroidism).");
      next.push(
        "Work up malignancy (PTHrP, myeloma screen), granulomatous disease (1,25-OH vitamin D), vitamin D/calcium intoxication, thyrotoxicosis, thiazides, lithium.",
      );
    }
  }

  // Node A — hypocalcaemia
  else if (caState === "low") {
    if (pthState === "low" || pthState === "normal") {
      dx = "hypoparathyroidism";
      confidence = pthState === "low" ? "high" : "moderate";
      rules.push(
        pthState === "low"
          ? "A: Low calcium with low PTH — PTH deficiency."
          : "A: Low calcium with inappropriately normal PTH (should be markedly elevated) — relative PTH deficiency.",
      );
      next.push(
        "Confirm with ionized calcium and repeat PTH.",
        "Check magnesium — hypomagnesaemia causes functional hypoparathyroidism and must be corrected first.",
        "Check phosphate (typically high), creatinine/eGFR and 25-OH vitamin D.",
        "Assess ECG (QTc) and neuromuscular signs; treat symptomatic/severe hypocalcaemia urgently.",
      );
      if (isFinite(i.mg) && i.mg < 1.6) {
        rules.push("Magnesium low — correct magnesium before diagnosing true hypoparathyroidism.");
        dx = "needs_repeat_testing";
        confidence = "moderate";
      }
      if (i.flags.post_surgical_neck_history) {
        rules.push("Prior neck surgery — post-surgical hypoparathyroidism is the commonest cause.");
        next.push("Define as chronic if persisting >6 months post-operatively.");
      }
    } else {
      dx = "secondary hyperparathyroidism";
      confidence = "moderate";
      rules.push("C: Low calcium with high PTH — appropriate PTH response; look for the cause.");
      next.push("Evaluate vitamin D deficiency, malabsorption/coeliac disease, CKD, and drug effects.");
    }
  }

  // Normal calcium
  else {
    if (pthState === "high") {
      const causes: string[] = [];
      if (isFinite(i.vitd) && i.vitd < 30) causes.push("25-OH vitamin D <30 ng/mL");
      if (isFinite(i.egfr) && i.egfr < 60) causes.push("eGFR <60 mL/min/1.73m²");
      if (i.flags.ckd) causes.push("known CKD");
      if (i.flags.vitamin_d_deficiency_risk) causes.push("vitamin D deficiency risk");

      if (causes.length) {
        dx = "secondary hyperparathyroidism";
        confidence = "moderate";
        rules.push(`C: High PTH with non-elevated calcium and a secondary driver present (${causes.join(", ")}).`);
        next.push(
          "Replete vitamin D to ≥30 ng/mL and ensure adequate calcium intake, then recheck Ca + PTH in 3 months.",
          "If CKD, manage per CKD-MBD: phosphate control, vitamin D status, avoid over-suppression of PTH.",
        );
      } else {
        dx = "hyperparathyroidism";
        confidence = "low";
        rules.push("C: Elevated PTH with normal calcium and no identified secondary cause — possible normocalcaemic primary hyperparathyroidism.");
        next.push(
          "Diagnosis of exclusion: requires repeatedly normal albumin-adjusted AND ionized calcium with replete vitamin D and normal renal function.",
          "Exclude malabsorption, hypercalciuria, loop diuretics, bisphosphonates/denosumab.",
          "Repeat Ca + PTH after vitamin D repletion before labelling.",
        );
      }
    } else if (pthState === "low") {
      dx = "needs_repeat_testing";
      confidence = "low";
      rules.push("D: Normal calcium with low PTH — unclear pattern.");
      next.push("Repeat simultaneous Ca + PTH; check magnesium and consider assay/sampling error.");
    } else {
      dx = "unclassified";
      confidence = "high";
      rules.push("Normal calcium with normal PTH — no parathyroid disorder identified on these labs.");
      next.push("If clinically suspicious, repeat testing and review magnesium, vitamin D and urine calcium.");
    }
  }

  if (isFinite(i.phos)) {
    if (i.phos > 4.5) rules.push("Phosphate high — supports hypoparathyroidism or CKD.");
    if (i.phos < 2.5) rules.push("Phosphate low — supports PTH excess (phosphaturic effect).");
  }
  if (isFinite(i.egfr) && i.egfr < 60) {
    next.push("eGFR <60 — interpret PTH in the CKD-MBD context; PTH rises physiologically as GFR falls.");
  }

  return { dx, confidence, rules, next, caState, pthState, cacr, cccr, cccrState, cccrNote };
}

/* ---------------- UI ---------------- */

const DX_LABEL: Record<Dx, string> = {
  unclassified: "Unclassified",
  hypoparathyroidism: "Hypoparathyroidism likely",
  hyperparathyroidism: "Hyperparathyroidism likely",
  "secondary hyperparathyroidism": "Secondary hyperparathyroidism likely",
  needs_repeat_testing: "Needs repeat testing",
};

const DX_TONE: Record<Dx, "default" | "warning" | "danger" | "success" | "info" | "primary"> = {
  unclassified: "default",
  hypoparathyroidism: "info",
  hyperparathyroidism: "danger",
  "secondary hyperparathyroidism": "warning",
  needs_repeat_testing: "warning",
};

function Num({
  id, label, unit, value, onChange, placeholder,
}: {
  id: string; label: string; unit: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label} <span className="text-muted-foreground">({unit})</span>
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

const FLAG_LABELS: Array<{ k: keyof Flags; label: string }> = [
  { k: "kidney_stone", label: "Kidney stone(s)" },
  { k: "osteoporosis_or_fragility_fracture", label: "Osteoporosis / fragility fracture" },
  { k: "hypercalcemia_symptoms", label: "Hypercalcaemia symptoms" },
  { k: "post_surgical_neck_history", label: "Prior neck / thyroid surgery" },
  { k: "ckd", label: "Known CKD" },
  { k: "vitamin_d_deficiency_risk", label: "Vitamin D deficiency risk" },
];

function Identifier() {
  const [f, setF] = useState({
    ca: "", ica: "", pth: "", phos: "", mg: "", cr: "", egfr: "", vitd: "", uCa: "", uCr: "", uCa24: "",
  });
  const [flags, setFlags] = useState<Flags>({
    kidney_stone: false,
    osteoporosis_or_fragility_fracture: false,
    hypercalcemia_symptoms: false,
    post_surgical_neck_history: false,
    ckd: false,
    vitamin_d_deficiency_risk: false,
  });

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const n = (v: string) => parseFloat(v);

  const res = useMemo(
    () =>
      classify({
        ca: n(f.ca), ica: n(f.ica), pth: n(f.pth), phos: n(f.phos), mg: n(f.mg), cr: n(f.cr),
        egfr: n(f.egfr), vitd: n(f.vitd), uCa: n(f.uCa), uCr: n(f.uCr), uCa24: n(f.uCa24), flags,
      }),
    [f, flags],
  );

  return (
    <SectionCard
      id="pt-identifier"
      title="Parathyroid disorder identifier"
      subtitle="Enter simultaneous calcium and PTH — the pattern, not either value alone, makes the diagnosis"
      icon={<Calculator className="h-5 w-5" />}
      tone="info"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Num id="pt-ca" label="Calcium (albumin-adjusted/total)" unit="mg/dL" value={f.ca} onChange={set("ca")} placeholder="8.5–10.2" />
          <Num id="pt-pth" label="Intact PTH" unit="pg/mL" value={f.pth} onChange={set("pth")} placeholder="15–65" />
          <Num id="pt-ica" label="Ionized calcium" unit="mmol/L" value={f.ica} onChange={set("ica")} placeholder="1.15–1.30" />
          <Num id="pt-phos" label="Phosphate" unit="mg/dL" value={f.phos} onChange={set("phos")} placeholder="2.5–4.5" />
          <Num id="pt-mg" label="Magnesium" unit="mg/dL" value={f.mg} onChange={set("mg")} placeholder="1.7–2.2" />
          <Num id="pt-cr" label="Serum creatinine" unit="mg/dL" value={f.cr} onChange={set("cr")} placeholder="for CCCR" />
          <Num id="pt-egfr" label="eGFR" unit="mL/min/1.73m²" value={f.egfr} onChange={set("egfr")} />
          <Num id="pt-vitd" label="25-OH vitamin D" unit="ng/mL" value={f.vitd} onChange={set("vitd")} placeholder="≥30" />
          <Num id="pt-uca" label="Urine calcium (same sample)" unit="mg/dL" value={f.uCa} onChange={set("uCa")} placeholder="for CCCR" />
          <Num id="pt-ucr" label="Urine creatinine (same sample)" unit="mg/dL" value={f.uCr} onChange={set("uCr")} placeholder="for CCCR" />
          <Num id="pt-uca24" label="24-h urine calcium" unit="mg/24h" value={f.uCa24} onChange={set("uCa24")} placeholder="100–300" />
        </div>


        <fieldset className="rounded-md border border-border p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clinical flags
          </legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FLAG_LABELS.map(({ k, label }) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={flags[k]}
                  onCheckedChange={(v) => setFlags((p) => ({ ...p, [k]: v === true }))}
                  aria-label={label}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Calcium" value={res.caState} hint={`Ref ${CA_LOW}–${CA_HIGH} mg/dL`} />
          <Stat label="PTH" value={res.pthState} hint={`Ref ${PTH_LOW}–${PTH_HIGH} pg/mL`} />
          <Stat
            label="Urine Ca:Cr ratio"
            value={isFinite(res.cacr) ? res.cacr.toFixed(3) : "—"}
            hint="spot mg/mg — screening only"
          />
          <Stat
            label="CCCR (Ca clear : Cr clear)"
            value={isFinite(res.cccr) ? res.cccr.toFixed(4) : "—"}
            hint="<0.01 FHH · 0.01–0.02 grey · >0.02 PHPT"
          />
        </div>

        <Callout
          tone={
            res.cccrState === "fhh"
              ? "warning"
              : res.cccrState === "phpt"
                ? "success"
                : res.cccrState === "indeterminate"
                  ? "warning"
                  : "info"
          }
          title={
            res.cccrState === "fhh"
              ? "FHH favoured (CCCR <0.01)"
              : res.cccrState === "phpt"
                ? "Primary hyperparathyroidism favoured (CCCR >0.02)"
                : res.cccrState === "indeterminate"
                  ? "Indeterminate CCCR (0.01–0.02)"
                  : "CCCR not calculated"
          }
        >
          <p>{res.cccrNote}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            CCCR = (urine Ca × serum Cr) ÷ (serum Ca × urine Cr), all in mg/dL from the same
            timed/spot collection. Only interpretable in PTH-dependent hypercalcaemia, off
            thiazides/lithium, with vitamin D replete and normal renal function.
          </p>
        </Callout>


        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Likely diagnosis:</span>
            <Pill tone={DX_TONE[res.dx]}>{DX_LABEL[res.dx]}</Pill>
            <Pill tone="default">confidence: {res.confidence}</Pill>
          </div>

          {res.rules.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Triggered rules
              </div>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {res.rules.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          )}

          {res.next.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Next steps
              </div>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {res.next.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>

        <Callout tone="warning" title="Interpretation caveat">
          Calcium and PTH must be drawn at the same time. Correct magnesium and vitamin D deficiency
          before labelling a parathyroid disorder, and prefer ionized calcium when albumin, pH or renal
          function are abnormal.
        </Callout>
      </div>
    </SectionCard>
  );
}

function Patterns() {
  return (
    <SectionCard
      id="pt-patterns"
      title="Ca × PTH pattern grid"
      subtitle="First step: always read calcium and PTH together"
      icon={<Activity className="h-5 w-5" />}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-3 font-semibold">Calcium</th>
              <th className="py-2 pr-3 font-semibold">PTH</th>
              <th className="py-2 pr-3 font-semibold">Pattern</th>
              <th className="py-2 font-semibold">Typical causes</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-border/60">
            <tr><td className="py-2 pr-3">High</td><td className="pr-3">High / inappropriately normal</td><td className="pr-3">Primary hyperparathyroidism</td><td>Adenoma, hyperplasia; FHH if hypocalciuric</td></tr>
            <tr><td className="py-2 pr-3">High</td><td className="pr-3">Suppressed</td><td className="pr-3">Non-PTH hypercalcaemia</td><td>Malignancy/PTHrP, myeloma, granuloma, vitamin D excess</td></tr>
            <tr><td className="py-2 pr-3">Low</td><td className="pr-3">Low / inappropriately normal</td><td className="pr-3">Hypoparathyroidism</td><td>Post-surgical, autoimmune, hypomagnesaemia, genetic</td></tr>
            <tr><td className="py-2 pr-3">Low</td><td className="pr-3">High</td><td className="pr-3">Secondary hyperparathyroidism</td><td>Vitamin D deficiency, CKD, malabsorption</td></tr>
            <tr><td className="py-2 pr-3">Normal</td><td className="pr-3">High</td><td className="pr-3">Secondary vs normocalcaemic primary</td><td>Vitamin D deficiency / CKD first; primary is a diagnosis of exclusion</td></tr>
            <tr><td className="py-2 pr-3">Normal</td><td className="pr-3">Normal</td><td className="pr-3">No parathyroid disorder</td><td>Repeat if clinically suspicious</td></tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-1">
        <KeyRow k="Reference calcium (total)" v="8.5–10.2 mg/dL" mono />
        <KeyRow k="Reference ionized calcium" v="1.15–1.30 mmol/L" mono />
        <KeyRow k="Reference intact PTH" v="15–65 pg/mL (assay-dependent)" mono />
      </div>
    </SectionCard>
  );
}

function Pitfalls() {
  return (
    <SectionCard
      id="pt-pitfalls"
      title="Pitfalls & confirmatory tests"
      icon={<AlertTriangle className="h-5 w-5" />}
      tone="warning"
      defaultOpen={false}
    >
      <div className="space-y-3 text-sm">
        <Callout tone="danger" title="Do not miss">
          Severe symptomatic hypocalcaemia (tetany, seizures, prolonged QTc) and hypercalcaemic crisis
          (Ca &gt;14 mg/dL, altered mental state) need urgent treatment before completing the workup.
        </Callout>
        <div className="grid gap-1">
          <KeyRow k="Hypomagnesaemia" v="Suppresses PTH secretion and action — correct Mg first" />
          <KeyRow k="Vitamin D deficiency" v="Raises PTH; can mask hypercalcaemia of primary HPT" />
          <KeyRow k="CKD" v="PTH rises as eGFR falls — interpret via CKD-MBD targets, not general ranges" />
          <KeyRow k="Thiazides / lithium" v="Raise calcium and PTH; recheck off drug where safe" />
          <KeyRow k="Bisphosphonates / denosumab" v="Lower calcium and drive a secondary PTH rise" />
          <KeyRow k="FHH" v="Urine Ca:Cr clearance ratio <0.01, lifelong mild hypercalcaemia, family history" />
          <KeyRow k="Albumin-adjusted calcium" v="Misclassifies — prefer uncorrected total or ionized calcium" />
        </div>
      </div>
    </SectionCard>
  );
}

function Abbrev() {
  return (
    <SectionCard id="pt-abbrev" title="Abbreviations" icon={<BookOpen className="h-5 w-5" />} defaultOpen={false}>
      <div className="grid gap-1">
        <KeyRow k="PTH" v="Parathyroid hormone" />
        <KeyRow k="CKD" v="Chronic kidney disease" />
        <KeyRow k="eGFR" v="Estimated glomerular filtration rate" />
        <KeyRow k="FHH" v="Familial hypocalciuric hypercalcaemia" />
        <KeyRow k="CKD-MBD" v="CKD–mineral and bone disorder" />
      </div>
    </SectionCard>
  );
}

export default function ParathyroidApp() {
  return (
    <div className="space-y-4">
      <Identifier />
      <Patterns />
      <Pitfalls />
      <Abbrev />
    </div>
  );
}
