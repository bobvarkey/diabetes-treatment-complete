import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Callout, KeyRow, Pill } from "./shared";

type Tone = "success" | "warning" | "danger" | "info" | "primary" | "default";

interface Flags {
  priorHipOrVertebral: boolean;
  multipleFractures: boolean;
  recentFracture: boolean;
  glucocorticoid: boolean;
  fallsHighRisk: boolean;
}

const FLAG_LABELS: { key: keyof Flags; label: string }[] = [
  { key: "priorHipOrVertebral", label: "Prior hip or vertebral fragility fracture" },
  { key: "multipleFractures", label: "More than one fragility fracture" },
  { key: "recentFracture", label: "Fracture within the last 12–24 months (imminent risk)" },
  { key: "glucocorticoid", label: "Ongoing glucocorticoids ≥ 7.5 mg prednisolone-equivalent/day" },
  { key: "fallsHighRisk", label: "High falls risk / frailty" },
];

interface FraxDecision {
  tier: "very-high" | "high" | "intermediate" | "low" | "incomplete";
  tag: string;
  tone: Tone;
  summary: string;
  next: string[];
  drivers: string[];
}

export function decideFrax(opts: {
  fraxMajor: number;
  fraxHip: number;
  tScore: number;
  flags: Flags;
}): FraxDecision {
  const { fraxMajor, fraxHip, tScore, flags } = opts;
  const drivers: string[] = [];
  const hasFrax = isFinite(fraxMajor) || isFinite(fraxHip);
  const hasT = isFinite(tScore);

  if (!hasFrax && !hasT && !Object.values(flags).some(Boolean)) {
    return {
      tier: "incomplete",
      tag: "Incomplete",
      tone: "default",
      summary: "Enter a FRAX 10-year probability, a T-score, or a clinical risk flag to generate a decision.",
      next: [],
      drivers: [],
    };
  }

  // Very high risk
  const veryHigh =
    flags.multipleFractures ||
    flags.recentFracture ||
    (hasT && tScore <= -3.0) ||
    (isFinite(fraxMajor) && fraxMajor >= 30) ||
    (isFinite(fraxHip) && fraxHip >= 4.5) ||
    (flags.priorHipOrVertebral && hasT && tScore <= -2.5);

  if (flags.multipleFractures) drivers.push("Multiple fragility fractures");
  if (flags.recentFracture) drivers.push("Fracture in the last 12–24 months — imminent (near-term) risk");
  if (hasT && tScore <= -3.0) drivers.push(`T-score ${tScore.toFixed(1)} ≤ −3.0`);
  if (isFinite(fraxMajor) && fraxMajor >= 30) drivers.push(`FRAX major osteoporotic ${fraxMajor}% ≥ 30%`);
  if (isFinite(fraxHip) && fraxHip >= 4.5) drivers.push(`FRAX hip ${fraxHip}% ≥ 4.5%`);

  if (veryHigh) {
    return {
      tier: "very-high",
      tag: "Very high risk — treat now",
      tone: "danger",
      summary:
        "Meets very-high-risk criteria. Guidelines favour starting with an anabolic agent (teriparatide, abaloparatide or romosozumab) and following with an antiresorptive, rather than starting with a bisphosphonate.",
      drivers,
      next: [
        "Start therapy now — do not defer for repeat DXA.",
        "Preferred: anabolic first (teriparatide/abaloparatide 18–24 months, or romosozumab 12 months) then mandatory antiresorptive follow-on.",
        "Romosozumab is contraindicated after MI or stroke within 12 months — screen cardiovascular history first.",
        "Correct 25-OH-vitamin D (≥ 30 ng/mL) and calcium intake 1000–1200 mg/day before and during therapy.",
        "Baseline labs for secondary causes: Ca, PO₄, creatinine/eGFR, ALP, 25-OH-D, PTH, TSH, coeliac and myeloma screen if indicated.",
        "Dental review before denosumab/zoledronate; falls-prevention referral.",
        "Repeat DXA at 12–24 months; consider CTX/P1NP at 3–6 months for adherence and response.",
      ],
    };
  }

  // High risk / treatment threshold
  const high =
    flags.priorHipOrVertebral ||
    (hasT && tScore <= -2.5) ||
    (isFinite(fraxMajor) && fraxMajor >= 20) ||
    (isFinite(fraxHip) && fraxHip >= 3) ||
    flags.glucocorticoid;

  if (flags.priorHipOrVertebral) drivers.push("Prior hip or vertebral fragility fracture");
  if (hasT && tScore <= -2.5 && tScore > -3.0) drivers.push(`T-score ${tScore.toFixed(1)} ≤ −2.5 (densitometric osteoporosis)`);
  if (isFinite(fraxMajor) && fraxMajor >= 20 && fraxMajor < 30) drivers.push(`FRAX major osteoporotic ${fraxMajor}% ≥ 20%`);
  if (isFinite(fraxHip) && fraxHip >= 3 && fraxHip < 4.5) drivers.push(`FRAX hip ${fraxHip}% ≥ 3%`);
  if (flags.glucocorticoid) drivers.push("Glucocorticoid exposure ≥ 7.5 mg/day");

  if (high) {
    return {
      tier: "high",
      tag: "High risk — treatment indicated",
      tone: "danger",
      summary:
        "At or above the intervention threshold. Start pharmacotherapy; an oral or IV bisphosphonate is usual first line, with denosumab if renal function or adherence favours it.",
      drivers,
      next: [
        "First line: alendronate 70 mg weekly or risedronate 35 mg weekly (oral), or zoledronate 5 mg IV yearly.",
        "Denosumab 60 mg SC 6-monthly if CrCl < 35 mL/min, oral intolerance, or adherence concerns — never stop without transition planning.",
        "Check CrCl (zoledronate needs CrCl ≥ 35 mL/min), correct hypocalcaemia and vitamin D deficiency first.",
        "Reassess with DXA in 2 years (1–2 years if glucocorticoids); review adherence at 3 and 12 months.",
        "Screen for secondary causes before committing to long-term therapy.",
      ],
    };
  }

  // Intermediate
  const intermediate =
    (hasT && tScore <= -1.0) ||
    (isFinite(fraxMajor) && fraxMajor >= 10) ||
    (isFinite(fraxHip) && fraxHip >= 1) ||
    flags.fallsHighRisk;

  if (intermediate) {
    if (hasT && tScore <= -1.0) drivers.push(`T-score ${tScore.toFixed(1)} in osteopenic range`);
    if (isFinite(fraxMajor) && fraxMajor >= 10) drivers.push(`FRAX major osteoporotic ${fraxMajor}% (10–19%)`);
    if (flags.fallsHighRisk) drivers.push("High falls risk / frailty");
    return {
      tier: "intermediate",
      tag: "Intermediate risk — refine assessment",
      tone: "warning",
      summary:
        "Below the automatic treatment threshold but not low risk. Refine the estimate before deciding — a femoral-neck BMD-adjusted FRAX, vertebral imaging or TBS often moves these patients across the threshold.",
      drivers,
      next: [
        "Recalculate FRAX with femoral-neck BMD if it was estimated without it.",
        "Vertebral fracture assessment (VFA/lateral spine X-ray) — an occult vertebral fracture reclassifies to high risk.",
        "Consider trabecular bone score adjustment or opportunistic L1 CT Hounsfield units if a recent CT exists.",
        "Optimise calcium, vitamin D, protein, resistance/balance exercise, smoking and alcohol.",
        "Repeat DXA in 2–3 years, sooner if new risk factors or steroids start.",
      ],
    };
  }

  return {
    tier: "low",
    tag: "Low risk — lifestyle & re-screen",
    tone: "success",
    summary: "Below intervention thresholds. Pharmacotherapy is not indicated on current inputs.",
    drivers: drivers.length ? drivers : ["No threshold-crossing risk factors entered"],
    next: [
      "Calcium 1000–1200 mg/day (diet first) and 25-OH-vitamin D ≥ 30 ng/mL.",
      "Weight-bearing and resistance exercise, smoking cessation, alcohol < 3 units/day.",
      "Falls-risk review annually in older adults.",
      "Repeat risk assessment / DXA in 3–5 years, or earlier with new fracture, steroids or height loss.",
    ],
  };
}

