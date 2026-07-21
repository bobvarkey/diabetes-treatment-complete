import * as React from "react";
import { AlertTriangle, BookOpen, ShieldAlert, Bone, FlaskConical, GitBranch, Activity, Syringe, ArrowRight, Layers, ClipboardList } from "lucide-react";
import { SectionCard, Callout } from "./shared";

/**
 * Fragility Fracture Osteoporosis Navigator (v1.0.0)
 *
 * Educational clinical decision-support navigator. Manual-entry only,
 * offline-first, no diagnosis or treatment-directive language. Mirrors the
 * simplified app spec: a single overview of ten osteoporosis learning
 * modules with a persistent safety disclaimer.
 */

const DISCLAIMER =
  "This tool is for informational and educational purposes only. It does not provide medical diagnosis, treatment, or emergency advice, and it does not replace clinical judgement. Always consult a qualified clinician before making medical decisions. All entries are manual; no personal health data is transmitted or stored on a server.";

interface ModuleItem {
  id: string;
  title: string;
  blurb: string;
  learn: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const MODULES: ModuleItem[] = [
  {
    id: "fragility",
    title: "Osteoporosis after a fragility fracture",
    blurb:
      "Framework for stratifying fracture risk (moderate / high / very high) after a low-energy fracture, and where common first-line agents sit in guideline pathways (IOF/ESCEO 2019, AACE/ACE 2020, AO Foundation).",
    learn: [
      "How fracture type, index-site T-score and FRAX inputs combine into a risk band.",
      "Why the femoral-neck (or total-hip) T-score is the FRAX index site — not the lowest or fracture-site value.",
      "How guideline groups position bisphosphonates, denosumab and anabolic agents by risk band.",
    ],
    icon: Bone,
  },
  {
    id: "secondary",
    title: "Secondary causes & baseline labs",
    blurb:
      "Common secondary contributors to low bone mass and the baseline lab panel typically discussed before starting bone therapy. Includes T2DM as an independent risk factor even at higher T-scores.",
    learn: [
      "Categories of secondary causes: endocrine, GI/malabsorptive, drug-induced, haematologic, renal/hepatic.",
      "A generic baseline panel (CBC, CMP, 25-OH-D, PTH, TSH, urine Ca/Cr, HbA1c) and when targeted add-ons are commonly considered.",
      "Why T2DM patients may fracture at higher T-scores than the general population.",
    ],
    icon: FlaskConical,
  },
  {
    id: "sequencing",
    title: "Sequential osteoporosis therapy",
    blurb:
      "Concepts behind long-term sequencing of anabolic and antiresorptive agents, and why order and continuity matter.",
    learn: [
      "General principle: anabolic first for very-high risk, followed by an antiresorptive to preserve gains.",
      "Why gaps between agents can erode BMD improvements.",
      "How guideline-based reassessment points (BMD, fracture events) inform next-step discussions with a clinician.",
    ],
    icon: GitBranch,
  },
  {
    id: "steroid-vcf",
    title: "Steroid-induced vertebral fragility fracture — recognition",
    blurb:
      "Educational overview of clinical clues that raise suspicion for a vertebral fragility fracture in a patient on chronic glucocorticoids.",
    learn: [
      "Typical clues: new severe thoracolumbar pain, height loss, codfish-vertebra morphology on imaging.",
      "Red-flag features that warrant urgent clinician review (neurological deficit, systemic symptoms).",
      "Why imaging and specialist input are needed before making any treatment decision.",
    ],
    icon: AlertTriangle,
  },
  {
    id: "giop",
    title: "GIOP — quick algorithm concepts",
    blurb:
      "High-level view of the ACR 2022 glucocorticoid-induced osteoporosis framework: universal measures, when risk assessment is prompted, and the drug classes referenced in the guideline.",
    learn: [
      "Universal measures referenced for anyone on systemic steroids (calcium, vitamin D, exercise, fall reduction).",
      "How steroid dose and duration feed into fracture-risk estimation.",
      "Which drug classes appear in the guideline as options — actual selection is a clinician decision.",
    ],
    icon: ClipboardList,
  },
  {
    id: "discordance",
    title: "Spine–hip discordance",
    blurb:
      "Why FRAX inputs are calibrated to the femoral-neck (or total-hip) T-score, and how guidelines suggest handling large spine–hip differences without swapping the FRAX input.",
    learn: [
      "The IOF/ESCEO rule of thumb: if the spine T-score is markedly lower than the hip, keep the hip value in FRAX and up-adjust the reported risk category one step qualitatively.",
      "Why substituting the lowest or fracture-site T-score into FRAX changes its calibration.",
      "Why peripheral (e.g. distal-radius) DXA is not the FRAX index site.",
    ],
    icon: Layers,
  },
  {
    id: "denosumab-stop",
    title: "Denosumab stop / transition — concepts",
    blurb:
      "Educational summary of why denosumab is not treated as a drug with a 'holiday' and why guideline groups (ECTS, ASBMR) discuss follow-on antiresorptive bridging.",
    learn: [
      "Rebound bone loss and multiple-vertebral-fracture risk described in the literature after discontinuation.",
      "General timing concept: a follow-on antiresorptive is typically considered around the time the next scheduled dose would have been due.",
      "Why any transition plan should be made with a clinician who can review renal function, calcium, vitamin D and dental status.",
    ],
    icon: ShieldAlert,
  },
  {
    id: "after-teriparatide",
    title: "After teriparatide → antiresorptive",
    blurb:
      "Why the anabolic-to-antiresorptive handover matters, and the general principle of avoiding a treatment gap after finishing teriparatide.",
    learn: [
      "Rapid BMD loss described when no antiresorptive follows teriparatide (e.g. DATA-Switch).",
      "General concept: complete the anabolic course, then transition to an antiresorptive under clinician guidance.",
      "Monitoring points typically discussed (BMD, calcium, vitamin D).",
    ],
    icon: ArrowRight,
  },
  {
    id: "combo",
    title: "Teriparatide + denosumab — concept",
    blurb:
      "Overview of the DATA / DATA-Switch rationale for concurrent anabolic and antiresorptive therapy in very-high fracture-risk scenarios.",
    learn: [
      "Why combining an anabolic with a potent antiresorptive was studied for maximal BMD gain.",
      "Both agents run on their own standard schedules — never mixed in a single injection.",
      "Bone-turnover markers are not required to start therapy and have limited predictive value at baseline.",
    ],
    icon: Syringe,
  },
  {
    id: "adjuncts",
    title: "Adjuncts, monitoring & drug-holiday concepts",
    blurb:
      "Universal adjuncts (calcium, vitamin D, weight-bearing exercise, fall prevention) and a high-level view of how drug-holiday concepts differ between agent classes.",
    learn: [
      "Typical adjunct targets referenced in guidelines (calcium 1000–1200 mg/d, 25-OH-D ≥ 30 ng/mL).",
      "Drug-holiday concept applies to bisphosphonates only; denosumab and anabolic agents are handled differently.",
      "Monitoring themes: DXA cadence, adherence review, and periodic risk reassessment.",
    ],
    icon: Activity,
  },
];

function ModuleCard({ m }: { m: ModuleItem }) {
  const Icon = m.icon;
  return (
    <SectionCard id={`osteo-${m.id}`} title={m.title} icon={<Icon className="h-4 w-4" />} defaultOpen={false}>
      <p className="text-sm text-muted-foreground">{m.blurb}</p>
      <div className="mt-3">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
          What this module covers
        </div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {m.learn.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
      <Callout tone="info" title="Educational only">
        This module summarises published guideline concepts for learning. It does not recommend a diagnosis, drug or
        dose for any individual patient. Any clinical decision must be made by a qualified clinician using the full
        patient context.
      </Callout>
    </SectionCard>
  );
}

export default function OsteoporosisApp() {
  return (
    <div className="space-y-4">
      <SectionCard
        id="osteo-overview"
        title="Fragility Fracture Osteoporosis Navigator"
        icon={<BookOpen className="h-4 w-4" />}
        defaultOpen
      >
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">v1.0.0 · Educational navigator</span> for osteoporosis,
          fragility fracture, GIOP, sequencing and transition concepts. Manual entry only, offline-first, no data
          transmitted.
        </div>

        <Callout tone="warn" title="Important — read before use">
          {DISCLAIMER}
        </Callout>

        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Guideline sources referenced
          </div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>IOF / ESCEO 2019–2020</li>
            <li>AACE / ACE 2020 postmenopausal osteoporosis update</li>
            <li>AO Foundation fragility-fracture pathway</li>
            <li>ACR 2022 glucocorticoid-induced osteoporosis</li>
            <li>ECTS / ASBMR denosumab discontinuation position papers</li>
            <li>DATA / DATA-Switch (teriparatide + denosumab sequencing)</li>
          </ul>
        </div>

        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">How to use</div>
          <p className="text-sm text-muted-foreground">
            Expand any module below to read a short educational summary of the concept, the key learning points and a
            reminder that any real-world decision needs a clinician. Modules are independent — read them in any order.
          </p>
        </div>
      </SectionCard>

      {MODULES.map((m) => (
        <ModuleCard key={m.id} m={m} />
      ))}

      <SectionCard id="osteo-safety" title="Safety & scope" icon={<ShieldAlert className="h-4 w-4" />} defaultOpen={false}>
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
