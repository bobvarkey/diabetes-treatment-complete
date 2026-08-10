import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Eye, FlaskConical, Pill, Stethoscope, Target } from "lucide-react";
import { SectionCard, KeyRow, Pill as Tag, Callout } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import teprotumumabTed from "@/assets/teprotumumab-ted.png.asset.json";


/* ---------- JTA / Akamizu thyroid storm evaluator ---------- */

export type JtaInput = {
  labStatus: "confirmed" | "pending" | "notElevated";
  severeBrain: boolean;
  fever: boolean;
  tachycardia: boolean;
  heartFailure: boolean;
  giHep: boolean;
};

export type JtaVerdict = "TS1" | "TS2" | "uncertain" | "notMet";

export function evaluateJta(i: JtaInput): {
  verdict: JtaVerdict;
  label: string;
  tone: "default" | "warning" | "danger" | "success" | "info" | "primary";
  majorCount: number;
  combination: string;
  reasons: string[];
} {
  const majors: [boolean, string][] = [
    [i.fever, "Fever ≥38 °C"],
    [i.tachycardia, "Tachycardia ≥130 bpm"],
    [i.heartFailure, "Heart failure"],
    [i.giHep, "GI / hepatic manifestation"],
  ];
  const present = majors.filter(([v]) => v).map(([, l]) => l);
  const majorCount = present.length;

  // TS1 symptom combinations (Akamizu): CNS + ≥1 major, OR ≥3 majors
  const meetsTs1Combination = (i.severeBrain && majorCount >= 1) || majorCount >= 3;
  // TS2 symptom combinations: exactly 2 majors, OR CNS alone with no major
  const meetsTs2Combination = majorCount === 2 || (i.severeBrain && majorCount === 0);

  const reasons: string[] = [];
  if (i.severeBrain) reasons.push("CNS manifestation present");
  if (present.length) reasons.push(`Major features: ${present.join(", ")}`);
  if (!i.severeBrain && !present.length) reasons.push("No qualifying storm features selected");

  const combination = meetsTs1Combination
    ? i.severeBrain && majorCount >= 1
      ? "CNS symptom + ≥1 major feature"
      : "≥3 major features"
    : meetsTs2Combination
      ? i.severeBrain
        ? "CNS symptom without major features"
        : "2 major features"
      : "No qualifying combination";

  if (i.labStatus === "notElevated") {
    reasons.push("Free T₃/free T₄ not elevated — biochemical thyrotoxicosis excluded, so neither TS1 nor TS2 can be assigned");
    return {
      verdict: "notMet",
      label: "Does not meet TS1 / TS2 — thyrotoxicosis not confirmed",
      tone: "success",
      majorCount,
      combination,
      reasons,
    };
  }

  if (!meetsTs1Combination && !meetsTs2Combination) {
    reasons.push("Symptom combination does not reach a TS1 or TS2 pattern");
    return {
      verdict: "notMet",
      label: "Does not meet TS1 / TS2",
      tone: "success",
      majorCount,
      combination,
      reasons,
    };
  }

  if (i.labStatus === "pending") {
    reasons.push("Free T₃/free T₄ pending — a TS1 pattern is graded TS2 until labs confirm thyrotoxicosis");
    return {
      verdict: meetsTs1Combination ? "TS2" : "uncertain",
      label: meetsTs1Combination
        ? "Suspected thyroid storm (TS2) — TS1 pattern awaiting free T₃/T₄"
        : "Uncertain — TS2 pattern awaiting free T₃/T₄ confirmation",
      tone: meetsTs1Combination ? "warning" : "info",
      majorCount,
      combination,
      reasons,
    };
  }

  // labStatus === confirmed
  if (meetsTs1Combination) {
    reasons.push("Biochemical thyrotoxicosis confirmed + TS1 symptom combination");
    return {
      verdict: "TS1",
      label: "Definite thyroid storm (TS1)",
      tone: "danger",
      majorCount,
      combination,
      reasons,
    };
  }

  reasons.push("Biochemical thyrotoxicosis confirmed + TS2 symptom combination");
  return {
    verdict: "TS2",
    label: "Suspected thyroid storm (TS2)",
    tone: "warning",
    majorCount,
    combination,
    reasons,
  };
}

/* ---------- Reference tables ---------- */

const tftPatterns: [string, string, string, string][] = [
  ["Overt hypothyroidism", "↑", "↓", "Levothyroxine replacement"],
  ["Subclinical hypothyroidism", "↑ (mildly)", "Normal", "Treat if TSH >10, symptoms, pregnancy, TPO+"],
  ["Overt hyperthyroidism", "↓ (suppressed)", "↑", "ATD / RAI / surgery"],
  ["Subclinical hyperthyroidism", "↓", "Normal", "Treat if TSH <0.1 + age >65 / CVD / osteoporosis"],
  ["Central hypothyroidism", "Low or inappropriately normal", "↓", "LT4 (after cortisol replacement if needed)"],
  ["Non-thyroidal illness (ESS)", "Low / normal", "Low T3, normal/low T4, rT3 ↑", "Do not treat; recheck after recovery"],
  ["T3 toxicosis", "↓", "Normal T4, ↑ T3", "Early Graves / autonomous nodule"],
  ["Assay interference / biotin", "Discordant", "Discordant", "Repeat off biotin ≥48 h; alt assay"],
];