export default function FraxDecisionFlow() {
  const [fraxMajor, setFraxMajor] = useState("");
  const [fraxHip, setFraxHip] = useState("");
  const [tScore, setTScore] = useState("");
  const [flags, setFlags] = useState<Flags>({
    priorHipOrVertebral: false,
    multipleFractures: false,
    recentFracture: false,
    glucocorticoid: false,
    fallsHighRisk: false,
  });

  const decision = useMemo(
    () =>
      decideFrax({
        fraxMajor: parseFloat(fraxMajor),
        fraxHip: parseFloat(fraxHip),
        tScore: parseFloat(tScore),
        flags,
      }),
    [fraxMajor, fraxHip, tScore, flags],
  );

  const toggle = (k: keyof Flags) => setFlags((p) => ({ ...p, [k]: !p[k] }));
  const calloutTone = decision.tone === "success" ? "success" : decision.tone === "warning" ? "warning" : decision.tone === "danger" ? "danger" : "info";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="frax-major">FRAX 10-yr major osteoporotic (%)</Label>
          <Input id="frax-major" inputMode="decimal" value={fraxMajor} onChange={(e) => setFraxMajor(e.target.value)} placeholder="e.g. 18" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="frax-hip">FRAX 10-yr hip (%)</Label>
          <Input id="frax-hip" inputMode="decimal" value={fraxHip} onChange={(e) => setFraxHip(e.target.value)} placeholder="e.g. 2.4" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="frax-t">Lowest T-score (femoral neck / total hip / spine)</Label>
          <Input id="frax-t" inputMode="decimal" value={tScore} onChange={(e) => setTScore(e.target.value)} placeholder="e.g. -2.7" />
        </div>
      </div>

      <div className="rounded-md border border-border p-3">
        <div className="mb-2 text-sm font-semibold">Clinical risk flags</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {FLAG_LABELS.map((f) => (
            <label key={f.key} className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 text-sm hover:bg-muted/50">
              <Checkbox checked={flags[f.key]} onCheckedChange={() => toggle(f.key)} aria-label={f.label} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={decision.tone}>{decision.tag}</Pill>
        {isFinite(parseFloat(fraxMajor)) && <Pill tone={parseFloat(fraxMajor) >= 20 ? "danger" : "default"}>Major {fraxMajor}% · threshold 20%</Pill>}
        {isFinite(parseFloat(fraxHip)) && <Pill tone={parseFloat(fraxHip) >= 3 ? "danger" : "default"}>Hip {fraxHip}% · threshold 3%</Pill>}
        {isFinite(parseFloat(tScore)) && <Pill tone={parseFloat(tScore) <= -2.5 ? "danger" : parseFloat(tScore) <= -1 ? "warning" : "success"}>T {parseFloat(tScore).toFixed(1)}</Pill>}
      </div>

      <Callout tone={calloutTone} title={decision.tag}>
        {decision.summary}
      </Callout>

      {decision.drivers.length > 0 && (
        <div>
          <div className="mb-1 text-sm font-semibold">Why this tier</div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {decision.drivers.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
      )}

      {decision.next.length > 0 && (
        <div>
          <div className="mb-1 text-sm font-semibold">Next steps</div>
          <div className="space-y-1 text-sm">
            {decision.next.map((n, i) => <KeyRow key={n} k={`Step ${i + 1}`} v={n} />)}
          </div>
        </div>
      )}

      <Callout tone="info" title="Threshold note">
        US NOF/Bone Health &amp; Osteoporosis Foundation thresholds are used (FRAX major ≥ 20%, hip ≥ 3%). Several
        countries use age-dependent intervention thresholds (NOGG/IOF-ESCEO) — apply the local threshold where one
        exists. FRAX underestimates risk with recent fracture, high-dose steroids, diabetes and frequent falls.
      </Callout>
    </div>
  );
}
