import * as React from "react";
import { useMemo, useRef, useState } from "react";
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
  Copy,
  Download,
  Printer,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard, Callout, Pill, KeyRow } from "./shared";
import { stratify, discordanceGuidance, type FractureType as LogicFractureType } from "./osteoporosisLogic";
import { bridgingWindow, zoledronatePlan, crClSafety, type Duration } from "./denosumabLogic";
import veryHighRiskImg from "@/assets/Osteoporosis_Rx.png.asset.json";
import bisphosphonateCriteriaImg from "@/assets/bisphosphonate-criteria.png.asset.json";
import fragFxGuideImg from "@/assets/moderate-risk-fragility-fracture.png.asset.json";
import { ImageViewerTrigger, useImageViewer } from "@/components/ImageViewer";
import difficultDiabetesAsset from "@/assets/difficult-diabetes.png.asset.json";



import GiopApp from "./GiopApp";
import FraxDecisionFlow from "./FraxDecisionFlow";
import DosingQuickcards from "./DosingQuickcards";

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
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <SectionCard
      id={m.id}
      title={m.title}
      subtitle={m.purpose}
      icon={<Icon className="h-4 w-4" />}
      defaultOpen={forceOpen}
    >
      <div ref={contentRef} data-export-root>
        <ModuleCalculator id={m.id} input={input} />
        <ModuleRichContent id={m.id} />
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
      </div>
      <ExportBar title={m.title} getNode={() => contentRef.current} />
    </SectionCard>
  );
}

