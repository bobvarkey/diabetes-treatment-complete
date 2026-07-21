import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Eye, FlaskConical, Pill, Stethoscope, Target } from "lucide-react";
import { SectionCard, KeyRow, Pill as Tag, Callout } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import teprotumumabTed from "@/assets/teprotumumab-ted.png.asset.json";


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
              <div className="font-semibold">Dosing</div>
              <p className="mt-1 text-xs text-muted-foreground">
                10 mg/kg IV × 1, then 20 mg/kg IV every 3 weeks × 7 more infusions (8 total over 21 weeks).
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="font-semibold">Candidate selection</div>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                <li>Active, moderate–severe TED (CAS ≥ 4/7 typically)</li>
                <li>Proptosis, diplopia, or steroid-refractory / relapsing disease</li>
                <li>Euthyroid or near-euthyroid on antithyroid therapy</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="font-semibold">Adverse effects / cautions</div>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                <li>Hyperglycaemia — monitor closely in diabetes; optimize glycaemic control first</li>
                <li>Hearing impairment (tinnitus, sensorineural loss) — baseline & follow-up audiometry</li>
                <li>Infusion reactions, muscle spasm, alopecia, nausea, IBD flare</li>
                <li>Pregnancy: contraindicated (teratogenic); effective contraception during and 6 months after</li>
              </ul>
            </div>
          </div>
        </div>
      </SectionCard>


      <SectionCard
        id="storm"
        title="Thyroid storm — Burch–Wartofsky score"
        subtitle="Clinical diagnosis; do not wait for TFTs to treat"
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
      >
        <div className="grid gap-3 md:grid-cols-2">
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
        <Callout tone="danger" title="Storm treatment bundle">
          1) PTU 500–1000 mg load then 250 mg q4h (or MMI 20 mg q4h). 2) SSKI ≥1 h AFTER ATD.
          3) Hydrocortisone 100 mg IV q8h. 4) Propranolol 60–80 mg PO q4h (or esmolol infusion).
          5) Cooling, IV fluids, treat precipitant (infection, DKA, MI, iodine load, surgery).
          6) Consider cholestyramine 4 g QDS, plasmapheresis for refractory cases.
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