const hypoCauses = [
  { t: "Hashimoto's (chronic autoimmune)", d: "Commonest cause in iodine-sufficient areas. TPO Ab ± Tg Ab positive. Firm goitre or atrophic gland." },
  { t: "Iatrogenic", d: "Post-thyroidectomy, post-RAI, external neck radiation, anti-thyroid drugs, lithium, amiodarone, checkpoint inhibitors, TKIs." },
  { t: "Iodine deficiency / excess", d: "Deficiency → endemic goitre & hypothyroidism. Excess (amiodarone, contrast) → Wolff-Chaikoff." },
  { t: "Congenital / infiltrative", d: "Dysgenesis, dyshormonogenesis; Riedel thyroiditis, hemochromatosis, sarcoid, amyloid." },
  { t: "Central", d: "Pituitary/hypothalamic disease — TSH low or inappropriately normal with low free T4." },
];

const hyperCauses = [
  { t: "Graves' disease", d: "Diffuse goitre, orbitopathy, pretibial myxedema. TRAb / TSI positive. Homogeneous ↑ uptake on scan." },
  { t: "Toxic multinodular goitre", d: "Older patients, long-standing goitre. Patchy uptake, hot & cold nodules." },
  { t: "Toxic adenoma", d: "Single autonomous hot nodule with suppressed surrounding uptake." },
  { t: "Thyroiditis (destructive)", d: "Subacute (De Quervain — painful, ↑ ESR), silent, postpartum, drug-induced (amiodarone type 2, IFN-α, immunotherapy). Low uptake on scan." },
  { t: "Exogenous / factitious", d: "Levothyroxine over-replacement, thyrotoxicosis factitia. Low Tg, low uptake." },
  { t: "Rare", d: "TSH-oma, struma ovarii, hCG-mediated (gestational, molar), iodine-induced (Jod-Basedow)." },
];

const antiThyroidDrugs: [string, string, string][] = [
  ["Carbimazole", "10–40 mg/day → maintenance 5–15 mg", "First line (non-pregnant). Cheap, once-daily."],
  ["Methimazole", "10–40 mg/day → 5–10 mg maintenance", "Preferred in 2nd/3rd trimester and lactation."],
  ["Propylthiouracil (PTU)", "100–150 mg TDS → 50 mg BD–TDS", "First trimester of pregnancy, thyroid storm, ATD allergy. Hepatotoxicity risk."],
  ["Propranolol", "20–40 mg q6–8h (up to 320 mg/d)", "Symptom control; blocks T4→T3 at high dose."],
  ["Lugol's iodine / SSKI", "5–7 drops SSKI q6h", "Storm, pre-op (start ≥1 h after ATD)."],
  ["Hydrocortisone", "100 mg IV q8h", "Storm; blocks T4→T3 conversion."],
];

/* ---------- LT4 dosing ---------- */

function calcLt4({ weightKg, age, cardiac, subclinical, pregnant }: {
  weightKg: number; age: number; cardiac: boolean; subclinical: boolean; pregnant: boolean;
}) {
  if (!weightKg || weightKg <= 0) return null;
  let dosePerKg = 1.6;
  let note = "Full replacement 1.6 µg/kg/day.";
  if (pregnant) { dosePerKg = 2.0; note = "Pregnancy: ~2.0 µg/kg/day (increase pre-pregnancy dose ~30%)."; }
  else if (cardiac || age >= 65) { dosePerKg = 0.5; note = "Elderly / cardiac: start 25–50 µg, titrate q4–6 wk."; }
  else if (subclinical) { dosePerKg = 1.0; note = "Subclinical: 1.0–1.2 µg/kg/day (or fixed 25–75 µg)."; }
  const total = Math.round(weightKg * dosePerKg / 12.5) * 12.5;
  const clamped = cardiac || age >= 65 ? Math.min(total, 50) : total;
  return { dose: clamped, dosePerKg, note };
}

/* ---------- Burch–Wartofsky Storm score ---------- */

const bwsFields = [
  { key: "temp", label: "Temperature", opts: [[0, "<37.2 °C"], [5, "37.2–37.7"], [10, "37.8–38.2"], [15, "38.3–38.8"], [20, "38.9–39.4"], [25, "39.4–39.9"], [30, "≥40 °C"]] },
  { key: "cns", label: "CNS effects", opts: [[0, "Absent"], [10, "Mild (agitation)"], [20, "Moderate (delirium, psychosis, extreme lethargy)"], [30, "Severe (seizure, coma)"]] },
  { key: "gi", label: "GI–hepatic", opts: [[0, "Absent"], [10, "Moderate (diarrhoea, nausea, vomiting, abdo pain)"], [20, "Severe (unexplained jaundice)"]] },
  { key: "hr", label: "Tachycardia", opts: [[0, "<90"], [5, "90–109"], [10, "110–119"], [15, "120–129"], [20, "130–139"], [25, "≥140"]] },
  { key: "chf", label: "Congestive heart failure", opts: [[0, "Absent"], [5, "Mild (edema)"], [10, "Moderate (bibasilar rales)"], [15, "Severe (pulmonary edema)"]] },
  { key: "af", label: "Atrial fibrillation", opts: [[0, "Absent"], [10, "Present"]] },
  { key: "trigger", label: "Precipitant history", opts: [[0, "Negative"], [10, "Positive"]] },
] as const;

/* ---------- Component ---------- */