function ExportBar({ title, getNode }: { title: string; getNode: () => HTMLElement | null }) {
  const [copied, setCopied] = useState(false);

  const getText = () => {
    const node = getNode();
    if (!node) return "";
    return `${title}\n${"=".repeat(title.length)}\n\n${(node.innerText || "").trim()}\n`;
  };

  const handleCopy = async () => {
    const txt = getText();
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([getText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    a.href = url;
    a.download = `${slug || "module"}-recommendation.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const node = getNode();
    if (!node) return;
    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body{font:14px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;padding:24px;max-width:780px;margin:auto;}
        h1{font-size:20px;margin:0 0 4px;} .disclaimer{font-size:11px;color:#555;margin-top:24px;border-top:1px solid #ddd;padding-top:8px;}
        img{max-width:100%;height:auto;} ul{padding-left:20px;} .section{margin:12px 0;padding:10px;border:1px solid #e5e7eb;border-radius:6px;}
        button, input, select, [role="button"]{display:none !important;}
      </style></head><body>
      <h1>${title}</h1>
      <div>${node.innerHTML}</div>
      <div class="disclaimer">Educational reference only — not individualized medical advice. Verify against current guidelines and patient context.</div>
      <script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 print:hidden">
      <span className="text-xs text-muted-foreground mr-1">Share this plan:</span>
      <Button size="sm" variant="outline" onClick={handleCopy} aria-label={`Copy ${title} recommendation`}>
        <Copy className="mr-1 h-3.5 w-3.5" />
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button size="sm" variant="outline" onClick={handleDownload} aria-label={`Download ${title} recommendation`}>
        <Download className="mr-1 h-3.5 w-3.5" />
        Download .txt
      </Button>
      <Button size="sm" variant="outline" onClick={handlePrint} aria-label={`Print ${title} recommendation`}>
        <Printer className="mr-1 h-3.5 w-3.5" />
        Print / PDF
      </Button>
    </div>
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

function LabeledInput({ label, value, onChange, type = "text", inputMode }: { label: string; value: string; onChange: (v: string) => void; type?: string; inputMode?: "decimal" | "numeric" | "text" }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input value={value} type={type} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />
    </div>
  );
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <select className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Recommendation({ tone, title, children }: { tone: "danger" | "warning" | "info" | "success"; title: string; children: React.ReactNode }) {
  const cls = tone === "danger" ? "border-destructive/50 bg-destructive/10" : tone === "warning" ? "border-amber-500/50 bg-amber-500/10" : tone === "success" ? "border-emerald-500/50 bg-emerald-500/10" : "border-primary/40 bg-primary/5";
  return (
    <div className={`rounded-md border p-3 ${cls}`}>
      <div className="mb-1 flex items-center gap-2">
        <Pill tone={tone as any}>{title}</Pill>
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

// ----- Fragility fracture calculator -----
function FragilityCalc({ input }: { input: PatientInput }) {
  const seedT = input.femoralNeckTScore || input.totalHipTScore;
  const [age, setAge] = useState(input.age);
  const [fracture, setFracture] = useState<FractureType>(input.fragilityFractureType);
  const [tScore, setTScore] = useState(seedT);
  const [fraxMajor, setFraxMajor] = useState(input.fraxMajorPercent);
  const [fraxHip, setFraxHip] = useState(input.fraxHipPercent);
  const [l1Hu, setL1Hu] = useState(input.l1Hu);
  const [recentMult, setRecentMult] = useState(false);
  const [multVert, setMultVert] = useState(false);
  const [gc, setGc] = useState(!isNaN(parseFloat(input.prednisoneEquivalentMgPerDay)) && parseFloat(input.prednisoneEquivalentMgPerDay) >= 5);
  const [fallRisk, setFallRisk] = useState(false);

  const r = stratify({
    fractureType: mapFractureType(fracture),
    priorHipOrVertebral: fracture === "hip" || fracture === "vertebral",
    tScore: tScore === "" ? "" : parseFloat(tScore),
    fraxMajor,
    fraxHip,
    recentMultiple: recentMult,
    multipleVertebral: multVert,
    glucocorticoid: gc,
    advancedAge: !isNaN(parseFloat(age)) && parseFloat(age) >= 75,
    highFallRisk: fallRisk,
    l1Hu,
  });
  const tone = r.risk === "veryHigh" ? "danger" : r.risk === "high" ? "warning" : "info";
  const label = r.risk === "veryHigh" ? "Very high risk" : r.risk === "high" ? "High risk" : "Moderate / not high";
  const firstLine = r.risk === "veryHigh"
    ? "Anabolic first-line (romosozumab 12 mo or teriparatide/abaloparatide up to 24 mo), followed by a potent antiresorptive."
    : r.risk === "high"
    ? "Potent antiresorptive first-line: zoledronate 5 mg IV yearly OR denosumab 60 mg SC q6mo. Oral bisphosphonate acceptable if lower burden."
    : "Oral bisphosphonate (alendronate 70 mg weekly, risedronate 35 mg weekly) with adjuncts. Reassess risk at 2 y.";

  return (
    <CalcShell title="Fragility-fracture risk stratification">
      <div className="grid gap-2 sm:grid-cols-3">
        <LabeledInput label="Age" value={age} onChange={setAge} inputMode="numeric" />
        <LabeledSelect label="Fracture type" value={fracture} onChange={(v) => setFracture(v as FractureType)}
          options={[{value:"none",label:"None"},{value:"hip",label:"Hip"},{value:"vertebral",label:"Vertebral"},{value:"distal-radius",label:"Distal radius"},{value:"humerus",label:"Humerus"},{value:"other",label:"Other"}]} />
        <LabeledInput label="Index T-score (FN/TH)" value={tScore} onChange={setTScore} inputMode="decimal" />
        <LabeledInput label="FRAX major %" value={fraxMajor} onChange={setFraxMajor} inputMode="decimal" />
        <div className="flex flex-col items-start italic text-[9px] text-muted-foreground leading-tight">
          '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
          <br />
          ADD A FRAX calculator
        </div>
        <LabeledInput label="FRAX hip %" value={fraxHip} onChange={setFraxHip} inputMode="decimal" />
        <LabeledInput label="L1 HU (CT)" value={l1Hu} onChange={setL1Hu} inputMode="decimal" />
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2 mt-2">
        <Toggle checked={recentMult} onChange={setRecentMult} label="Multiple recent fractures" />
        <Toggle checked={multVert} onChange={setMultVert} label="Multiple vertebral fractures" />
        <Toggle checked={gc} onChange={setGc} label="Glucocorticoid ≥ 5 mg/d" />
        <Toggle checked={fallRisk} onChange={setFallRisk} label="High fall risk" />
      </div>
      <Recommendation tone={tone as any} title={label}>
        <div><strong>First-line concept: </strong>{firstLine}</div>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          {r.reasons.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </Recommendation>
    </CalcShell>
  );
}

// ----- Discordance calculator -----
function DiscordanceCalc({ input }: { input: PatientInput }) {
  const [hip, setHip] = useState(input.femoralNeckTScore || input.totalHipTScore);
  const [spine, setSpine] = useState(input.lumbarSpineTScore);
  const hipN = parseFloat(hip);
  const spineN = parseFloat(spine);
  const r = discordanceGuidance(hipN, spineN);
  return (
    <CalcShell title="Spine–hip discordance rule">
      <div className="grid gap-2 sm:grid-cols-2">
        <LabeledInput label="Hip T-score (FN or TH)" value={hip} onChange={setHip} inputMode="decimal" />
        <LabeledInput label="Lumbar-spine T-score" value={spine} onChange={setSpine} inputMode="decimal" />
      </div>
      {isNaN(hipN) || isNaN(spineN) ? (
        <div className="text-xs text-muted-foreground">Enter both T-scores to compute.</div>
      ) : (
        <Recommendation tone={r.upAdjust ? "warning" : "info"} title={r.discordant ? (r.upAdjust ? "Up-adjust reported risk one step" : "Hip already lower") : "No clinically important discordance"}>
          <div><strong>Gap (spine − hip): </strong>{r.gap.toFixed(1)} SD</div>
          <p className="text-xs text-muted-foreground">{r.message}</p>
          <p className="text-xs text-muted-foreground"><strong>Rule:</strong> keep the hip T-score in FRAX; never substitute the lowest or fracture-site T-score.</p>
        </Recommendation>
      )}
    </CalcShell>
  );
}

// ----- Denosumab transition calculator -----
function DenoTransitionCalc({ input }: { input: PatientInput }) {
  const [lastDose, setLastDose] = useState(input.lastDenosumabDate);
  const [years, setYears] = useState(input.denosumabDurationYears);
  const [priorVert, setPriorVert] = useState(input.fragilityFractureType === "vertebral");
  const [crcl, setCrcl] = useState(input.crcl);
  const yearsN = parseFloat(years);
  const crclN = parseFloat(crcl);
  const duration: Duration = !isNaN(yearsN) && yearsN >= 2.5 ? "long" : "short";
  const win = bridgingWindow(lastDose);
  const zol = zoledronatePlan(duration, priorVert);
  const safety = crClSafety("zoledronate", isNaN(crclN) ? null : crclN);
  const last = lastDose ? new Date(lastDose) : null;
  const infusionDates = last && !isNaN(last.getTime())
    ? zol.monthsAfterLastDose.map((mo) => { const d = new Date(last); d.setMonth(d.getMonth() + mo); return d; })
    : [];
  return (
    <CalcShell title="Denosumab bridging planner">
      <div className="grid gap-2 sm:grid-cols-2">
        <LabeledInput label="Last denosumab dose (date)" value={lastDose} onChange={setLastDose} type="date" />
        <LabeledInput label="Duration on denosumab (years)" value={years} onChange={setYears} inputMode="decimal" />
        <LabeledInput label="CrCl (mL/min)" value={crcl} onChange={setCrcl} inputMode="decimal" />
        <div className="flex items-end"><Toggle checked={priorVert} onChange={setPriorVert} label="Prior vertebral fracture" /></div>
      </div>
      {!win ? (
        <div className="text-xs text-muted-foreground">Enter last denosumab dose date to compute bridging window.</div>
      ) : (
        <Recommendation tone={safety.severity === "danger" ? "danger" : safety.severity === "warning" ? "warning" : "info"} title="Bridging plan">
          <div className="grid gap-1 sm:grid-cols-3 text-xs">
            <div><span className="text-muted-foreground">Ideal start (6 mo): </span><strong>{fmtDate(win.start)}</strong></div>
            <div><span className="text-muted-foreground">Ideal end (7 mo): </span><strong>{fmtDate(win.end)}</strong></div>
            <div><span className="text-muted-foreground">Hard deadline (9 mo): </span><strong>{fmtDate(win.hard)}</strong></div>
          </div>
          <div><strong>Regimen: </strong>{zol.infusions === 2 ? "Zoledronate 5 mg IV × 2 (at 6 mo, then 6 mo later)" : "Zoledronate 5 mg IV × 1 (at 6 mo)"} — {duration === "long" ? "≥ 2.5 y exposure" : "< 2.5 y exposure"}{priorVert ? ", with prior vertebral fracture" : ""}.</div>
          {infusionDates.length > 0 && (
            <div className="text-xs"><strong>Planned dates: </strong>{infusionDates.map(fmtDate).join(" · ")}</div>
          )}
          <div className="text-xs"><strong>Renal safety: </strong>{safety.messages.join(" ")} {!safety.allowed && <>Recommended alternative: <em>{safety.recommendedPlan.replace("_", " ")}</em>.</>}</div>
          <ul className="list-disc pl-5 text-xs text-muted-foreground">
            <li>Confirm calcium ≥ 8.5 mg/dL and 25-OH-D ≥ 30 ng/mL before infusion.</li>
            <li>Dental review before first zoledronate.</li>
            <li>Consider oral bisphosphonate follow-on if long prior exposure.</li>
          </ul>
        </Recommendation>
      )}
    </CalcShell>
  );
}

// ----- Teriparatide follow-on -----
function TeriFollowOnCalc({ input }: { input: PatientInput }) {
  const [lastDose, setLastDose] = useState(input.lastTeriparatideDate);
  const [followOn, setFollowOn] = useState<"denosumab" | "zoledronate" | "oral-bp">("denosumab");
  const [crcl, setCrcl] = useState(input.crcl);
  const last = lastDose ? new Date(lastDose) : null;
  const valid = last && !isNaN(last.getTime());
  const early = valid ? new Date(last!) : null; early?.setDate((early?.getDate() ?? 0) + 7);
  const target = valid ? new Date(last!) : null; target?.setMonth((target?.getMonth() ?? 0) + 1);
  const hard = valid ? new Date(last!) : null; hard?.setMonth((hard?.getMonth() ?? 0) + 2);
  const crclN = parseFloat(crcl);
  const zolSafety = followOn === "zoledronate" ? crClSafety("zoledronate", isNaN(crclN) ? null : crclN) : null;
  return (
    <CalcShell title="Anabolic → antiresorptive handover">
      <div className="grid gap-2 sm:grid-cols-3">
        <LabeledInput label="Last teriparatide dose (date)" value={lastDose} onChange={setLastDose} type="date" />
        <LabeledSelect label="Planned follow-on" value={followOn} onChange={(v) => setFollowOn(v as any)}
          options={[{value:"denosumab",label:"Denosumab"},{value:"zoledronate",label:"Zoledronate IV"},{value:"oral-bp",label:"Oral bisphosphonate"}]} />
        <LabeledInput label="CrCl (mL/min)" value={crcl} onChange={setCrcl} inputMode="decimal" />
      </div>
      {!valid ? (
        <div className="text-xs text-muted-foreground">Enter last teriparatide dose date to compute the window.</div>
      ) : (
        <Recommendation tone={zolSafety && !zolSafety.allowed ? "warning" : "info"} title="Handover plan">
          <div className="grid gap-1 sm:grid-cols-3 text-xs">
            <div><span className="text-muted-foreground">Earliest: </span><strong>{fmtDate(early!)}</strong></div>
            <div><span className="text-muted-foreground">Target (~1 mo): </span><strong>{fmtDate(target!)}</strong></div>
            <div><span className="text-muted-foreground">No later than (~2 mo): </span><strong>{fmtDate(hard!)}</strong></div>
          </div>
          <div><strong>Regimen: </strong>{followOn === "denosumab" ? "Denosumab 60 mg SC q6mo" : followOn === "zoledronate" ? "Zoledronate 5 mg IV yearly" : "Alendronate 70 mg PO weekly (or risedronate 35 mg)"}.</div>
          {zolSafety && (
            <div className="text-xs"><strong>Renal safety: </strong>{zolSafety.messages.join(" ")}</div>
          )}
          <p className="text-xs text-muted-foreground">Rapid BMD loss occurs if no antiresorptive follows teriparatide (DATA-Switch). Do not leave a gap.</p>
        </Recommendation>
      )}
    </CalcShell>
  );
}

// ----- GIOP -----
function GiopCalc({ input }: { input: PatientInput }) {
  const [age, setAge] = useState(input.age);
  const [sex, setSex] = useState<PatientInput["sex"]>(input.sex);
  const [dose, setDose] = useState(input.prednisoneEquivalentMgPerDay);
  const [dur, setDur] = useState(input.steroidDurationMonths);
  const [tScore, setTScore] = useState(input.femoralNeckTScore);
  const [fraxMajor, setFraxMajor] = useState(input.fraxMajorPercent);
  const doseN = parseFloat(dose), durN = parseFloat(dur), tN = parseFloat(tScore), fmN = parseFloat(fraxMajor), ageN = parseFloat(age);
  const highDose = !isNaN(doseN) && doseN >= 7.5;
  const chronic = !isNaN(durN) && durN >= 3;
  const lowT = !isNaN(tN) && tN <= -2.5;
  const highFrax = !isNaN(fmN) && fmN >= 20;
  const priorFx = input.fragilityFractureType !== "none";
  let band: "veryHigh" | "high" | "moderate" | "low" = "low";
  if (priorFx || lowT || (highDose && chronic && !isNaN(tN) && tN <= -1.5) || (!isNaN(ageN) && ageN >= 40 && highFrax)) band = "veryHigh";
  else if (highDose || chronic || highFrax) band = "high";
  else if (!isNaN(doseN) && doseN > 0) band = "moderate";
  const label = { veryHigh: "Very high", high: "High", moderate: "Moderate", low: "Low / not classified" }[band];
  const tone = band === "veryHigh" ? "danger" : band === "high" ? "warning" : "info";
  const rec = band === "veryHigh"
    ? "Anabolic (teriparatide) preferred if very-high risk with steroids continuing, followed by an antiresorptive."
    : band === "high"
    ? "Oral bisphosphonate first-line (alendronate 70 mg weekly). IV zoledronate or denosumab if oral not tolerated."
    : band === "moderate"
    ? "Universal measures + reassess: 1000–1200 mg calcium/d, 25-OH-D ≥ 30 ng/mL, weight-bearing exercise, fall prevention."
    : "Universal measures only; no pharmacotherapy indicated on entered data.";
  return (
    <CalcShell title="ACR 2022 GIOP band">
      <div className="grid gap-2 sm:grid-cols-3">
        <LabeledInput label="Age" value={age} onChange={setAge} inputMode="numeric" />
        <LabeledSelect label="Sex" value={sex} onChange={(v) => setSex(v as any)} options={[{value:"",label:"—"},{value:"female",label:"Female"},{value:"male",label:"Male"}]} />
        <LabeledInput label="Prednisone-equiv (mg/d)" value={dose} onChange={setDose} inputMode="decimal" />
        <LabeledInput label="Steroid duration (mo)" value={dur} onChange={setDur} inputMode="decimal" />
        <LabeledInput label="FN T-score" value={tScore} onChange={setTScore} inputMode="decimal" />
        <LabeledInput label="FRAX major %" value={fraxMajor} onChange={setFraxMajor} inputMode="decimal" />
      </div>
      <Recommendation tone={tone as any} title={label + " risk"}>
        <div><strong>Suggested class: </strong>{rec}</div>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          <li>High-dose flag (≥7.5 mg/d): {highDose ? "yes" : "no"} · Chronic (≥3 mo): {chronic ? "yes" : "no"}</li>
          <li>T-score ≤ –2.5: {lowT ? "yes" : "no"} · FRAX major ≥ 20%: {highFrax ? "yes" : "no"} · Prior fragility fx: {priorFx ? "yes" : "no"}</li>
        </ul>
      </Recommendation>
    </CalcShell>
  );
}

// ----- Steroid vertebral alert -----
function SteroidAlertCalc({ input }: { input: PatientInput }) {
  const [pain, setPain] = useState(input.spinePainRedFlag);
  const [cord, setCord] = useState(input.cordCompressionSigns);
  const [heightLoss, setHeightLoss] = useState(false);
  const [dose, setDose] = useState(input.prednisoneEquivalentMgPerDay);
  const [dur, setDur] = useState(input.steroidDurationMonths);
  const doseN = parseFloat(dose), durN = parseFloat(dur);
  const flags: string[] = [];
  if (pain) flags.push("New severe thoracolumbar pain");
  if (cord) flags.push("Neurological deficit / cord signs");
  if (heightLoss) flags.push("≥ 2 cm height loss");
  if (!isNaN(doseN) && doseN >= 5) flags.push(`Steroids ${doseN} mg/d`);
  if (!isNaN(durN) && durN >= 3) flags.push(`Duration ${durN} mo`);
  const urgent = cord;
  const suspicious = pain || heightLoss;
  const tone: any = urgent ? "danger" : suspicious ? "warning" : "info";
  const title = urgent ? "Emergency — cord signs" : suspicious ? "Suspicious for vertebral fracture" : "No red flags entered";
  return (
    <CalcShell title="Vertebral-fracture red-flag checker">
      <div className="grid gap-2 sm:grid-cols-2">
        <LabeledInput label="Prednisone-equiv (mg/d)" value={dose} onChange={setDose} inputMode="decimal" />
        <LabeledInput label="Steroid duration (mo)" value={dur} onChange={setDur} inputMode="decimal" />
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2 mt-2">
        <Toggle checked={pain} onChange={setPain} label="New severe thoracolumbar pain" />
        <Toggle checked={cord} onChange={setCord} label="Neurological deficit / cord signs" />
        <Toggle checked={heightLoss} onChange={setHeightLoss} label="≥ 2 cm height loss" />
      </div>
      <Recommendation tone={tone} title={title}>
        {flags.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-muted-foreground">
            {flags.map((f) => <li key={f}>{f}</li>)}
          </ul>
        )}
        <div className="text-xs">
          {urgent
            ? "Immediate in-person assessment: emergency MRI, neurosurgical review. Do not delay for lab work."
            : suspicious
            ? "Discuss urgent spine imaging (X-ray or MRI). Treatment is not delayed once fracture confirmed in high-risk patient."
            : "No urgent-action features on entered data."}
        </div>
      </Recommendation>
    </CalcShell>
  );
}

// ----- Secondary causes -----
function SecondaryCausesCalc({ input }: { input: PatientInput }) {
  const [flags, setFlags] = useState<string[]>(input.secondaryCauseFlags);
  const toggle = (label: string) => setFlags((prev) => prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]);
  const baseline = ["CBC", "CMP (Ca, Cr, ALP)", "25-OH-vitamin D", "PTH", "TSH", "24-h urine Ca/Cr", "HbA1c (if T2DM screening)"];
  const targeted: { flag: string; tests: string }[] = [
    { flag: "Malabsorption / IBD / bariatric", tests: "tissue transglutaminase, faecal elastase, magnesium" },
    { flag: "Multiple myeloma / MGUS", tests: "SPEP, serum free light chains, urine Bence-Jones" },
    { flag: "Hypogonadism / early menopause", tests: "morning testosterone (M), FSH/LH/estradiol (F)" },
    { flag: "Primary hyperparathyroidism", tests: "ionised Ca, PTH, 24-h urine Ca" },
    { flag: "CKD", tests: "eGFR, phosphate, 1,25-(OH)₂-D, PTH" },
    { flag: "Chronic liver disease", tests: "LFTs, INR, albumin" },
  ];
  const suggested = targeted.filter((t) => flags.includes(t.flag));
  return (
    <CalcShell title="Baseline panel & targeted work-up">
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {SECONDARY_CAUSES.map((label) => (
          <Toggle key={label} checked={flags.includes(label)} onChange={() => toggle(label)} label={label} />
        ))}
      </div>
      <Recommendation tone="info" title={`${flags.length} flag(s) selected`}>
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Baseline lab panel</div>
          <ul className="list-disc pl-5 text-xs">{baseline.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
        {suggested.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1 mt-2">Targeted tests</div>
            <ul className="list-disc pl-5 text-xs">
              {suggested.map((s) => <li key={s.flag}><strong>{s.flag}:</strong> {s.tests}</li>)}
            </ul>
          </div>
        )}
        <p className="text-xs text-muted-foreground">T2DM patients may fracture at higher T-scores than the general population — consider treating at less severe DXA thresholds.</p>
      </Recommendation>
    </CalcShell>
  );
}

// ----- Sequencing -----
function SequencingCalc({ input }: { input: PatientInput }) {
  const [drug, setDrug] = useState<CurrentDrug>(input.currentDrug);
  const [years, setYears] = useState("");
  const [fxOnTx, setFxOnTx] = useState(false);
  const yearsN = parseFloat(years);
  let title = "Next step";
  let tone: any = "info";
  let body: React.ReactNode = null;
  if (drug === "teriparatide" || drug === "romosozumab") {
    tone = "warning";
    title = "Anabolic complete → antiresorptive";
    body = <div>Start denosumab 60 mg SC or zoledronate 5 mg IV within ~1 month of last anabolic dose. Do not leave a gap.</div>;
  } else if (drug === "denosumab") {
    tone = "warning";
    title = "Denosumab — plan transition, do not stop";
    body = <div>Bridge with zoledronate 5 mg IV at 6–7 mo after last dose. Number of infusions depends on cumulative denosumab duration and vertebral-fracture history.</div>;
  } else if (drug === "oral-bp" || drug === "iv-zoledronate") {
    const adequate = (drug === "oral-bp" && !isNaN(yearsN) && yearsN >= 5) || (drug === "iv-zoledronate" && !isNaN(yearsN) && yearsN >= 3);
    if (fxOnTx) { tone = "danger"; title = "Fracture on treatment"; body = <div>Escalate: switch to anabolic (teriparatide or romosozumab) for 12–24 mo, then antiresorptive.</div>; }
    else if (adequate) { tone = "info"; title = "Reassess for drug holiday"; body = <div>If risk is now low (T-score better than –2.5, no interim fracture): consider holiday. Recheck DXA in 2 y.</div>; }
    else { tone = "info"; title = "Continue current course"; body = <div>Continue {drug === "oral-bp" ? "oral bisphosphonate" : "zoledronate"} until adequate duration ({drug === "oral-bp" ? "5 y" : "3 y"}) reached.</div>; }
  } else {
    body = <div>No agent selected — start point depends on stratified risk. See Fragility-fracture module.</div>;
  }
  return (
    <CalcShell title="Sequential therapy planner">
      <div className="grid gap-2 sm:grid-cols-3">
        <LabeledSelect label="Current agent" value={drug} onChange={(v) => setDrug(v as CurrentDrug)}
          options={[{value:"none",label:"None"},{value:"oral-bp",label:"Oral bisphosphonate"},{value:"iv-zoledronate",label:"IV zoledronate"},{value:"denosumab",label:"Denosumab"},{value:"teriparatide",label:"Teriparatide/abaloparatide"},{value:"romosozumab",label:"Romosozumab"}]} />
        <LabeledInput label="Years on current agent" value={years} onChange={setYears} inputMode="decimal" />
        <div className="flex items-end"><Toggle checked={fxOnTx} onChange={setFxOnTx} label="Fracture while on treatment" /></div>
      </div>
      <Recommendation tone={tone} title={title}>
        {body}
        <div className="mt-4 p-3 bg-secondary/20 rounded-lg border border-border/20">
          <h5 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
            <Bone className="h-3 w-3" />
            The Bone Crew Mnemonic
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] leading-relaxed">
            <div className="space-y-1">
              <div className="font-bold text-destructive/80">The Destroyers Blocked 🛑 (Anti-Resorptive)</div>
              <div className="italic text-muted-foreground">Mnemonic: DAD blocks the destruction.</div>
              <ul className="list-none pl-0 space-y-0.5">
                <li><strong>D</strong> – Destroyers blocked (Action)</li>
                <li><strong>A</strong> – Alendronate (and other BPs)</li>
                <li><strong>D</strong> – Denosumab</li>
              </ul>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/20 pt-2 md:pt-0 md:pl-4">
              <div className="font-bold text-emerald-600 dark:text-emerald-400">The Builders 🏗️ (Anabolic Agents)</div>
              <div className="italic text-muted-foreground">Mnemonic: Pave the way with TAR.</div>
              <ul className="list-none pl-0 space-y-0.5">
                <li><strong>T</strong> – Teriparatide</li>
                <li><strong>A</strong> – Abaloparatide</li>
                <li><strong>R</strong> – Romosozumab</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/10 text-[9px] text-muted-foreground italic">
            '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            Implement expanded-by-default behavior for the Osteoporosis section and persist the user’s expand/collapse choice across navigation.
          </div>
        </div>
      </Recommendation>
    </CalcShell>
  );
}

// ----- Combination -----
function CombinationCalc({ input }: { input: PatientInput }) {
  const [months, setMonths] = useState("0");
  const monthsN = parseFloat(months);
  const teriRemaining = Math.max(0, 24 - (isNaN(monthsN) ? 0 : monthsN));
  const nextDeno = isNaN(monthsN) ? "—" : `Every 6 months from start (next at month ${Math.ceil((monthsN + 1) / 6) * 6})`;
  return (
    <CalcShell title="Teriparatide + Denosumab (DATA)">
      <div className="grid gap-2 sm:grid-cols-2">
        <LabeledInput label="Months into combination" value={months} onChange={setMonths} inputMode="decimal" />
      </div>
      <Recommendation tone="warning" title="Concurrent regimen (very-high risk only)">
        <ul className="list-disc pl-5 text-xs">
          <li>Teriparatide 20 µg SC daily — {teriRemaining.toFixed(0)} months remaining of the 24-mo course.</li>
          <li>Denosumab 60 mg SC q6mo — {nextDeno}.</li>
          <li>Never mix in one syringe; give at separate sites.</li>
          <li>Combination gives greater BMD gain than either alone (DATA/DATA-Switch).</li>
          <li>After teriparatide stops, continue denosumab indefinitely (or transition to bisphosphonate if stopping later).</li>
        </ul>
      </Recommendation>
    </CalcShell>
  );
}

// ----- Adjuncts, monitoring & holidays -----
function MonitoringCalc({ input }: { input: PatientInput }) {
  const [drug, setDrug] = useState<CurrentDrug>(input.currentDrug);
  const [years, setYears] = useState("");
  const [fxOnTx, setFxOnTx] = useState(false);
  const [tScore, setTScore] = useState(input.femoralNeckTScore);
  const yearsN = parseFloat(years);
  const tN = parseFloat(tScore);
  const holidayApplies = drug === "oral-bp" || drug === "iv-zoledronate";
  const adequate = (drug === "oral-bp" && !isNaN(yearsN) && yearsN >= 5) || (drug === "iv-zoledronate" && !isNaN(yearsN) && yearsN >= 3);
  const lowResidual = !isNaN(tN) && tN > -2.5 && !fxOnTx;
  const eligible = holidayApplies && adequate && lowResidual;
  const tone: any = eligible ? "success" : holidayApplies ? "info" : "warning";
  const title = eligible ? "Holiday eligible" : holidayApplies ? "Continue — holiday criteria not met" : "No drug-holiday concept";
  return (
    <CalcShell title="Adjuncts, monitoring & drug-holiday eligibility">
      <div className="grid gap-2 sm:grid-cols-3">
        <LabeledSelect label="Current agent" value={drug} onChange={(v) => setDrug(v as CurrentDrug)}
          options={[{value:"none",label:"None"},{value:"oral-bp",label:"Oral bisphosphonate"},{value:"iv-zoledronate",label:"IV zoledronate"},{value:"denosumab",label:"Denosumab"},{value:"teriparatide",label:"Teriparatide"},{value:"romosozumab",label:"Romosozumab"}]} />
        <LabeledInput label="Years on drug" value={years} onChange={setYears} inputMode="decimal" />
        <LabeledInput label="Current FN T-score" value={tScore} onChange={setTScore} inputMode="decimal" />
        <div className="flex items-end sm:col-span-3"><Toggle checked={fxOnTx} onChange={setFxOnTx} label="Fracture while on treatment" /></div>
      </div>
      <Recommendation tone={tone} title={title}>
        <div>
          {eligible
            ? "Consider a 1–2 year holiday. Recheck DXA at 2 y or sooner if new fracture. Restart if T-score falls or a fracture occurs."
            : holidayApplies
            ? `Continue therapy until adequate duration (${drug === "oral-bp" ? "5 y" : "3 y"}) and residual risk is low (T > –2.5, no interim fracture).`
            : "Denosumab and anabolic agents have no drug-holiday. Plan a bisphosphonate bridge/follow-on instead of stopping."}
        </div>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          <li>Calcium 1000–1200 mg/d (diet ± supplement).</li>
          <li>25-OH-vitamin D ≥ 30 ng/mL — supplement 800–2000 IU/d as needed.</li>
          <li>DXA every 1–2 y on therapy, then per response.</li>
          <li>Weight-bearing exercise; smoking / alcohol reduction; fall-prevention review.</li>
        </ul>
      </Recommendation>
    </CalcShell>
  );
}

function ModuleCalculator({ id, input }: { id: string; input: PatientInput }) {
  switch (id) {
    case "module-fragility-fracture": return <FragilityCalc input={input} />;
    case "module-discordance":         return <DiscordanceCalc input={input} />;
    case "module-denosumab-transition":return <DenoTransitionCalc input={input} />;
    case "module-teriparatide-followon":return <TeriFollowOnCalc input={input} />;
    case "module-giop":                return <GiopCalc input={input} />;
    case "module-steroid-alert":       return <SteroidAlertCalc input={input} />;
    case "module-secondary-causes":    return <SecondaryCausesCalc input={input} />;
    case "module-sequencing":          return <SequencingCalc input={input} />;
    case "module-combination":         return <CombinationCalc input={input} />;
    case "module-monitoring-holiday":  return <MonitoringCalc input={input} />;
    default: return null;
  }
}

// ---------- Per-module rich clinical content (educational reference) ----------

function RichSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md border border-border/60 bg-card/40 p-3">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function ModuleRichContent({ id }: { id: string }) {
  const { open: openImage } = useImageViewer();
  if (id === "module-fragility-fracture") {
    return (
      <RichSection title="Full drug-class reference">
        <div className="text-sm text-muted-foreground italic">
          '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            Add an on-hover and on-tap popup that explains the term 'fragility fracture' in the Fragility Fracture module.
        </div>
        <div className="mt-4 border-t pt-4">
          <div 
            className="group relative cursor-zoom-in overflow-hidden rounded-lg border border-border/50 bg-muted/20 transition-all hover:border-primary/30"
            onClick={() => openImage(difficultDiabetesAsset.url, "Structured Hypercortisolism Screen for Refractory T2DM")}
          >
            <img 
              src={difficultDiabetesAsset.url} 
              alt="Structured Hypercortisolism Screen for Refractory T2DM"
              className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
              <div className="rounded-full bg-background/90 p-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground italic leading-relaxed">
            '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
            <br />
            add this image to fragility fractures also
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-border/20">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Very high risk — two-phase</div>
          <KeyRow k="Phase 1 anabolic" v="Romosozumab 210 mg SC monthly × 12 mo · OR teriparatide 20 µg SC daily up to 24 mo · OR abaloparatide 80 µg SC daily up to 24 mo" />
          <KeyRow k="Phase 2 antiresorptive" v="Denosumab 60 mg SC q6mo (indefinite, plan bridge if stopped) · OR zoledronate 5 mg IV yearly × 3 y" />
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-2">
            <img src={veryHighRiskImg.url} alt="Very-high-risk osteoporosis two-phase treatment" className="w-full rounded-md" loading="lazy" />
            <div className="mt-1 text-xs text-muted-foreground">Two-phase approach: anabolic 12–24 mo, then immediate antiresorptive maintenance.</div>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">High risk — potent antiresorptive</div>
          <KeyRow k="Alendronate" v="PO 70 mg once weekly" />
          <KeyRow k="Risedronate" v="PO 35 mg once weekly (or 150 mg once monthly)" />
          <KeyRow k="Ibandronate" v="PO 150 mg once monthly OR IV 3 mg q3mo" />
          <KeyRow k="Zoledronic acid" v="IV 5 mg once yearly (15-min infusion)" />
          <KeyRow k="Denosumab" v="SC 60 mg q6mo — preferred if CrCl < 35" />
        </div>
        <Callout tone="warning" title="Oral bisphosphonate administration">
          Empty stomach, first thing in the morning, with a full glass (200–240 mL) of plain tap water only —
          no coffee, juice, mineral water, food, or other medications. Remain upright (sit/stand) and fast
          for ≥ 30 min (60 min for ibandronate). Ensure calcium 1000–1200 mg/d and vitamin D 800–1000 IU/d.
        </Callout>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cheat sheet — exact criteria for initiating bisphosphonates
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <img
              src={bisphosphonateCriteriaImg.url}
              alt="Cheat sheet: exact clinical criteria for initiating bisphosphonates — primary osteoporosis, GIOP, oncology and mandatory prerequisites"
              className="w-full rounded-md"
              loading="lazy"
            />
            <div className="mt-1 text-xs text-muted-foreground">
              ACP / BHOF / ACR thresholds: T ≤ –2.5, any hip or vertebral fragility fracture, or osteopenia with
              FRAX ≥ 3% hip / ≥ 20% major. Check CrCl &gt; 30–35 mL/min, normal corrected Ca + vitamin D, and
              oesophageal suitability before prescribing.
            </div>
          </div>
        </div>
        <Callout tone="info" title="Which T-score to enter?">
          Use the femoral-neck (or total-hip) T-score — the FRAX index site. Never substitute the lowest,
          maximum, or fracture-site T-score. Handle spine–hip discordance with the up-adjust rule.
        </Callout>

      </RichSection>
    );
  }

  if (id === "module-secondary-causes") {
    return (
      <RichSection title="Baseline & extended lab panels">
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Baseline — all patients</div>
          <ul className="ml-4 list-disc text-xs space-y-0.5">
            <li>CBC · CMP (Ca, phosphate, albumin, Cr, LFTs)</li>
            <li>25-OH vitamin D · Intact PTH · TSH</li>
            <li>ESR / CRP · 24-h urine calcium + creatinine</li>
            <li>HbA1c (screen for T2DM)</li>
            <li>SPEP + serum free light chains if age &gt; 50 or unexplained fracture / anemia / ↑ESR</li>
            <li>Testosterone (men) · FSH/LH/estradiol (women where indicated)</li>
          </ul>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Extended — if clinically indicated</div>
          <ul className="ml-4 list-disc text-xs space-y-0.5">
            <li>Hemoglobin electrophoresis — anemia / ethnic risk</li>
            <li>Iron studies (ferritin, TSAT) — anemia workup</li>
            <li>Morning cortisol ± low-dose DST — Cushing / long-term steroids</li>
            <li>Free T4 — thyroid disease</li>
            <li>24-h urine free cortisol — Cushing</li>
            <li>Tryptase — mastocytosis</li>
            <li>HIV serology — if risk factors</li>
          </ul>
        </div>
        <Callout tone="warning" title="T2DM-specific caveat">
          In T2DM, DXA T-score underestimates fracture risk. Treat at higher T-scores (e.g. ≤ –2.0) and lower FRAX thresholds. Avoid TZDs; optimise glycaemia and fall risk (hypoglycaemia, neuropathy, vision).
        </Callout>
      </RichSection>
    );
  }

  if (id === "module-discordance") {
    return (
      <RichSection title="IOF / ESCEO discordance rule">
        <ul className="ml-4 list-disc text-sm space-y-1">
          <li>If lumbar spine ≥ 1 SD lower than hip: keep the hip T-score in FRAX, but up-adjust reported risk one step (moderate→high, high→very high).</li>
          <li>Never substitute the spine, lowest, maximum, or fracture-site T-score into FRAX — this changes calibration and is not evidence-based.</li>
          <li>Peripheral DXA (distal radius) is not the FRAX index site; use it only when hip / spine are non-diagnostic.</li>
        </ul>
        <Callout tone="danger" title="What NOT to do">
          Do not enter the lowest T across sites; do not enter the maximum; do not enter the distal-radius T-score just because the fracture was in the radius.
        </Callout>
      </RichSection>
    );
  }

  if (id === "module-giop") {
    return (
      <RichSection title="ACR 2022 GIOP quick algorithm">
        <GiopApp />
        <Callout tone="info" title="Universal measures for anyone on systemic steroids">
          Calcium 1000–1200 mg/d, vitamin D 800–2000 IU/d (target 25-OH-D ≥ 30 ng/mL), weight-bearing exercise, fall-prevention, and steroid-minimisation strategy.
        </Callout>
      </RichSection>
    );
  }

  if (id === "module-steroid-alert") {
    return (
      <RichSection title="Immediate actions & work-up">
        <ul className="ml-4 list-disc text-sm space-y-1">
          <li>Spine MRI (T + L) — confirm acute/subacute VCF, marrow oedema, canal compromise; exclude mimics.</li>
          <li>DXA to stage GIOP — do NOT delay treatment if high-risk.</li>
          <li>Labs: Ca, PO₄, ALP, 25-OH-D, PTH, Cr/eGFR, CBC, ESR/CRP, SPEP + free light chains.</li>
          <li>Multimodal analgesia: paracetamol ± short NSAID (if GI/renal OK) ± opioid for breakthrough.</li>
          <li>Avoid flexion / axial loading; consider TLSO short-term if multilevel.</li>
        </ul>
        <Callout tone="danger" title="Treat as fragility fracture — do not wait for DXA">
          ≥ 7.5 mg prednisolone-equivalent for ≥ 3 months + acute severe pain or codfish vertebrae: start bone protection now (oral bisphosphonate + Ca/vit D), image the spine, manage pain aggressively.
        </Callout>
        <Callout tone="info" title="Disease-modifying therapy">
          <div className="text-xs space-y-1">
            <div><b>First-line:</b> oral bisphosphonate (alendronate/risedronate) + Ca 1000–1200 mg/d + vit D 800–1000 IU/d.</div>
            <div><b>Consider anabolic (teriparatide):</b> multiple VCFs, T ≤ −3.5, or bisphosphonate failure/intolerance.</div>
            <div><b>Refractory pain / painful VCF:</b> vertebroplasty or kyphoplasty after MDT review.</div>
            <div><b>Steroid strategy:</b> minimise dose / steroid-sparing agent; if tapering below physiologic dose, screen for adrenal suppression and issue sick-day rules + emergency steroid card.</div>
          </div>
        </Callout>
        
        <div className="mt-4 border-t pt-4">
          <div className="text-sm font-semibold mb-2">'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            Implement expanded-by-default behavior for the Osteoporosis section and persist the user’s expand/collapse choice across navigation.</div>


          
          <SectionCard
            id="bone-antiresorptive-caveat"
            title="Bone Antiresorptive Agents clinical caveat"
            icon={<ShieldAlert className="h-4 w-4" />}
            defaultOpen={false}
            className="bg-muted/30"
          >
            <div className="space-y-4 text-sm">
              <Callout tone="danger" title="⚠ Never stop denosumab without a bridge">
                Discontinuation causes rapid BMD loss and a spike in <b>multiple vertebral fractures</b> within 6–18 months. There is <b>no drug holiday</b> for denosumab — every patient needs a follow-on antiresorptive.
              </Callout>

              <div>
                <div className="font-semibold text-primary mb-1">The Bone Crew Mnemonic</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border p-2 bg-background/50">
                    <div className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-1">The Destroyers Blocked 🛑 (Anti-Resorptive)</div>
                    <div className="text-xs italic mb-1">Mnemonic: DAD blocks the destruction.</div>
                    <ul className="text-xs space-y-0.5">
                      <li><strong>D</strong> – Destroyers blocked (Action)</li>
                      <li><strong>A</strong> – Alendronate (and other bisphosphonates)</li>
                      <li><strong>D</strong> – Denosumab</li>
                    </ul>
                  </div>
                  <div className="rounded-md border p-2 bg-background/50">
                    <div className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-1">The Builders 🏗️ (Anabolic Agents)</div>
                    <div className="text-xs italic mb-1">Mnemonic: Pave the way with TAR.</div>
                    <ul className="text-xs space-y-0.5">
                      <li><strong>T</strong> – Teriparatide</li>
                      <li><strong>A</strong> – Abaloparatide</li>
                      <li><strong>R</strong> – Romosozumab</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-primary mb-1">Denosumab Transition Protocols</div>
                <div className="text-xs space-y-2 text-muted-foreground">
                  <p><strong>Zoledronate Bridge:</strong> 5 mg IV at 6 months after last dose (no later than 7–9 mo). Long-duration exposure (≥ 2.5y) often needs 2 infusions (0 and 6 mo).</p>
                  <p><strong>Oral BP Bridge:</strong> Alendronate 70 mg weekly starting at 6 mo after last dose; continue ≥ 12–24 months.</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="frag-fx-guide-section"
            title="Fragility Fractures (moderate risk) guide"
            icon={<Bone className="h-4 w-4" />}
            defaultOpen={false}
            className="mt-2"
          >
            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-2">
              <ImageViewerTrigger src={fragFxGuideImg.url} alt="Osteoporosis Fragility Fracture First-Line Treatment Guide">
                <img src={fragFxGuideImg.url} alt="Osteoporosis Fragility Fracture First-Line Treatment Guide" className="w-full rounded-md cursor-zoom-in" loading="lazy" />
              </ImageViewerTrigger>
              <div className="mt-1 text-xs text-muted-foreground text-center italic">'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            Implement expanded-by-default behavior for the Osteoporosis section and persist the user’s expand/collapse choice across navigation.</div>
            </div>

          </SectionCard>
        </div>
      </RichSection>
    );
  }


  if (id === "module-denosumab-transition") {
    return (
      <RichSection title="Bridging schedule, monitoring & safety">
        <Callout tone="danger" title="⚠ Never stop denosumab without a bridge">
          Discontinuation causes rapid BMD loss and a spike in <b>multiple vertebral fractures</b> within 6–18 months, especially after ≥ 2–3 years of therapy. There is <b>no drug holiday</b> for denosumab — every patient needs a follow-on antiresorptive.
        </Callout>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">IV zoledronate bridge (preferred)</div>
          <KeyRow k="Timing" v="5 mg IV at 6 months after last denosumab dose (no later than 7–9 mo)." />
          <KeyRow k="Pre-dose" v="25-OH-D ≥ 30 ng/mL, corrected Ca normal, CrCl ≥ 35, hydrate, dental clearance." />
          <KeyRow k="After 1st ZOL" v="CTX at 3 & 6 mo; if CTX rises above pre-menopausal range or BMD falls → repeat ZOL at ~6 mo." />
          <KeyRow k="Long-duration (≥ 2.5 y)" v="Often needs 2 zoledronate infusions (0 and ~6 mo) to fully suppress rebound turnover." />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Oral BP bridge (CrCl &lt; 35 or ZOL intolerance)</div>
          <KeyRow k="Regimen" v="Alendronate 70 mg PO weekly (or risedronate) starting at 6 mo after last denosumab dose." />
          <KeyRow k="Duration" v="≥ 12–24 months; less effective than IV ZOL at blunting rebound." />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Monitoring</div>
          <KeyRow k="Baseline" v="Corrected Ca, PO₄, 25-OH-D, PTH, creatinine/CrCl, CTX or P1NP, DXA (LS + hip)." />
          <KeyRow k="After each dose" v="Corrected Ca + creatinine at 2 weeks (hypocalcaemia risk, esp. if CrCl low)." />
          <KeyRow k="3 & 6 mo after bridge" v="CTX (keep low pre-menopausal range) ± P1NP; corrected Ca." />
          <KeyRow k="12 mo" v="Repeat DXA — any BMD loss &gt; least significant change ⇒ re-dose ZOL." />
        </div>
        <Callout tone="danger" title="Safety warnings">
          <ul className="ml-4 list-disc text-xs space-y-0.5">
            <li><b>Do NOT</b> delay &gt; 7 mo from last dose; do not substitute SERM/HRT/calcitonin for a bisphosphonate; do not use anabolic (teriparatide/romo) as the bridge — they do not prevent rebound.</li>
            <li><b>Hypocalcaemia:</b> correct vitamin D & calcium BEFORE ZOL; higher risk with CKD, malabsorption, hypoparathyroidism.</li>
            <li><b>ONJ / atypical femur fx:</b> dental clearance before ZOL; counsel on thigh/groin pain.</li>
            <li><b>Pregnancy:</b> denosumab & bisphosphonates contraindicated; counsel women of reproductive age.</li>
            <li><b>Red flags:</b> new back pain after stopping denosumab ⇒ urgent spine imaging for occult vertebral fractures.</li>
          </ul>
        </Callout>
      </RichSection>
    );
  }

  if (id === "module-teriparatide-followon") {
    return (
      <RichSection title="Anabolic → antiresorptive handover">
        <Callout tone="warning" title="Sequencing principle">
          Do <b>not</b> start denosumab or zoledronate <b>before</b> or <b>during</b> teriparatide as routine sequencing — potent antiresorptives blunt the anabolic response (especially at the hip). Complete up to 24 months of teriparatide, then transition immediately. Treatment gaps cause rapid loss of the gains.
        </Callout>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Teriparatide phase (Days 0 – ≈720)</div>
          <KeyRow k="Dose" v="Teriparatide 20 µg SC once daily; lifetime max 24 months." />
          <KeyRow k="Adjuncts" v="Calcium 1000–1200 mg/d + vitamin D 800–1000 IU/d (target 25-OH-D ≥ 30)." />
          <KeyRow k="Monitor" v="Serum Ca early (hypercalcaemia risk), orthostatic symptoms, injection technique." />
          <KeyRow k="Reassess" v="BMD / fracture risk typically at 12 and 24 months per local protocol." />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Follow-on options</div>
          <KeyRow k="Denosumab" v="60 mg SC — start within 1 mo of last teriparatide; continue q6mo indefinitely (no holiday, plan bridge if stopped)." />
          <KeyRow k="Zoledronate" v="5 mg IV — start within 1 mo; repeat annually × 3 y (up to 6 y for very high risk), then reassess for holiday. Requires CrCl ≥ 35 and corrected Ca / vit D normal." />
          <KeyRow k="Oral BP" v="Alendronate 70 mg weekly or risedronate 35 mg weekly — acceptable alternative if IV/denosumab not feasible." />
        </div>
        <Callout tone="danger" title="If denosumab must ever be stopped">
          Plan a bisphosphonate bridge (see Denosumab stop / transition module) to prevent rebound vertebral fractures.
        </Callout>
      </RichSection>
    );
  }

  if (id === "module-combination") {
    return (
      <RichSection title="Teriparatide + Denosumab (DATA study rationale)">
        <Callout tone="info" title="When to consider">
          Very-high fracture-risk osteoporosis where maximal and rapid BMD gain is desired (multiple vertebral fractures, T ≪ −3, imminent-fracture risk). Both drugs run on their standard schedules — <b>never mixed in one syringe</b>.
        </Callout>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <div className="mb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Teriparatide (Forteo)</div>
            <KeyRow k="Dose" v="20 µg SC once daily" />
            <KeyRow k="Route" v="Self-injection at home (prefilled pen)" />
            <KeyRow k="Duration" v="Up to 24 months (lifetime max)" />
          </div>
          <div>
            <div className="mb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Denosumab (Prolia)</div>
            <KeyRow k="Dose" v="60 mg SC every 6 months" />
            <KeyRow k="Route" v="Given in clinic by a healthcare professional" />
            <KeyRow k="Overlap" v="12–24 months of concurrent combination therapy" />
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Mechanism & outcome</div>
          <KeyRow k="Traditional issue" v="Most antiresorptives blunt the anabolic effect, limiting new bone formation." />
          <KeyRow k="Denosumab role" v="Profoundly suppresses resorption while still permitting teriparatide-driven formation." />
          <KeyRow k="Expected outcome" v="Greater/faster spine & hip BMD gains than either drug alone (DATA / DATA-Switch)." />
        </div>
        <Callout tone="warning" title="Post-combination strategy — do NOT stop all therapy">
          When teriparatide is discontinued (~24 mo), <b>continue an antiresorptive</b> (denosumab or a potent bisphosphonate) to lock in the accrued bone mass. If denosumab is later stopped, plan a bisphosphonate bridge.
        </Callout>
        <Callout tone="info" title="Bone-turnover markers — not required to start therapy">
          CTX / P1NP / osteocalcin are <b>not mandatory</b> before starting teriparatide or denosumab. Highly variable between individuals and assays; pretreatment values do not reliably predict fracture progression. Focus on vitamin D / calcium, ruling out secondary causes, and documenting BMD and fracture status.
        </Callout>
      </RichSection>
    );
  }

  if (id === "module-sequencing") {
    return (
      <RichSection title="Long-term sequencing principles">
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Very high / imminent risk</div>
          <KeyRow k="Start" v="Anabolic (romosozumab 12 mo · OR teriparatide/abaloparatide up to 24 mo)." />
          <KeyRow k="Follow-on" v="Antiresorptive within 1 mo of anabolic completion — denosumab q6mo OR zoledronate 5 mg IV yearly." />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">High risk</div>
          <KeyRow k="First line" v="Potent antiresorptive (zoledronate IV yearly or denosumab SC q6mo)." />
          <KeyRow k="Alternative" v="Oral bisphosphonate weekly." />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Low / moderate risk</div>
          <KeyRow k="First line" v="Oral bisphosphonate weekly; reassess after 3–5 y." />
          <KeyRow k="Reassess" v="If risk now low: consider holiday. If persistent high risk: extend BP or switch to denosumab/anabolic." />
        </div>
        <Callout tone="warning" title="Never leave gaps">
          Denosumab: no holiday — always bridge with bisphosphonate. Anabolic: always followed by antiresorptive within 1 month. Fracture on treatment ⇒ escalate to anabolic.
        </Callout>
      </RichSection>
    );
  }

  if (id === "module-monitoring-holiday") {
    return (
      <RichSection title="Adjuncts, monitoring & drug-holiday reference">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Universal adjuncts</div>
            <KeyRow k="Calcium" v="1000–1200 mg/d (diet + supplement)" />
            <KeyRow k="Vitamin D" v="800–1000 IU/d; target 25-OH-D ≥ 30 ng/mL" />
            <KeyRow k="Exercise" v="Weight-bearing + resistance 3×/wk" />
            <KeyRow k="Fall prevention" v="Home safety, vision, sedative review" />
          </div>
          <div>
            <div className="mb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Follow-up</div>
            <KeyRow k="6–12 mo" v="DXA (LS + hip), CTX/P1NP, adherence check" />
            <KeyRow k="1–2 y" v="Repeat DXA; reassess risk / holiday" />
            <KeyRow k="Suboptimal" v="Check adherence, secondary causes; switch PO→IV or antiresorptive→anabolic" />
          </div>
        </div>
        <Callout tone="info" title="Drug holidays">
          <KeyRow k="Oral BP" v="~5 y therapy → 1–2 y holiday if risk no longer very high" />
          <KeyRow k="Zoledronic acid" v="~3 y therapy → 2–3 y holiday if risk lowered" />
          <KeyRow k="Denosumab" v="No holiday — transition to bisphosphonate bridge" />
          <KeyRow k="Anabolic" v="Teriparatide/abalo 2 y · romo 1 y → antiresorptive follow-on" />
        </Callout>
        <Callout tone="danger" title="Key contraindications">
          <ul className="ml-4 list-disc text-xs space-y-0.5">
            <li>Romosozumab — MI or stroke within 1 year</li>
            <li>Bisphosphonates — CrCl &lt; 35 mL/min</li>
            <li>Oral BP — severe oesophageal disease / inability to sit upright 30 min</li>
            <li>Teriparatide / abaloparatide — skeletal malignancy or prior skeletal RT</li>
            <li>Denosumab — never stop without a bisphosphonate transition</li>
          </ul>
        </Callout>
      </RichSection>
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("opensection", { detail: { id } }));
    }
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
          '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            remove this text "Important — read before use

This tool is for informational and educational purposes only. It does not provide medical diagnosis, treatment, or emergency advice, and it does not replace clinical judgement. Always consult a qualified clinician before making medical decisions. All entries are manual; no data is transmitted or stored on a server."
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
        id="frax-decision-flow"
        title="FRAX-based treatment decision flow"
        subtitle="Enter FRAX probabilities, T-score and risk flags for a risk tag and next steps"
        icon={<Compass className="h-4 w-4" />}
        defaultOpen={true}
      >
        <FraxDecisionFlow />
      </SectionCard>

      <SectionCard
        id="osteo-dosing-quickcards"
        title="Dosing quickcards"
        subtitle="Bisphosphonates, denosumab, teriparatide/abaloparatide and romosozumab — route, frequency, warnings"
        icon={<Syringe className="h-4 w-4" />}
        defaultOpen={false}
      >
        <DosingQuickcards />
      </SectionCard>

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
