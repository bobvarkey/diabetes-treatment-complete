import * as React from "react";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ShieldAlert,
  Bone,
  FlaskConical,
  GitBranch,
  Activity,
  Syringe,
  ArrowRight,
  Layers,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Compass,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard, Callout, Pill } from "./shared";
import { stratify, discordanceGuidance, type FractureType as LogicFractureType } from "./osteoporosisLogic";
import { bridgingWindow, zoledronatePlan, crClSafety, type Duration } from "./denosumabLogic";

/**
 * Fragility Fracture Osteoporosis Navigator (v1.0.0) — web port of the
 * single-screen iOS spec. Educational, non-directive, manual-entry only,
 * offline-first. The intake auto-routes the user to the most relevant of
 * ten learning modules.
 */

// ---------- Module catalogue ----------

interface ModuleItem {
  id: string;
  title: string;
  purpose: string;
  primaryCTA: string;
  learn: string[];
  rules: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const MODULES: ModuleItem[] = [
  {
    id: "module-fragility-fracture",
    title: "Osteoporosis after Fragility Fracture",
    purpose: "Risk stratification concepts and first-line drug classes discussed after a low-energy fracture.",
    primaryCTA: "Review first-line options",
    learn: [
      "How fracture type, index-site T-score and FRAX inputs combine into a risk band.",
      "Why the femoral-neck (or total-hip) T-score is the FRAX index site.",
      "Where common first-line agents sit in guideline pathways.",
    ],
    rules: [
      "Use femoral-neck or total-hip T-score for FRAX calibration.",
      "Do not substitute the distal-radius or fracture-site T-score into FRAX.",
      "If spine is much lower than hip, do not switch the FRAX input — up-adjust the reported risk category.",
    ],
    icon: Bone,
  },
  {
    id: "module-secondary-causes",
    title: "Secondary Causes & Baseline Labs",
    purpose: "Reversible contributors to low bone mass and the baseline panel typically discussed before therapy.",
    primaryCTA: "Show baseline panel",
    learn: [
      "Categories of secondary causes: endocrine, GI/malabsorptive, drug-induced, haematologic, renal/hepatic.",
      "A generic baseline panel (CBC, CMP, 25-OH-D, PTH, TSH, urine Ca/Cr, HbA1c).",
      "Why T2DM patients may fracture at higher T-scores than the general population.",
    ],
    rules: [
      "Baseline labs are typically shown whenever therapy is under consideration.",
      "Include HbA1c when T2DM screening is relevant.",
      "Add targeted labs only when clinically indicated.",
    ],
    icon: FlaskConical,
  },
  {
    id: "module-discordance",
    title: "Spine–Hip Discordance",
    purpose: "Interpreting discordant T-scores without changing the FRAX input.",
    primaryCTA: "Apply discordance rule",
    learn: [
      "IOF/ESCEO rule of thumb: if spine is ≥ 1 SD lower than hip, keep the hip value in FRAX and up-adjust the reported risk one step.",
      "Why substituting the lowest or fracture-site T-score changes FRAX calibration.",
      "Why peripheral (e.g. distal-radius) DXA is not the FRAX index site.",
    ],
    rules: [
      "Keep the hip T-score in FRAX.",
      "Do not use the maximum T-score.",
      "Do not use the fracture-site T-score as the FRAX input.",
    ],
    icon: Layers,
  },
  {
    id: "module-giop",
    title: "GIOP Mini-App",
    purpose: "ACR 2022 glucocorticoid-induced osteoporosis pathway concepts.",
    primaryCTA: "Review GIOP pathway",
    learn: [
      "Universal measures for anyone on systemic steroids (calcium, vitamin D, exercise, fall reduction).",
      "How steroid dose and duration feed into fracture-risk estimation.",
      "Which drug classes appear in the guideline as options.",
    ],
    rules: [
      "If systemic steroids continue and risk is not clearly low, bone protection is typically considered early.",
      "Oral bisphosphonate is often the first-line option in the guideline.",
      "IV bisphosphonate, denosumab or teriparatide are alternatives when oral therapy is unsuitable.",
    ],
    icon: ClipboardList,
  },
  {
    id: "module-steroid-alert",
    title: "Steroid Vertebral Fracture Alert",
    purpose: "Recognising possible occult vertebral fracture in chronic steroid users.",
    primaryCTA: "Show urgent-action concepts",
    learn: [
      "Typical clues: new severe thoracolumbar pain, height loss, codfish-vertebra morphology on imaging.",
      "Red-flag features that warrant urgent clinician review (neurological deficit, systemic symptoms).",
      "Why imaging and specialist input are needed before any treatment decision.",
    ],
    rules: [
      "New severe thoracolumbar pain in a chronic-steroid user is treated as a possible vertebral fracture until proven otherwise.",
      "Urgent MRI and lab review are typically discussed.",
      "Treatment is not delayed in confirmed high-risk cases.",
    ],
    icon: AlertTriangle,
  },
  {
    id: "module-denosumab-transition",
    title: "Denosumab Stop / Transition",
    purpose: "Bridging concepts to reduce rebound vertebral-fracture risk after denosumab.",
    primaryCTA: "Review bridge concept",
    learn: [
      "Rebound bone loss and multiple-vertebral-fracture risk described after discontinuation.",
      "General timing concept: a follow-on antiresorptive around the time the next scheduled dose would have been due.",
      "Why transition planning belongs with a clinician who can review renal function, calcium, vitamin D and dental status.",
    ],
    rules: [
      "Denosumab is not stopped without a bisphosphonate bridge.",
      "Zoledronate is often preferred if renal function permits.",
      "Rebound vertebral-fracture risk is discussed in advance.",
    ],
    icon: ShieldAlert,
  },
  {
    id: "module-teriparatide-followon",
    title: "After Teriparatide → Antiresorptive",
    purpose: "Why the anabolic-to-antiresorptive handover matters and how gaps are avoided.",
    primaryCTA: "Review follow-on concept",
    learn: [
      "Rapid BMD loss described when no antiresorptive follows teriparatide (e.g. DATA-Switch).",
      "General concept: complete the anabolic course, then transition to an antiresorptive under clinician guidance.",
      "Monitoring points typically discussed (BMD, calcium, vitamin D).",
    ],
    rules: [
      "An antiresorptive is typically started within about one month of the last teriparatide dose.",
      "A treatment gap after the anabolic phase is generally avoided.",
    ],
    icon: ArrowRight,
  },
  {
    id: "module-combination",
    title: "Teriparatide + Denosumab",
    purpose: "DATA / DATA-Switch rationale for concurrent anabolic and antiresorptive therapy in very-high-risk scenarios.",
    primaryCTA: "Review overlap concept",
    learn: [
      "Why combining an anabolic with a potent antiresorptive was studied for maximal BMD gain.",
      "Both agents run on their own standard schedules — never mixed in a single injection.",
      "Bone-turnover markers are not required to start therapy and have limited predictive value at baseline.",
    ],
    rules: [
      "Used only for very-high-risk disease where rapid maximal BMD gain is desired.",
      "All therapy is not stopped after the anabolic phase.",
    ],
    icon: Syringe,
  },
  {
    id: "module-sequencing",
    title: "Sequential Therapy",
    purpose: "Long-term anabolic ↔ antiresorptive planning concepts.",
    primaryCTA: "Open decision-tree concept",
    learn: [
      "General principle: anabolic first for very-high risk, followed by an antiresorptive to preserve gains.",
      "Why gaps between agents can erode BMD improvements.",
      "How guideline-based reassessment points inform next-step discussions with a clinician.",
    ],
    rules: [
      "Anabolic therapy is usually followed by antiresorptive therapy.",
      "Long-term sequencing aims to preserve gains and avoid gaps.",
    ],
    icon: GitBranch,
  },
  {
    id: "module-monitoring-holiday",
    title: "Adjuncts, Monitoring & Holidays",
    purpose: "Supportive care, DXA cadence, bone-turnover-marker cadence, and holiday-eligibility concepts.",
    primaryCTA: "Review maintenance concepts",
    learn: [
      "Typical adjunct targets (calcium 1000–1200 mg/d, 25-OH-D ≥ 30 ng/mL).",
      "Drug-holiday concept applies to bisphosphonates only; denosumab and anabolic agents are handled differently.",
      "Monitoring themes: DXA cadence, adherence review, periodic risk reassessment.",
    ],
    rules: [
      "Oral bisphosphonate holidays are considered after adequate duration and low residual risk.",
      "Denosumab has no holiday; a bisphosphonate transition is discussed instead.",
    ],
    icon: Activity,
  },
];

const MODULE_MAP = Object.fromEntries(MODULES.map((m) => [m.id, m]));

// ---------- Intake model ----------

type FractureType = "none" | "hip" | "vertebral" | "distal-radius" | "humerus" | "other";
type CurrentDrug = "none" | "oral-bp" | "iv-zoledronate" | "denosumab" | "teriparatide" | "romosozumab";

interface PatientInput {
  age: string;
  sex: "" | "female" | "male";
  postmenopausal: boolean;
  fragilityFractureType: FractureType;
  femoralNeckTScore: string;
  totalHipTScore: string;
  lumbarSpineTScore: string;
  fraxMajorPercent: string;
  fraxHipPercent: string;
  prednisoneEquivalentMgPerDay: string;
  steroidDurationMonths: string;
  currentDrug: CurrentDrug;
  lastDenosumabDate: string;
  denosumabDurationYears: string;
  lastTeriparatideDate: string;
  crcl: string;
  l1Hu: string;
  spinePainRedFlag: boolean;
  cordCompressionSigns: boolean;
  secondaryCauseFlags: string[];
}

const INITIAL: PatientInput = {
  age: "",
  sex: "",
  postmenopausal: false,
  fragilityFractureType: "none",
  femoralNeckTScore: "",
  totalHipTScore: "",
  lumbarSpineTScore: "",
  fraxMajorPercent: "",
  fraxHipPercent: "",
  prednisoneEquivalentMgPerDay: "",
  steroidDurationMonths: "",
  currentDrug: "none",
  lastDenosumabDate: "",
  denosumabDurationYears: "",
  lastTeriparatideDate: "",
  crcl: "",
  l1Hu: "",
  spinePainRedFlag: false,
  cordCompressionSigns: false,
  secondaryCauseFlags: [],
};

const SECONDARY_CAUSES = [
  "Type 2 diabetes",
  "Type 1 diabetes",
  "Chronic glucocorticoids",
  "Hypogonadism / early menopause",
  "Hyperthyroidism / over-replacement",
  "Primary hyperparathyroidism",
  "CKD",
  "Chronic liver disease",
  "Malabsorption / IBD / bariatric",
  "Multiple myeloma / MGUS",
  "Aromatase inhibitor / ADT",
  "Chronic PPI / anticonvulsants / heparin",
  "Alcohol > 3 U/d or smoker",
  "Rheumatoid arthritis",
];

// ---------- Auto-router ----------

interface RouteMatch {
  routeTo: string;
  reason: string;
  priority: number;
}

function num(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

function autoRoute(p: PatientInput): { primary: RouteMatch | null; related: RouteMatch[] } {
  const matches: RouteMatch[] = [];
  const steroidDose = num(p.prednisoneEquivalentMgPerDay);
  const steroidDur = num(p.steroidDurationMonths);
  const fn = num(p.femoralNeckTScore);
  const th = num(p.totalHipTScore);
  const ls = num(p.lumbarSpineTScore);
  const fm = num(p.fraxMajorPercent);
  const fh = num(p.fraxHipPercent);
  const hasSteroid = !isNaN(steroidDose) && !isNaN(steroidDur);

  if (hasSteroid && p.spinePainRedFlag) {
    matches.push({
      priority: 1,
      routeTo: "module-steroid-alert",
      reason: "Chronic steroid exposure with new severe back pain is a red-flag pattern for possible vertebral fracture.",
    });
  }
  if (hasSteroid) {
    matches.push({
      priority: 2,
      routeTo: "module-giop",
      reason: "Systemic steroid exposure is typically routed through the GIOP pathway early.",
    });
  }
  if (p.currentDrug === "denosumab" || p.lastDenosumabDate) {
    matches.push({
      priority: 3,
      routeTo: "module-denosumab-transition",
      reason: "Denosumab exposure requires bridging planning if stopped.",
    });
  }
  if (p.currentDrug === "teriparatide" || p.lastTeriparatideDate) {
    matches.push({
      priority: 4,
      routeTo: "module-teriparatide-followon",
      reason: "Anabolic therapy is followed promptly by an antiresorptive.",
    });
  }
  if (!isNaN(fn) && !isNaN(ls) && ls < fn - 1.0) {
    matches.push({
      priority: 5,
      routeTo: "module-discordance",
      reason: "Spine T-score is ≥ 1 SD lower than femoral-neck — discordance rule applies.",
    });
  }
  if (p.secondaryCauseFlags.length > 0) {
    matches.push({
      priority: 6,
      routeTo: "module-secondary-causes",
      reason: "Secondary causes are typically screened before therapy.",
    });
  }
  if (
    p.fragilityFractureType !== "none" ||
    !isNaN(fn) ||
    !isNaN(th) ||
    !isNaN(fm) ||
    !isNaN(fh)
  ) {
    matches.push({
      priority: 7,
      routeTo: "module-fragility-fracture",
      reason: "A fragility fracture or elevated risk input suggests first-line selection review.",
    });
  }
  if (p.currentDrug !== "none" || p.lastDenosumabDate || p.lastTeriparatideDate) {
    matches.push({
      priority: 8,
      routeTo: "module-sequencing",
      reason: "Ongoing therapy calls for explicit long-term sequencing.",
    });
  }

  matches.sort((a, b) => a.priority - b.priority);
  const seen = new Set<string>();
  const dedup = matches.filter((m) => (seen.has(m.routeTo) ? false : (seen.add(m.routeTo), true)));
  return { primary: dedup[0] ?? null, related: dedup.slice(1) };
}

// ---------- Validation ----------

export interface IntakeValidation {
  ready: boolean;
  missing: string[];
  warnings: string[];
  satisfied: string[];
}

function inRange(v: number, lo: number, hi: number): boolean {
  return !isNaN(v) && v >= lo && v <= hi;
}

export function validateIntake(p: PatientInput): IntakeValidation {
  const missing: string[] = [];
  const warnings: string[] = [];
  const satisfied: string[] = [];

  // Required identity fields
  const age = parseFloat(p.age);
  if (!p.age.trim()) missing.push("Age");
  else if (!inRange(age, 18, 110)) warnings.push(`Age ${p.age} is outside the expected adult range (18–110).`);
  else satisfied.push(`Age ${age}`);

  if (!p.sex) missing.push("Sex");
  else satisfied.push(p.sex === "female" ? (p.postmenopausal ? "Postmenopausal female" : "Female") : "Male");

  // At least one clinical anchor
  const fn = parseFloat(p.femoralNeckTScore);
  const th = parseFloat(p.totalHipTScore);
  const ls = parseFloat(p.lumbarSpineTScore);
  const fm = parseFloat(p.fraxMajorPercent);
  const fh = parseFloat(p.fraxHipPercent);
  const dose = parseFloat(p.prednisoneEquivalentMgPerDay);
  const dur = parseFloat(p.steroidDurationMonths);
  const crcl = parseFloat(p.crcl);
  const l1 = parseFloat(p.l1Hu);

  const anchors: string[] = [];
  if (p.fragilityFractureType !== "none") anchors.push(`Fracture: ${p.fragilityFractureType}`);
  if (!isNaN(fn) || !isNaN(th)) anchors.push("Hip T-score entered");
  if (!isNaN(ls)) anchors.push("Spine T-score entered");
  if (!isNaN(fm) || !isNaN(fh)) anchors.push("FRAX entered");
  if (!isNaN(dose) && !isNaN(dur)) anchors.push(`Steroids ${dose} mg/d × ${dur} mo`);
  else if (!isNaN(dose) && isNaN(dur)) warnings.push("Steroid dose entered but duration (months) is missing.");
  else if (!isNaN(dur) && isNaN(dose)) warnings.push("Steroid duration entered but daily dose (mg) is missing.");
  if (p.currentDrug !== "none") anchors.push(`Current drug: ${p.currentDrug}`);
  if (p.secondaryCauseFlags.length) anchors.push(`${p.secondaryCauseFlags.length} secondary-cause flag(s)`);
  if (!isNaN(l1)) anchors.push(`L1 HU ${l1}`);

  if (anchors.length === 0) {
    missing.push(
      "At least one clinical anchor — fracture type, a T-score, FRAX %, steroid exposure (dose + duration), current bone drug, or a secondary-cause flag.",
    );
  } else {
    satisfied.push(...anchors);
  }

  // Range warnings (do not block)
  if (!isNaN(fn) && !inRange(fn, -6, 2)) warnings.push(`Femoral-neck T-score ${fn} is outside the plausible range (-6 to 2).`);
  if (!isNaN(th) && !inRange(th, -6, 2)) warnings.push(`Total-hip T-score ${th} is outside the plausible range (-6 to 2).`);
  if (!isNaN(ls) && !inRange(ls, -6, 2)) warnings.push(`Lumbar-spine T-score ${ls} is outside the plausible range (-6 to 2).`);
  if (!isNaN(fm) && !inRange(fm, 0, 100)) warnings.push(`FRAX major ${fm}% must be 0–100.`);
  if (!isNaN(fh) && !inRange(fh, 0, 100)) warnings.push(`FRAX hip ${fh}% must be 0–100.`);
  if (!isNaN(crcl) && !inRange(crcl, 0, 200)) warnings.push(`CrCl ${crcl} mL/min is outside 0–200.`);
  if (!isNaN(dose) && !inRange(dose, 0, 200)) warnings.push(`Steroid dose ${dose} mg/d is outside 0–200.`);
  if (!isNaN(l1) && !inRange(l1, 0, 400)) warnings.push(`L1 HU ${l1} is outside the plausible range (0–400).`);

  // Drug-specific consistency
  if (p.currentDrug !== "denosumab" && p.lastDenosumabDate) {
    warnings.push("Last denosumab date entered but current drug is not denosumab — confirm timing.");
  }
  if (p.currentDrug !== "teriparatide" && p.lastTeriparatideDate) {
    warnings.push("Last teriparatide date entered but current drug is not teriparatide — confirm timing.");
  }
  const today = new Date();
  if (p.lastDenosumabDate && new Date(p.lastDenosumabDate) > today) {
    warnings.push("Last denosumab date is in the future.");
  }
  if (p.lastTeriparatideDate && new Date(p.lastTeriparatideDate) > today) {
    warnings.push("Last teriparatide date is in the future.");
  }

  return { ready: missing.length === 0, missing, warnings, satisfied };
}

function ValidationCard({ v }: { v: IntakeValidation }) {
  return (
    <SectionCard
      id="navigator-validation"
      title={v.ready ? "Intake complete" : "Intake incomplete"}
      subtitle={
        v.ready
          ? "Required fields are set — the recommended module is shown below."
          : "Fill the required fields below to unlock the recommended module."
      }
      icon={v.ready ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      defaultOpen
    >
      {v.missing.length > 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Pill tone="warning">Required — missing</Pill>
            <span className="text-xs text-muted-foreground">{v.missing.length} item(s)</span>
          </div>
          <ul className="list-disc pl-5 text-sm">
            {v.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {v.satisfied.length > 0 && (
        <div>
          <div className="mb-1 mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Provided
          </div>
          <div className="flex flex-wrap gap-1.5">
            {v.satisfied.map((s) => (
              <Pill key={s} tone="success">
                {s}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {v.warnings.length > 0 && (
        <div className="mt-2 rounded-md border border-border/60 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Pill tone="info">Check</Pill>
            <span className="text-xs text-muted-foreground">Non-blocking warnings</span>
          </div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {v.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

// ---------- UI ----------


function IntakeCard({
  input,
  set,
  reset,
}: {
  input: PatientInput;
  set: <K extends keyof PatientInput>(k: K, v: PatientInput[K]) => void;
  reset: () => void;
}) {
  const toggleCause = (label: string) => {
    const has = input.secondaryCauseFlags.includes(label);
    set(
      "secondaryCauseFlags",
      has ? input.secondaryCauseFlags.filter((x) => x !== label) : [...input.secondaryCauseFlags, label],
    );
  };
  return (
    <SectionCard
      id="navigator-intake"
      title="Enter scenario"
      subtitle="Manual entry only — nothing is transmitted. Fields are optional; fill only what applies."
      icon={<Compass className="h-4 w-4" />}
      defaultOpen
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Age (yrs)">
          <Input inputMode="numeric" value={input.age} onChange={(e) => set("age", e.target.value)} />
        </Field>
        <Field label="Sex">
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={input.sex}
            onChange={(e) => set("sex", e.target.value as PatientInput["sex"])}
          >
            <option value="">—</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </Field>
        <Field label="Fragility fracture type">
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={input.fragilityFractureType}
            onChange={(e) => set("fragilityFractureType", e.target.value as FractureType)}
          >
            <option value="none">None</option>
            <option value="hip">Hip</option>
            <option value="vertebral">Vertebral</option>
            <option value="distal-radius">Distal radius</option>
            <option value="humerus">Humerus</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Femoral-neck T-score">
          <Input inputMode="decimal" value={input.femoralNeckTScore} onChange={(e) => set("femoralNeckTScore", e.target.value)} />
        </Field>
        <Field label="Total-hip T-score">
          <Input inputMode="decimal" value={input.totalHipTScore} onChange={(e) => set("totalHipTScore", e.target.value)} />
        </Field>
        <Field label="Lumbar-spine T-score">
          <Input inputMode="decimal" value={input.lumbarSpineTScore} onChange={(e) => set("lumbarSpineTScore", e.target.value)} />
        </Field>
        <Field label="FRAX major %">
          <Input inputMode="decimal" value={input.fraxMajorPercent} onChange={(e) => set("fraxMajorPercent", e.target.value)} />
        </Field>
        <Field label="FRAX hip %">
          <Input inputMode="decimal" value={input.fraxHipPercent} onChange={(e) => set("fraxHipPercent", e.target.value)} />
        </Field>
        <Field label="CrCl (mL/min)">
          <Input inputMode="decimal" value={input.crcl} onChange={(e) => set("crcl", e.target.value)} />
        </Field>
        <Field label="Prednisone-equiv (mg/day)">
          <Input inputMode="decimal" value={input.prednisoneEquivalentMgPerDay} onChange={(e) => set("prednisoneEquivalentMgPerDay", e.target.value)} />
        </Field>
        <Field label="Steroid duration (months)">
          <Input inputMode="decimal" value={input.steroidDurationMonths} onChange={(e) => set("steroidDurationMonths", e.target.value)} />
        </Field>
        <Field label="L1 HU (optional CT)">
          <Input inputMode="decimal" value={input.l1Hu} onChange={(e) => set("l1Hu", e.target.value)} />
        </Field>
        <Field label="Current bone drug">
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={input.currentDrug}
            onChange={(e) => set("currentDrug", e.target.value as CurrentDrug)}
          >
            <option value="none">None</option>
            <option value="oral-bp">Oral bisphosphonate</option>
            <option value="iv-zoledronate">IV zoledronate</option>
            <option value="denosumab">Denosumab</option>
            <option value="teriparatide">Teriparatide / abaloparatide</option>
            <option value="romosozumab">Romosozumab</option>
          </select>
        </Field>
        <Field label="Last denosumab dose (date)">
          <Input type="date" value={input.lastDenosumabDate} onChange={(e) => set("lastDenosumabDate", e.target.value)} />
        </Field>
        <Field label="Last teriparatide dose (date)">
          <Input type="date" value={input.lastTeriparatideDate} onChange={(e) => set("lastTeriparatideDate", e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Toggle checked={input.postmenopausal} onChange={(v) => set("postmenopausal", v)} label="Postmenopausal" />
        <Toggle checked={input.spinePainRedFlag} onChange={(v) => set("spinePainRedFlag", v)} label="New severe thoracolumbar back pain" />
        <Toggle checked={input.cordCompressionSigns} onChange={(v) => set("cordCompressionSigns", v)} label="Neurological deficit / cord signs" />
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
          Secondary-cause flags
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {SECONDARY_CAUSES.map((label) => (
            <Toggle
              key={label}
              checked={input.secondaryCauseFlags.includes(label)}
              onChange={() => toggleCause(label)}
              label={label}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
        </Button>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}

function ResultsCard({
  primary,
  related,
  onOpen,
}: {
  primary: RouteMatch | null;
  related: RouteMatch[];
  onOpen: (id: string) => void;
}) {
  if (!primary) return null;
  const mod = MODULE_MAP[primary.routeTo];
  return (
    <SectionCard
      id="navigator-result"
      title="Recommended module"
      subtitle="One suggested starting point. Related modules are listed below."
      icon={<Compass className="h-4 w-4" />}
      defaultOpen
    >
      <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
        <div className="flex items-center gap-2">
          <Pill tone="primary">Best match</Pill>
          <span className="text-sm font-semibold">{mod.title}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{mod.purpose}</p>
        <div className="mt-2 text-sm">
          <span className="font-medium">Why this was selected: </span>
          <span className="text-muted-foreground">{primary.reason}</span>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={() => onOpen(primary.routeTo)}>
            {mod.primaryCTA} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Also relevant
          </div>
          <ul className="space-y-1.5">
            {related.slice(0, 4).map((r) => {
              const m = MODULE_MAP[r.routeTo];
              return (
                <li key={r.routeTo} className="flex items-start justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{r.reason}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onOpen(r.routeTo)}>
                    Open
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Callout tone="warning" title="Safety">
        Suggestions are educational pointers to a learning module. They are not a diagnosis or a treatment recommendation. Any clinical decision must be made by a qualified clinician using the full patient context.
      </Callout>
    </SectionCard>
  );
}

function ModuleCard({ m, forceOpen, input }: { m: ModuleItem; forceOpen: boolean; input: PatientInput }) {
  const Icon = m.icon;
  return (
    <SectionCard
      id={m.id}
      title={m.title}
      subtitle={m.purpose}
      icon={<Icon className="h-4 w-4" />}
      defaultOpen={forceOpen}
    >
      <ModuleCalculator id={m.id} input={input} />
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 mt-3">
          What this module covers
        </div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {m.learn.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 mt-2">
          Key concepts
        </div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {m.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      <Callout tone="info" title="Educational only">
        This module summarises published guideline concepts for learning. It does not recommend a diagnosis, drug or
        dose for any individual patient.
      </Callout>
    </SectionCard>
  );
}

// ---------- Per-module calculators ----------

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function mapFractureType(f: FractureType): LogicFractureType {
  if (f === "distal-radius") return "distal radius";
  if (f === "none") return "none";
  return f as LogicFractureType;
}

function CalcShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Pill tone="primary">Calculator</Pill>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function ModuleCalculator({ id, input }: { id: string; input: PatientInput }) {
  const fn = parseFloat(input.femoralNeckTScore);
  const th = parseFloat(input.totalHipTScore);
  const ls = parseFloat(input.lumbarSpineTScore);
  const crcl = parseFloat(input.crcl);
  const steroidDose = parseFloat(input.prednisoneEquivalentMgPerDay);
  const steroidDur = parseFloat(input.steroidDurationMonths);
  const denoYrs = parseFloat(input.denosumabDurationYears);

  if (id === "module-fragility-fracture") {
    const idxT = !isNaN(fn) ? fn : (!isNaN(th) ? th : NaN);
    const r = stratify({
      fractureType: mapFractureType(input.fragilityFractureType),
      priorHipOrVertebral: input.fragilityFractureType === "hip" || input.fragilityFractureType === "vertebral",
      tScore: isNaN(idxT) ? "" : idxT,
      fraxMajor: input.fraxMajorPercent,
      fraxHip: input.fraxHipPercent,
      recentMultiple: false,
      multipleVertebral: false,
      glucocorticoid: !isNaN(steroidDose) && steroidDose >= 5,
      advancedAge: !isNaN(parseFloat(input.age)) && parseFloat(input.age) >= 75,
      highFallRisk: false,
      l1Hu: input.l1Hu,
    });
    const tone = r.risk === "veryHigh" ? "danger" : r.risk === "high" ? "warning" : "info";
    return (
      <CalcShell title="Risk stratification">
        <div className="flex items-center gap-2">
          <Pill tone={tone as any}>
            {r.risk === "veryHigh" ? "Very high risk" : r.risk === "high" ? "High risk" : "Moderate / not high"}
          </Pill>
          <span className="text-xs text-muted-foreground">
            Index site: {!isNaN(fn) ? `femoral neck ${fn.toFixed(1)}` : !isNaN(th) ? `total hip ${th.toFixed(1)}` : "not entered"}
          </span>
        </div>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          {r.reasons.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </CalcShell>
    );
  }

  if (id === "module-discordance") {
    const hipT = !isNaN(fn) ? fn : th;
    const r = discordanceGuidance(hipT, ls);
    return (
      <CalcShell title="Spine–hip discordance">
        {isNaN(hipT) || isNaN(ls) ? (
          <div className="text-muted-foreground">Enter femoral-neck (or total-hip) and lumbar-spine T-scores in the intake to compute.</div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Pill tone={r.upAdjust ? "warning" : "info"}>
                {r.discordant ? (r.upAdjust ? "Up-adjust risk one step" : "Hip already lower — no up-adjust") : "No clinically important discordance"}
              </Pill>
              <span className="text-xs text-muted-foreground">Gap (spine − hip): {isNaN(r.gap) ? "—" : r.gap.toFixed(1)} SD</span>
            </div>
            <p className="text-xs text-muted-foreground">{r.message}</p>
          </>
        )}
      </CalcShell>
    );
  }

  if (id === "module-denosumab-transition") {
    const win = bridgingWindow(input.lastDenosumabDate);
    const duration: Duration = !isNaN(denoYrs) && denoYrs >= 2.5 ? "long" : "short";
    const priorVert = input.fragilityFractureType === "vertebral";
    const zol = zoledronatePlan(duration, priorVert);
    const safety = crClSafety("zoledronate", isNaN(crcl) ? null : crcl);
    const last = input.lastDenosumabDate ? new Date(input.lastDenosumabDate) : null;
    const infusionDates = last && !isNaN(last.getTime())
      ? zol.monthsAfterLastDose.map((mo) => { const d = new Date(last); d.setMonth(d.getMonth() + mo); return d; })
      : [];
    return (
      <CalcShell title="Bridging schedule">
        {!win ? (
          <div className="text-muted-foreground">Enter the last denosumab dose date in the intake to compute the bridging window.</div>
        ) : (
          <>
            <div className="grid gap-1 sm:grid-cols-3 text-xs">
              <div><span className="text-muted-foreground">Ideal start (6 mo): </span><strong>{fmtDate(win.start)}</strong></div>
              <div><span className="text-muted-foreground">Ideal end (7 mo): </span><strong>{fmtDate(win.end)}</strong></div>
              <div><span className="text-muted-foreground">Hard deadline (9 mo): </span><strong>{fmtDate(win.hard)}</strong></div>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="primary">{zol.infusions === 2 ? "2 × zoledronate 5 mg IV" : "1 × zoledronate 5 mg IV"}</Pill>
              <span className="text-xs text-muted-foreground">
                {duration === "long" ? "≥ 2.5 y denosumab exposure" : "< 2.5 y denosumab exposure"}{priorVert ? " + prior vertebral fracture" : ""}
              </span>
            </div>
            {infusionDates.length > 0 && (
              <div className="text-xs">Planned infusion dates: {infusionDates.map(fmtDate).join(" · ")}</div>
            )}
            <div className={`rounded border px-2 py-1.5 text-xs ${
              safety.severity === "danger" ? "border-destructive/50 bg-destructive/10" :
              safety.severity === "warning" ? "border-amber-500/50 bg-amber-500/10" :
              "border-border/60"
            }`}>
              <strong>Renal safety: </strong>{safety.messages.join(" ")}
              {!safety.allowed && <> Recommended alternative: <em>{safety.recommendedPlan.replace("_", " ")}</em>.</>}
            </div>
          </>
        )}
      </CalcShell>
    );
  }

  if (id === "module-teriparatide-followon") {
    const last = input.lastTeriparatideDate ? new Date(input.lastTeriparatideDate) : null;
    if (!last || isNaN(last.getTime())) {
      return (
        <CalcShell title="Follow-on window">
          <div className="text-muted-foreground">Enter the last teriparatide dose date in the intake to compute the follow-on window.</div>
        </CalcShell>
      );
    }
    const early = new Date(last); early.setDate(early.getDate() + 7);
    const target = new Date(last); target.setMonth(target.getMonth() + 1);
    return (
      <CalcShell title="Anabolic → antiresorptive window">
        <div className="grid gap-1 sm:grid-cols-2 text-xs">
          <div><span className="text-muted-foreground">Earliest (~1 wk): </span><strong>{fmtDate(early)}</strong></div>
          <div><span className="text-muted-foreground">Target (~1 mo): </span><strong>{fmtDate(target)}</strong></div>
        </div>
        <p className="text-xs text-muted-foreground">
          Start an antiresorptive within roughly one month of the last teriparatide dose to avoid rapid BMD loss.
        </p>
      </CalcShell>
    );
  }

  if (id === "module-giop") {
    const highDose = !isNaN(steroidDose) && steroidDose >= 7.5;
    const chronic = !isNaN(steroidDur) && steroidDur >= 3;
    const lowT = !isNaN(fn) && fn <= -2.5;
    let band: "veryHigh" | "high" | "moderate" | "low" = "low";
    if (lowT || (highDose && chronic && !isNaN(fn) && fn <= -1.5)) band = "veryHigh";
    else if (highDose || chronic) band = "high";
    else if (!isNaN(steroidDose) && steroidDose > 0) band = "moderate";
    const label = { veryHigh: "Very high", high: "High", moderate: "Moderate", low: "Low / not classified" }[band];
    const tone = band === "veryHigh" ? "danger" : band === "high" ? "warning" : "info";
    return (
      <CalcShell title="GIOP risk band">
        <div className="flex items-center gap-2">
          <Pill tone={tone as any}>{label}</Pill>
          <span className="text-xs text-muted-foreground">
            {isNaN(steroidDose) ? "steroid dose —" : `${steroidDose} mg/d`} · {isNaN(steroidDur) ? "duration —" : `${steroidDur} mo`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Bands are educational shortcuts (dose ≥ 7.5 mg/d and/or ≥ 3 mo, index T-score ≤ –2.5). Formal ACR 2022 stratification requires full FRAX inputs.
        </p>
      </CalcShell>
    );
  }

  if (id === "module-steroid-alert") {
    const flags: string[] = [];
    if (input.spinePainRedFlag) flags.push("New severe thoracolumbar pain");
    if (input.cordCompressionSigns) flags.push("Neurological deficit / cord signs");
    if (!isNaN(steroidDose) && steroidDose >= 5) flags.push(`Steroids ${steroidDose} mg/d`);
    if (!isNaN(steroidDur) && steroidDur >= 3) flags.push(`Duration ${steroidDur} mo`);
    const urgent = input.spinePainRedFlag || input.cordCompressionSigns;
    return (
      <CalcShell title="Red-flag checker">
        <div className="flex items-center gap-2">
          <Pill tone={urgent ? "danger" : "info"}>{urgent ? "Urgent clinician review" : "No red flags entered"}</Pill>
        </div>
        {flags.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-muted-foreground">
            {flags.map((f) => <li key={f}>{f}</li>)}
          </ul>
        )}
      </CalcShell>
    );
  }

  if (id === "module-secondary-causes") {
    const baseline = ["CBC", "CMP (Ca, Cr, ALP)", "25-OH-vitamin D", "PTH", "TSH", "24-h urine Ca/Cr", "HbA1c (if T2DM screening)"];
    return (
      <CalcShell title="Baseline panel & flagged causes">
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Selected flags ({input.secondaryCauseFlags.length})</div>
          {input.secondaryCauseFlags.length === 0 ? (
            <div className="text-xs text-muted-foreground">No secondary-cause flags selected in the intake.</div>
          ) : (
            <ul className="list-disc pl-5 text-xs">{input.secondaryCauseFlags.map((f) => <li key={f}>{f}</li>)}</ul>
          )}
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1 mt-2">Baseline lab panel</div>
          <ul className="list-disc pl-5 text-xs">{baseline.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
      </CalcShell>
    );
  }

  if (id === "module-sequencing") {
    const drug = input.currentDrug;
    const next = drug === "teriparatide" || drug === "romosozumab"
      ? "Follow with an antiresorptive (denosumab or zoledronate) within ~1 month of the last anabolic dose."
      : drug === "denosumab"
      ? "Do not stop without a bisphosphonate bridge. Plan the transition around month 6–7 after the last dose."
      : drug === "oral-bp" || drug === "iv-zoledronate"
      ? "Reassess after adequate duration (oral 3–5 y, IV 3 y). Consider holiday only if risk is now low."
      : "No agent selected — start point depends on stratified risk.";
    return (
      <CalcShell title="Sequencing suggestion">
        <div className="flex items-center gap-2">
          <Pill tone="primary">Current: {drug}</Pill>
        </div>
        <p className="text-xs text-muted-foreground">{next}</p>
      </CalcShell>
    );
  }

  if (id === "module-combination") {
    return (
      <CalcShell title="Concurrent schedule">
        <ul className="list-disc pl-5 text-xs">
          <li>Teriparatide 20 µg SC daily × up to 24 months.</li>
          <li>Denosumab 60 mg SC every 6 months (own schedule — never mixed in one injection).</li>
          <li>Reserved for very-high-risk disease seeking maximal BMD gain.</li>
        </ul>
      </CalcShell>
    );
  }

  if (id === "module-monitoring-holiday") {
    const drug = input.currentDrug;
    const holidayEligible = drug === "oral-bp" || drug === "iv-zoledronate";
    return (
      <CalcShell title="Holiday & monitoring eligibility">
        <div className="flex items-center gap-2">
          <Pill tone={holidayEligible ? "info" : "warning"}>
            {holidayEligible ? "Holiday concept applies" : "No drug-holiday concept"}
          </Pill>
        </div>
        <p className="text-xs text-muted-foreground">
          {holidayEligible
            ? "Reassess risk after oral BP 3–5 y or IV zoledronate 3 y. Holiday only if risk is low and no interim fracture."
            : "Denosumab and anabolic agents have no drug-holiday — plan a bisphosphonate transition instead of stopping."}
        </p>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          <li>DXA every 1–2 y on therapy, then per response.</li>
          <li>Adjuncts: calcium 1000–1200 mg/d, 25-OH-D ≥ 30 ng/mL.</li>
        </ul>
      </CalcShell>
    );
  }

  return null;
}

export default function OsteoporosisApp() {
  const [input, setInput] = useState<PatientInput>(INITIAL);
  const [openId, setOpenId] = useState<string | null>(null);
  const set = <K extends keyof PatientInput>(k: K, v: PatientInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));
  const reset = () => {
    setInput(INITIAL);
    setOpenId(null);
  };

  const { primary, related } = useMemo(() => autoRoute(input), [input]);
  const validation = useMemo(() => validateIntake(input), [input]);

  const handleOpen = (id: string) => {
    setOpenId(id);
    // Scroll the target module into view; SectionCard defaultOpen handles the open state.
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard
        id="navigator-overview"
        title="Fragility Fracture Osteoporosis Navigator"
        subtitle="v1.0.0 · Educational navigator for osteoporosis, fragility-fracture, GIOP, sequencing and transition concepts."
        icon={<BookOpen className="h-4 w-4" />}
        defaultOpen
      >
        <Callout tone="warning" title="Important — read before use">
          This tool is for informational and educational purposes only. It does not provide medical diagnosis,
          treatment, or emergency advice, and it does not replace clinical judgement. Always consult a qualified
          clinician before making medical decisions. All entries are manual; no data is transmitted or stored on a
          server.
        </Callout>
        <p className="text-sm text-muted-foreground">
          Enter the facts you know in the intake card below. The navigator will highlight one recommended learning
          module and list related modules. You can also open any module directly from the list further down.
        </p>
      </SectionCard>

      <IntakeCard input={input} set={set} reset={reset} />
      <ValidationCard v={validation} />

      {validation.ready && (
        <>
          <ResultsCard primary={primary} related={related} onOpen={handleOpen} />
          {(() => {
            const relevantIds = new Set<string>();
            if (primary) relevantIds.add(primary.routeTo);
            related.forEach((r) => relevantIds.add(r.routeTo));
            const relevantModules = MODULES.filter((m) => relevantIds.has(m.id));
            if (relevantModules.length === 0) return null;
            return (
              <>
                {relevantModules.map((m) => (
                  <ModuleCard key={m.id} m={m} forceOpen={openId === m.id} input={input} />
                ))}
              </>
            );
          })()}
        </>
      )}

      <SectionCard
        id="navigator-sources"
        title="Sources referenced"
        icon={<FlaskConical className="h-4 w-4" />}
        defaultOpen={false}
      >
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>IOF / ESCEO 2019–2020</li>
          <li>AACE / ACE 2020 postmenopausal osteoporosis update</li>
          <li>AO Foundation fragility-fracture pathway</li>
          <li>ACR 2022 glucocorticoid-induced osteoporosis</li>
          <li>ECTS / ASBMR denosumab discontinuation position papers</li>
          <li>DATA / DATA-Switch (teriparatide + denosumab sequencing)</li>
        </ul>
      </SectionCard>

      <SectionCard id="navigator-safety" title="Safety & scope" icon={<ShieldAlert className="h-4 w-4" />} defaultOpen={false}>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Educational content only — not a diagnostic or treatment tool.</li>
          <li>Manual data entry only; no device sensors or health-record integration.</li>
          <li>Works offline; no personal data is transmitted or stored on a server.</li>
          <li>Emergencies (suspected acute fracture, neurological deficit, severe hypocalcaemia symptoms) require immediate in-person medical care.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