export default function ThyroidApp() {
  const [wt, setWt] = useState<number | "">(60);
  const [age, setAge] = useState<number | "">(40);
  const [cardiac, setCardiac] = useState(false);
  const [subclinical, setSubclinical] = useState(false);
  const [pregnant, setPregnant] = useState(false);
  const lt4 = useMemo(
    () => (typeof wt === "number" && typeof age === "number"
      ? calcLt4({ weightKg: wt, age, cardiac, subclinical, pregnant })
      : null),
    [wt, age, cardiac, subclinical, pregnant],
  );

  const [bws, setBws] = useState<Record<string, number>>({});
  const bwsTotal = Object.values(bws).reduce((a, b) => a + b, 0);
  const bwsBand =
    bwsTotal >= 45 ? { tone: "danger" as const, txt: "Highly suggestive of thyroid storm" } :
    bwsTotal >= 25 ? { tone: "warning" as const, txt: "Impending storm — treat aggressively" } :
    { tone: "info" as const, txt: "Storm unlikely" };

  const [popo, setPopo] = useState({
    temp: 0, cns: 0, gi: 0, precipitant: false,
    brady: 0, ecg: false, pericardial: false, pleural: false,
    pulmEdema: false, cardiomegaly: false, hypotension: false,
    hyponatremia: false, hypoglycemia: false, hypoxemia: false,
    hypercarbia: false, decreasedGfr: false,
  });
  const popoTotal =
    popo.temp + popo.cns + popo.gi +
    (popo.precipitant ? 10 : 0) +
    popo.brady +
    (popo.ecg ? 10 : 0) + (popo.pericardial ? 10 : 0) + (popo.pleural ? 10 : 0) +
    (popo.pulmEdema ? 15 : 0) + (popo.cardiomegaly ? 15 : 0) + (popo.hypotension ? 20 : 0) +
    (popo.hyponatremia ? 10 : 0) + (popo.hypoglycemia ? 10 : 0) + (popo.hypoxemia ? 10 : 0) +
    (popo.hypercarbia ? 10 : 0) + (popo.decreasedGfr ? 10 : 0);
  const popoBand =
    popoTotal >= 60 ? { tone: "danger" as const, txt: "Diagnostic of myxedema coma (≥60)" } :
    popoTotal >= 25 ? { tone: "warning" as const, txt: "Supportive of myxedema coma (25–59)" } :
    { tone: "info" as const, txt: "Myxedema coma unlikely (<25)" };

  const [jta, setJta] = useState({
    labStatus: "pending" as "confirmed" | "pending" | "notElevated",
    severeBrain: false,
    fever: false,
    tachycardia: false,
    heartFailure: false,
    giHep: false,
  });
  const jtaEval = evaluateJta(jta);


  return (
    <div className="space-y-5">
      <SectionCard
        id="tft-patterns"
        title="Interpreting thyroid function tests"
        subtitle="TSH-first strategy; interpret free T4/T3 in context"
        icon={<FlaskConical className="h-5 w-5" />}
        defaultOpen
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">Pattern</th><th className="p-2">TSH</th><th className="p-2">Free T4 / T3</th><th className="p-2">Action</th></tr>
            </thead>
            <tbody>
              {tftPatterns.map(([p, tsh, t4, act]) => (
                <tr key={p} className="border-t border-border">
                  <td className="p-2 font-medium">{p}</td>
                  <td className="p-2 font-mono">{tsh}</td>
                  <td className="p-2 font-mono">{t4}</td>
                  <td className="p-2 text-muted-foreground">{act}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout tone="info" title="TSH reference ranges">
          Adult 0.4–4.0 mIU/L. Pregnancy trimester-specific: T1 0.1–2.5, T2 0.2–3.0, T3 0.3–3.0 mIU/L
          (use local assay-specific ranges when available).
        </Callout>
      </SectionCard>

      <SectionCard
        id="hypo"
        title="Hypothyroidism"
        subtitle="Causes, workup and levothyroxine replacement"
        icon={<Stethoscope className="h-5 w-5" />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {hypoCauses.map((c) => (
            <div key={c.t} className="rounded-md border border-border p-3">
              <div className="font-semibold">{c.t}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-3">
          <h4 className="mb-3 flex items-center gap-2 font-semibold"><Pill className="h-4 w-4 text-primary" /> Levothyroxine calculator</h4>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <Label>Weight (kg)</Label>
              <Input type="number" value={wt} onChange={(e) => setWt(e.target.value ? +e.target.value : "")} />
            </div>
            <div>
              <Label>Age (yr)</Label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value ? +e.target.value : "")} />
            </div>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input type="checkbox" checked={cardiac} onChange={(e) => setCardiac(e.target.checked)} /> IHD / arrhythmia
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input type="checkbox" checked={subclinical} onChange={(e) => setSubclinical(e.target.checked)} /> Subclinical
            </label>
            <label className="flex items-center gap-2 pt-1 text-sm md:col-span-4">
              <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} /> Pregnant
            </label>
          </div>
          {lt4 && (
            <div className="mt-3 space-y-1">
              <KeyRow k="Starting LT4 dose" v={`${lt4.dose} µg PO daily`} mono />
              <KeyRow k="Dose intensity" v={`${lt4.dosePerKg} µg/kg/day`} mono />
              <p className="text-xs text-muted-foreground">{lt4.note}</p>
            </div>
          )}
        </div>

        <Callout tone="warning" title="Administration & monitoring">
          Take on empty stomach, 30–60 min before breakfast, or at bedtime ≥3 h after last meal.
          Separate from calcium, iron, PPI, bile acid sequestrants, soy by ≥4 h. Recheck TSH q6–8 wk after dose change; annually once stable.
          In pregnancy, increase pre-pregnancy dose by ~30% on confirmation and check TSH q4 wk in T1–T2.
        </Callout>
      </SectionCard>

      <SectionCard
        id="hyper"
        title="Hyperthyroidism & thyrotoxicosis"
        subtitle="Differentiate Graves' vs thyroiditis vs nodular disease"
        icon={<Activity className="h-5 w-5" />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {hyperCauses.map((c) => (
            <div key={c.t} className="rounded-md border border-border p-3">
              <div className="font-semibold">{c.t}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <h4 className="mb-2 font-semibold">Anti-thyroid & adjunct drugs</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-2">Drug</th><th className="p-2">Dose</th><th className="p-2">Notes</th></tr>
              </thead>
              <tbody>
                {antiThyroidDrugs.map(([d, dose, n]) => (
                  <tr key={d} className="border-t border-border">
                    <td className="p-2 font-medium">{d}</td>
                    <td className="p-2 font-mono">{dose}</td>
                    <td className="p-2 text-muted-foreground">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Callout tone="danger" title="ATD safety alerts">
          Warn about agranulocytosis: stop drug and get urgent CBC if sore throat / fever.
          Baseline & periodic LFTs (PTU hepatotoxicity, MMI cholestasis). ANCA-associated vasculitis with long-term PTU.
        </Callout>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">RAI (¹³¹I)</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Definitive for Graves' / toxic nodular disease. Contraindicated in pregnancy, lactation, active severe orbitopathy.
              Pretreat smokers / mild-moderate orbitopathy with steroids.
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">Surgery</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total thyroidectomy for large goitre, compressive symptoms, suspected malignancy,
              coexisting hyperparathyroidism, moderate–severe orbitopathy, or when RAI/ATD declined.
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">Orbitopathy (Thyroid Eye Disease)</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Selenium 200 µg/day for mild disease. IV methylprednisolone (4.5–7.5 g cumulative)
              for moderate–severe active disease. <strong>Teprotumumab</strong> (IGF-1R monoclonal
              antibody) for progressive / steroid-refractory disease — see TED panel below.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="ted-teprotumumab"
        title="Thyroid Eye Disease (TED) — Teprotumumab"
        subtitle="IGF-1R antibody for active, moderate–severe Graves' orbitopathy"
        icon={<Eye className="h-5 w-5" />}
        tone="info"
      >
        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-start">
          <figure className="overflow-hidden rounded-lg border border-border bg-muted/40">
            <img
              src={teprotumumabTed.url}
              alt="NEJM infographic: Teprotumumab Phase 3 trial in thyroid eye disease — 83% vs 10% proptosis response"
              loading="lazy"
              className="h-auto w-full"
            />
            <figcaption className="p-2 text-[11px] text-muted-foreground">
              Douglas RS et al., NEJM 2020 (10.1056/NEJMoa1910434). Phase 3, multicenter, randomized, double-blind trial.
            </figcaption>
          </figure>
          <div className="space-y-3 text-sm">
            <Callout tone="success" title="Pivotal efficacy">
              In 83 patients with Graves' disease and active TED, an antibody to the IGF-1 receptor
              (<strong>teprotumumab</strong>) produced a meaningful improvement in <strong>83%</strong> of patients
              vs <strong>10%</strong> on placebo at 24 weeks — a ≥2 mm reduction in proptosis
              (difference 73 percentage points; 95% CI 59–88; P&lt;0.001).
            </Callout>
            <div className="rounded-md border border-border p-3">
              <div className="font-semibold">Dosing schedule</div>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                <li><strong>Loading:</strong> 10 mg/kg IV × 1 dose</li>
                <li><strong>Maintenance:</strong> 20 mg/kg IV every 3 weeks × 7 doses</li>
                <li><strong>Total course:</strong> 8 infusions over ~21 weeks</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="font-semibold">Administration</div>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                <li>Reconstitute 500 mg vial with 10 mL sterile water; dilute in 0.9% NaCl (100 mL for ≤1800 mg; 250 mL if &gt;1800 mg)</li>
                <li>Infuse IV over <strong>90 min</strong> for first 2 doses; if tolerated, subsequent infusions over <strong>60 min</strong></li>
                <li>Use in-line 0.2–1.2 µm low-protein-binding filter; do NOT push or give as bolus</li>
                <li>No routine pre-medication required; slow rate or pre-medicate (antihistamine, antipyretic, steroid) if prior infusion reaction</li>
                <li>Complete infusion within 4 h of preparation; store diluted solution at 2–8 °C, do not freeze/shake</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="font-semibold">Candidate selection</div>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                <li>Active, moderate–severe TED (CAS ≥ 4/7 typically)</li>
                <li>Proptosis, diplopia, or steroid-refractory / relapsing disease</li>
                <li>Euthyroid or near-euthyroid on antithyroid therapy</li>
              </ul>
            </div>
            <Callout tone="danger" title="Contraindications">
              <ul className="list-disc pl-5 space-y-0.5">
                <li><strong>Pregnancy</strong> — teratogenic (embryo-fetal harm shown in animals); exclude pregnancy before start</li>
                <li>Known <strong>serious hypersensitivity</strong> to teprotumumab or excipients</li>
              </ul>
            </Callout>
            <Callout tone="warning" title="Key adverse effects — monitor">
              <ul className="list-disc pl-5 space-y-0.5">
                <li><strong>Hyperglycaemia</strong> (~10%; higher in diabetes/pre-diabetes) — check HbA1c & glucose at baseline and before each infusion; optimize control before starting; escalate diabetes therapy as needed</li>
                <li><strong>Hearing impairment</strong> (~10%; may be permanent) — tinnitus, autophony, hypoacusis, sensorineural loss, patulous eustachian tube; baseline audiometry recommended and repeat during/after therapy; consider stopping if new/worsening symptoms</li>
                <li><strong>Infusion reactions</strong> — usually mild-to-moderate, most within 90 min; slow/interrupt infusion and pre-medicate on rechallenge</li>
                <li><strong>IBD flare</strong> — new or worsening ulcerative colitis / Crohn's; monitor and consider discontinuation if severe</li>
                <li>Muscle spasm, alopecia, nausea/diarrhoea, fatigue, dysgeusia, dry skin, headache, amenorrhoea/menstrual changes</li>
                <li><strong>Contraception:</strong> effective contraception in women of reproductive potential during and for <strong>6 months</strong> after last dose</li>
              </ul>
            </Callout>

          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-sm font-semibold">Hyperglycaemia monitoring plan</div>
          <p className="mt-1 text-xs text-muted-foreground">
            ~10% overall (up to ~30% with diabetes/pre-diabetes). Onset typically within 1–3 infusions; usually reversible after stopping therapy.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Baseline (before dose 1)</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                <li>FBS, HbA1c</li>
                <li>Risk screen: BMI, prior GDM, family Hx, meds (steroids)</li>
                <li>Refer to endocrine if HbA1c ≥ 6.5% or FBS ≥ 126 mg/dL</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Before every infusion</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                <li>FBS at each visit (q3wk)</li>
                <li>HbA1c every 3 months during therapy</li>
                <li>Symptom check: polyuria, polydipsia, blurred vision, weight loss</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Higher-risk subset</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                <li>Known DM / pre-diabetes → home SMBG fasting + 2-h post-meal daily</li>
                <li>Consider CGM for first 2 cycles</li>
                <li>Ensure diabetes clinician co-manages</li>
              </ul>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-left uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-2">Glycaemic status</th>
                  <th className="p-2">Target range</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-2 font-medium">On-target</td>
                  <td className="p-2">FBS 80–130 mg/dL · 2-h PPBS &lt;180 mg/dL · HbA1c &lt;7%</td>
                  <td className="p-2 text-muted-foreground">Continue teprotumumab; routine q-infusion monitoring</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Mild rise</td>
                  <td className="p-2">FBS 130–180 or PPBS 180–250 or HbA1c 7–8%</td>
                  <td className="p-2 text-muted-foreground">Lifestyle reinforcement; start/uptitrate metformin; recheck in 1–2 wk</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Moderate</td>
                  <td className="p-2">FBS 180–250 or PPBS 250–300 or HbA1c 8–9%</td>
                  <td className="p-2 text-muted-foreground">Add second oral agent (SGLT2i / DPP-4i) or basal insulin; endocrine referral; continue therapy</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-destructive">Severe / persistent</td>
                  <td className="p-2">FBS &gt;250, PPBS &gt;300, HbA1c &gt;9%, or symptomatic hyperglycaemia / DKA-HHS</td>
                  <td className="p-2 text-muted-foreground">Hold next infusion; start basal-bolus insulin; hospitalize if DKA/HHS; resume only after control (FBS &lt;180) with endocrine sign-off</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout tone="info" title="Stepwise algorithm">
            <ol className="list-decimal pl-5 space-y-1">
              <li><strong>Screen & stratify</strong> at baseline — HbA1c, FBS, DM history.</li>
              <li><strong>Optimize before dose 1</strong> — aim HbA1c &lt;8% (ideally &lt;7%) in known DM before initiating.</li>
              <li><strong>Recheck FBS at every infusion visit</strong>; HbA1c every 3 months.</li>
              <li><strong>Escalate therapy</strong> per table above — do not delay treatment for mild rises; treat aggressively for moderate–severe.</li>
              <li><strong>Hold infusion</strong> for uncontrolled hyperglycaemia (FBS &gt;250 despite therapy) or any DKA/HHS; resume once controlled.</li>
              <li><strong>Post-course</strong> — recheck HbA1c + FBS at 3 and 6 months after last dose; many revert toward baseline, but new-onset DM can persist.</li>
            </ol>
          </Callout>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-sm font-semibold">Audiology monitoring — hearing changes checklist</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Hearing impairment in ~10% (up to ~65% in prospective otologic sub-studies); includes sensorineural loss, tinnitus,
            autophony, and patulous eustachian tube. Some cases persist after therapy — screen and re-screen actively.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Baseline (before dose 1)</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                <li>Symptom review: hearing loss, tinnitus, autophony, aural fullness, ear pain</li>
                <li>Otoscopy + tympanometry</li>
                <li>Pure-tone audiometry (0.25–8 kHz) ± high-frequency (10–16 kHz)</li>
                <li>Speech-in-noise / word recognition score</li>
                <li>Document prior ototoxin exposure (aminoglycosides, cisplatin, loop diuretics, noise)</li>
                <li>Refer to ENT/audiology if any baseline abnormality</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">During therapy</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                <li>Symptom check at <strong>every infusion visit</strong> (q3wk)</li>
                <li>Repeat audiometry <strong>after infusion 4</strong> (mid-course, ~week 12)</li>
                <li>Repeat audiometry at <strong>end of course</strong> (after infusion 8)</li>
                <li>Any new/worsening symptom → prompt audiometry + ENT review before next dose</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Post-treatment</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                <li>Audiometry at <strong>3 and 6 months</strong> after last dose</li>
                <li>Persistent symptoms → 12-month audiogram + long-term ENT follow-up</li>
                <li>Consider hearing aids / rehabilitation for persistent SNHL</li>
              </ul>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-left uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-2">Finding</th>
                  <th className="p-2">Definition</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-2 font-medium">Normal / stable</td>
                  <td className="p-2">No new symptoms; audiogram unchanged vs baseline</td>
                  <td className="p-2 text-muted-foreground">Continue schedule; reassess per plan</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Subjective symptom only</td>
                  <td className="p-2">Tinnitus, autophony, aural fullness — normal audiogram</td>
                  <td className="p-2 text-muted-foreground">ENT review; continue with close monitoring; consider Eustachian tube exam</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Mild threshold shift</td>
                  <td className="p-2">≥10 dB at 2 contiguous frequencies OR ≥20 dB at any single frequency</td>
                  <td className="p-2 text-muted-foreground">Discuss risk/benefit; consider dose interval extension; ENT + re-audiometry before next dose</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-destructive">Significant SNHL</td>
                  <td className="p-2">≥15 dB shift at 2+ contiguous frequencies, or new speech-frequency loss, or ≥1-grade CTCAE worsening</td>
                  <td className="p-2 text-muted-foreground">Hold teprotumumab; urgent ENT; formal risk-benefit before resumption; often discontinue</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-destructive">Sudden SNHL</td>
                  <td className="p-2">Acute unilateral/bilateral loss ± vertigo</td>
                  <td className="p-2 text-muted-foreground">Stop drug; emergent ENT; consider high-dose steroids per SSNHL protocol</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout tone="info" title="Stepwise checklist">
            <ol className="list-decimal pl-5 space-y-1">
              <li><strong>Baseline audiogram + symptom + otoscopy</strong> for every patient before dose 1.</li>
              <li><strong>Symptom screen at every infusion</strong>; document tinnitus, hearing, autophony.</li>
              <li><strong>Mid-course audiogram</strong> after infusion 4; repeat at end of course.</li>
              <li><strong>Any new symptom</strong> → audiometry + ENT before next infusion.</li>
              <li><strong>Threshold shift</strong> per table → hold and reassess; do not push through significant SNHL.</li>
              <li><strong>Post-therapy audiograms at 3 & 6 months</strong>; longer follow-up if abnormal.</li>
              <li><strong>Counsel patient</strong> upfront: some hearing changes may be permanent — informed consent.</li>
            </ol>
          </Callout>
        </div>
      </SectionCard>




      <SectionCard
        id="storm"
        title="Thyroid storm — clinical diagnosis"
        subtitle="BWPS and JTA/Akamizu criteria; labs confirm but do not grade severity"
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
      >
        <Callout tone="danger" title="Diagnosis is clinical">
          The diagnosis of a thyroid storm is entirely clinical and based on a combination of specific symptoms, rather than standard lab results. Blood tests will confirm hyperthyroidism (high thyroid hormones and suppressed TSH), but because these numbers do not show how severe the body’s reaction is, clinicians use structured clinical tools. The two primary systems used internationally are the Burch–Wartofsky Point Scale (BWPS) and the Japan Thyroid Association (JTA) / Akamizu criteria.
        </Callout>

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="mb-1 font-semibold">1. Burch–Wartofsky Point Scale (BWPS)</h4>
          <p className="text-xs text-muted-foreground">
            Score ≥45: highly suggestive of thyroid storm. Score 25–44: impending storm. Score &lt;25: unlikely.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {bwsFields.map((f) => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <select
                  className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
                  value={bws[f.key] ?? 0}
                  onChange={(e) => setBws((s) => ({ ...s, [f.key]: +e.target.value }))}
                >
                  {f.opts.map(([v, lbl]) => (
                    <option key={String(v)} value={v as number}>{lbl as string} ({v} pts)</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-muted/40 p-3">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Burch–Wartofsky score</div>
              <div className="font-display text-2xl font-semibold">{bwsTotal}</div>
            </div>
            <Tag tone={bwsBand.tone}>{bwsBand.txt}</Tag>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-left uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-2">Category</th><th className="p-2">Finding / severity</th><th className="p-2">Points</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bwsFields.flatMap((f) =>
                  f.opts.map(([v, lbl], i) => (
                    <tr key={`${f.key}-${String(v)}`} className="border-t border-border">
                      {i === 0 ? (
                        <td className="p-2 font-medium align-top" rowSpan={f.opts.length}>{f.label}</td>
                      ) : null}
                      <td className="p-2">{lbl as string}</td>
                      <td className="p-2 font-mono">{v as number}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="mb-1 font-semibold">2. JTA / Akamizu criteria</h4>
          <p className="text-xs text-muted-foreground">
            Prerequisite: biochemical thyrotoxicosis (elevated free T₃ or free T₄). If labs are pending, a TS1 symptom
            combination is graded TS2 (suspected) until confirmed; if free T₃/T₄ are not elevated, neither grade applies.
          </p>

          <div className="mt-3 space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Free T₃ / free T₄ status</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ["confirmed", "Elevated — thyrotoxicosis confirmed"],
                ["pending", "Pending / unavailable"],
                ["notElevated", "Not elevated"],
              ] as const).map(([val, lbl]) => (
                <label
                  key={val}
                  className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm"
                >
                  <input
                    type="radio"
                    name="jta-labs"
                    checked={jta.labStatus === val}
                    onChange={() => setJta((s) => ({ ...s, labStatus: val }))}
                  />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
              <input
                type="checkbox"
                checked={jta.severeBrain}
                onChange={(e) => setJta((s) => ({ ...s, severeBrain: e.target.checked }))}
              />
              CNS manifestation (restlessness, delirium, psychosis, seizure, coma)
            </label>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
              <input
                type="checkbox"
                checked={jta.fever}
                onChange={(e) => setJta((s) => ({ ...s, fever: e.target.checked }))}
              />
              Fever ≥38 °C
            </label>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
              <input
                type="checkbox"
                checked={jta.tachycardia}
                onChange={(e) => setJta((s) => ({ ...s, tachycardia: e.target.checked }))}
              />
              Heart rate ≥130 bpm
            </label>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
              <input
                type="checkbox"
                checked={jta.heartFailure}
                onChange={(e) => setJta((s) => ({ ...s, heartFailure: e.target.checked }))}
              />
              Heart failure (pulmonary oedema, Killip ≥III, NYHA IV)
            </label>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
              <input
                type="checkbox"
                checked={jta.giHep}
                onChange={(e) => setJta((s) => ({ ...s, giHep: e.target.checked }))}
              />
              GI / hepatic (nausea, vomiting, diarrhoea, bilirubin &gt;3 mg/dL)
            </label>
          </div>

          <div className="mt-3 rounded-md border border-border bg-muted/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase text-muted-foreground">JTA interpretation</div>
                <div className="font-display text-lg font-semibold">{jtaEval.label}</div>
              </div>
              <Tag tone={jtaEval.tone}>
                {jtaEval.verdict === "notMet" ? "Not met" : jtaEval.verdict === "uncertain" ? "Uncertain" : jtaEval.verdict}
              </Tag>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Major features: {jtaEval.majorCount} / 4 · Combination: {jtaEval.combination}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {jtaEval.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <Callout tone="danger" title="Definite thyroid storm (TS1)">
              Thyrotoxicosis + (CNS manifestation + ≥1 major feature) OR ≥3 major features (fever, tachycardia ≥130, heart failure, GI/hepatic).
            </Callout>
            <Callout tone="warning" title="Suspected thyroid storm (TS2)">
              Thyrotoxicosis + 2 major features (or CNS alone), OR a TS1 combination while free T₃/T₄ remain pending.
            </Callout>
          </div>
        </div>

        <Callout tone="danger" title="Storm treatment bundle">
          1) PTU 500–1000 mg load then 250 mg q4h (or MMI 20 mg q4h). 2) SSKI ≥1 h AFTER ATD.
          3) Hydrocortisone 100 mg IV q8h. 4) Propranolol 60–80 mg PO q4h (or esmolol infusion).
          5) Cooling, IV fluids, treat precipitant (infection, DKA, MI, iodine load, surgery).
          6) Consider cholestyramine 4 g QDS, plasmapheresis for refractory cases.
        </Callout>
      </SectionCard>

      <SectionCard
        id="myxedema"
        title="Myxedema coma — Popoveniuc diagnostic score"
        subtitle="Hypothyroid emergency: thermoregulatory, CNS, GI, CV, metabolic & precipitant"
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
      >
        <Callout tone="danger" title="Diagnosis is clinical">
          Myxedema coma is a rare, life-threatening decompensation of severe hypothyroidism. The Popoveniuc scoring system helps stratify risk using clinical and laboratory domains. Score &lt;25: unlikely. 25–59: supportive. ≥60: diagnostic.
        </Callout>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {/* Thermoregulatory */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h5 className="mb-2 text-sm font-semibold">🌡️ Thermoregulatory</h5>
            <Label className="text-xs">Temperature category</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
              value={popo.temp}
              onChange={(e) => setPopo((s) => ({ ...s, temp: +e.target.value }))}
            >
              <option value={0}>{">35 °C (0 pts)"}</option>
              <option value={10}>32–35 °C (10 pts)</option>
              <option value={20}>{"<32 °C (20 pts)"}</option>
            </select>
          </div>

          {/* CNS */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h5 className="mb-2 text-sm font-semibold">🧠 CNS effects</h5>
            <Label className="text-xs">Mental status</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
              value={popo.cns}
              onChange={(e) => setPopo((s) => ({ ...s, cns: +e.target.value }))}
            >
              <option value={0}>Absent (0 pts)</option>
              <option value={10}>Somnolent / lethargic (10 pts)</option>
              <option value={15}>Obtunded (15 pts)</option>
              <option value={20}>Stupor (20 pts)</option>
              <option value={30}>Coma / seizures (30 pts)</option>
            </select>
          </div>

          {/* GI */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h5 className="mb-2 text-sm font-semibold">🫃 Gastrointestinal</h5>
            <Label className="text-xs">GI findings</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
              value={popo.gi}
              onChange={(e) => setPopo((s) => ({ ...s, gi: +e.target.value }))}
            >
              <option value={0}>None (0 pts)</option>
              <option value={5}>Anorexia / abdo pain / constipation (5 pts)</option>
              <option value={15}>Decreased intestinal motility (15 pts)</option>
              <option value={20}>Paralytic ileus (20 pts)</option>
            </select>
          </div>

          {/* Precipitant */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h5 className="mb-2 text-sm font-semibold">⚡ Precipitating event</h5>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
              <input
                type="checkbox"
                checked={popo.precipitant}
                onChange={(e) => setPopo((s) => ({ ...s, precipitant: e.target.checked }))}
              />
              Present (infection, cold, drugs, trauma, surgery, MI) — 10 pts
            </label>
          </div>

          {/* Cardiovascular */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h5 className="mb-2 text-sm font-semibold">❤️ Cardiovascular</h5>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Bradycardia</Label>
                <select
                  className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
                  value={popo.brady}
                  onChange={(e) => setPopo((s) => ({ ...s, brady: +e.target.value }))}
                >
                  <option value={0}>None (0 pts)</option>
                  <option value={10}>50–59 bpm (10 pts)</option>
                  <option value={20}>40–49 bpm (20 pts)</option>
                  <option value={30}>{"<40 bpm (30 pts)"}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.ecg} onChange={(e) => setPopo((s) => ({ ...s, ecg: e.target.checked }))} />
                ECG changes (QT prolongation, low voltage, BBB, heart block) — 10 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.pericardial} onChange={(e) => setPopo((s) => ({ ...s, pericardial: e.target.checked }))} />
                Pericardial effusion — 10 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.pleural} onChange={(e) => setPopo((s) => ({ ...s, pleural: e.target.checked }))} />
                Pleural effusion — 10 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.pulmEdema} onChange={(e) => setPopo((s) => ({ ...s, pulmEdema: e.target.checked }))} />
                Pulmonary edema — 15 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.cardiomegaly} onChange={(e) => setPopo((s) => ({ ...s, cardiomegaly: e.target.checked }))} />
                Cardiomegaly — 15 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.hypotension} onChange={(e) => setPopo((s) => ({ ...s, hypotension: e.target.checked }))} />
                Hypotension — 20 pts
              </label>
            </div>
          </div>

          {/* Metabolic */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h5 className="mb-2 text-sm font-semibold">🧪 Metabolic</h5>
            <div className="space-y-2">
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.hyponatremia} onChange={(e) => setPopo((s) => ({ ...s, hyponatremia: e.target.checked }))} />
                Hyponatremia — 10 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.hypoglycemia} onChange={(e) => setPopo((s) => ({ ...s, hypoglycemia: e.target.checked }))} />
                Hypoglycemia — 10 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.hypoxemia} onChange={(e) => setPopo((s) => ({ ...s, hypoxemia: e.target.checked }))} />
                Hypoxemia — 10 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.hypercarbia} onChange={(e) => setPopo((s) => ({ ...s, hypercarbia: e.target.checked }))} />
                Hypercarbia — 10 pts
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                <input type="checkbox" checked={popo.decreasedGfr} onChange={(e) => setPopo((s) => ({ ...s, decreasedGfr: e.target.checked }))} />
                Decreased GFR — 10 pts
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border-2 border-border bg-muted/40 p-4">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Popoveniuc score</div>
            <div className="font-display text-3xl font-semibold">{popoTotal}</div>
          </div>
          <Tag tone={popoBand.tone}>{popoBand.txt}</Tag>
        </div>

        <Callout tone="danger" title="Myxedema coma management">
          1) IV levothyroxine 200–500 µg load, then 50–100 µg daily. 2) IV hydrocortisone 100 mg q8h (cover adrenal insufficiency). 3) Passive rewarming. 4) Treat precipitant. 5) Ventilatory support if needed. 6) IV fluids cautiously (risk of fluid overload).
        </Callout>
      </SectionCard>

      <SectionCard
        id="nodule"
        title="Thyroid nodule & cancer workup"
        subtitle="TSH → ultrasound → FNA using ACR TI-RADS / Bethesda"
        icon={<Target className="h-5 w-5" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">TI-RADS</th><th className="p-2">Points</th><th className="p-2">FNA threshold</th></tr>
            </thead>
            <tbody>
              {[
                ["TR1 Benign", "0", "No FNA"],
                ["TR2 Not suspicious", "2", "No FNA"],
                ["TR3 Mildly suspicious", "3", "FNA if ≥2.5 cm; follow ≥1.5 cm"],
                ["TR4 Moderately suspicious", "4–6", "FNA if ≥1.5 cm; follow ≥1.0 cm"],
                ["TR5 Highly suspicious", "≥7", "FNA if ≥1.0 cm; follow ≥0.5 cm"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-t border-border">
                  <td className="p-2 font-medium">{a}</td>
                  <td className="p-2 font-mono">{b}</td>
                  <td className="p-2 text-muted-foreground">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <h4 className="mb-2 font-semibold">Bethesda cytology & risk of malignancy</h4>
          <div className="grid gap-1">
            <KeyRow k="I  Non-diagnostic" v="5–10% · repeat FNA under US" mono />
            <KeyRow k="II  Benign" v="0–3% · clinical follow-up" mono />
            <KeyRow k="III  AUS/FLUS" v="10–30% · repeat FNA or molecular" mono />
            <KeyRow k="IV  Follicular neoplasm" v="25–40% · lobectomy or molecular" mono />
            <KeyRow k="V  Suspicious for malignancy" v="50–75% · lobectomy / near-total" mono />
            <KeyRow k="VI  Malignant" v="97–99% · total thyroidectomy" mono />
          </div>
        </div>
        <Callout tone="info" title="Red flags for malignancy">
          Rapid growth, fixation, hoarseness, cervical lymphadenopathy, prior head/neck radiation,
          family history (MEN2, FMTC, PTC), age &lt;20 or &gt;60, male sex.
        </Callout>
      </SectionCard>

      <SectionCard
        id="pregnancy"
        title="Thyroid disease in pregnancy"
        subtitle="Trimester-specific TSH; PTU in T1, MMI in T2–T3"
        icon={<Stethoscope className="h-5 w-5" />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">Hypothyroidism</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              <li>Target TSH &lt;2.5 mIU/L (or trimester-specific).</li>
              <li>Increase LT4 by ~30% on positive test (2 extra tablets/week).</li>
              <li>TSH q4 wk until 20 wk, then once at 26–32 wk.</li>
              <li>Return to pre-pregnancy dose immediately postpartum.</li>
            </ul>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="font-semibold">Hyperthyroidism</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              <li>PTU in T1 (lower teratogenicity); switch to MMI at 16 wk.</li>
              <li>Target free T4 at upper limit of normal, lowest ATD dose.</li>
              <li>Check TRAb at 20–24 wk — high titres → fetal monitoring.</li>
              <li>Avoid RAI. Beta-blockers short-term only (IUGR risk).</li>
            </ul>
          </div>
        </div>
        <Callout tone="warning" title="Postpartum thyroiditis">
          Occurs in 5–10% within 12 months of delivery. Classic triphasic: transient thyrotoxicosis → hypothyroidism → recovery.
          β-blockers for symptomatic thyrotoxic phase; LT4 for symptomatic hypothyroid phase (attempt withdrawal at 6–12 mo).
        </Callout>
      </SectionCard>
    </div>
  );
}
