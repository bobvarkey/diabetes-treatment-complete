import { useState } from "react";
import {
  Activity, AlertTriangle, Heart, Pill, Droplets, Beaker,
  ChevronDown, ChevronRight, FlaskConical,
} from "lucide-react";
import { SectionCard, KeyRow, Callout } from "./shared";

/* ────────────────────────────────────────────────
   Lipid panel reference
   ──────────────────────────────────────────────── */

const LIPID_TARGETS = [
  { risk: "Very high",     LDL: "< 55 mg/dL (↓ ≥50%)", nonHDL: "< 85 mg/dL", ApoB: "< 55 mg/dL", Lp_a: "< 50 mg/dL" },
  { risk: "High",         LDL: "< 70 mg/dL (↓ ≥50%)", nonHDL: "< 100 mg/dL", ApoB: "< 70 mg/dL", Lp_a: "< 50 mg/dL" },
  { risk: "Moderate",     LDL: "< 100 mg/dL",          nonHDL: "< 130 mg/dL", ApoB: "< 90 mg/dL", Lp_a: "< 50 mg/dL" },
  { risk: "Low",          LDL: "< 130 mg/dL",          nonHDL: "< 160 mg/dL", ApoB: "< 100 mg/dL", Lp_a: "< 50 mg/dL" },
];

const STATIN_CLASSES: [string, string, string, string][] = [
  ["High-intensity", "Atorvastatin 40–80 mg", "Rosuvastatin 20–40 mg", "↓ LDL ≥50%"],
  ["Moderate-intensity", "Atorvastatin 10–20 mg", "Rosuvastatin 5–10 mg", "↓ LDL 30–49%"],
  ["Moderate-intensity", "Simvastatin 20–40 mg", "Pravastatin 40–80 mg", "↓ LDL 30–49%"],
  ["Low-intensity", "Simvastatin 10 mg", "Pravastatin 10–20 mg", "↓ LDL <30%"],
];

const DRUG_TABLE: [string, string, string, string][] = [
  ["Statins", "↓ LDL 25–55%", "First-line; pleiotropic CV benefit", "Myalgia, ↑ LFTs, ↑ CK (rare rhabdo)"],
  ["Ezetimibe", "↓ LDL 15–20%", "Add-on to statin; monotherapy if intolerant", "Minimal; GI upset"],
  ["PCSK9i (evolocumab / alirocumab)", "↓ LDL 50–60%", "FH, ASCVD not at goal on max statin + ezetimibe", "Injection site; rare neutralizing Ab"],
  ["Inclisiran", "↓ LDL 50–55%", "siRNA; twice-yearly dosing; same indication as PCSK9i", "Injection site; long-term safety data accumulating"],
  ["Bempedoic acid", "↓ LDL 15–25%", "Statin-intolerant; add-on; also ↓ hsCRP", "↑ Uric acid, ↑ LFTs; avoid with eGFR <30"],
  ["Icosapent ethyl (EPA 4 g/d)", "↓ TG 20–25%", "CV risk reduction in TG 150–499 + ASCVD/DM", "↑ AF risk; no ↑ bleeding in RCTs"],
  ["Fibrates", "↓ TG 30–50%", "Severe hypertriglyceridemia (>500) to prevent pancreatitis", "Dyspepsia, gallstones; ↑ Cr"],
  ["Omega-3 (OTC)", "↓ TG 5–10%", "Not a substitute for icosapent ethyl", "Fishy burp; minimal efficacy at OTC doses"],
];

const FH_CRITERIA = [
  ["Dutch Lipid Clinic (DLCN)", "≥8 definite, 6–7 probable, 3–5 possible", "LDL, tendon xanthomata, family history, premature CAD"],
  ["Simon Broome (UK)", "Definite: LDL >190 + tendon xanthomata", "Also uses family history of premature CHD"],
  ["MEDPED (US)", "Age/sex-specific LDL thresholds", "Simpler; no physical exam required"],
];

/* ────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────── */

function RiskStratification() {
  return (
    <SectionCard title="ASCVD risk categories" icon={<Heart className="h-5 w-5" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Risk</th>
              <th className="p-2">Definition</th>
              <th className="p-2">LDL target</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="p-2 font-medium text-red-600 dark:text-red-400">Very high</td>
              <td className="p-2 text-xs">Established ASCVD, HF, CKD (eGFR &lt;60 or ACR ≥30), ≥3 major risk factors, or DM with TOD</td>
              <td className="p-2 font-mono">&lt; 55 mg/dL</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-2 font-medium text-orange-600 dark:text-orange-400">High</td>
              <td className="p-2 text-xs">DM ≥10 yr without TOD + ≥1 risk factor, or severe single risk factor (LDL &gt;190, BP &gt;160/100)</td>
              <td className="p-2 font-mono">&lt; 70 mg/dL</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-2 font-medium text-yellow-600 dark:text-yellow-400">Moderate</td>
              <td className="p-2 text-xs">Young T1DM &lt;10 yr, T2DM &lt;10 yr, no other risk factors</td>
              <td className="p-2 font-mono">&lt; 100 mg/dL</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-2 font-medium text-green-600 dark:text-green-400">Low</td>
              <td className="p-2 text-xs">No risk factors, no DM, no ASCVD</td>
              <td className="p-2 font-mono">&lt; 130 mg/dL</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function LipidTargetsTable() {
  return (
    <SectionCard title="Lipid targets by risk category" icon={<Beaker className="h-5 w-5" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Risk</th>
              <th className="p-2">LDL-C</th>
              <th className="p-2">Non-HDL-C</th>
              <th className="p-2">ApoB</th>
              <th className="p-2">Lp(a)</th>
            </tr>
          </thead>
          <tbody>
            {LIPID_TARGETS.map((r) => (
              <tr key={r.risk} className="border-t border-border">
                <td className="p-2 font-medium">{r.risk}</td>
                <td className="p-2 font-mono text-xs">{r.LDL}</td>
                <td className="p-2 font-mono text-xs">{r.nonHDL}</td>
                <td className="p-2 font-mono text-xs">{r.ApoB}</td>
                <td className="p-2 font-mono text-xs">{r.Lp_a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Non-HDL = total cholesterol − HDL. ApoB preferred when available (especially in DM, obesity, MetS).
        Lp(a) measured once; if ≥50 mg/dL, intensify LDL therapy.
      </p>
    </SectionCard>
  );
}

function StatinIntensity() {
  return (
    <SectionCard title="Statin intensity classification" icon={<Pill className="h-5 w-5" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Intensity</th>
              <th className="p-2">Atorvastatin</th>
              <th className="p-2">Rosuvastatin</th>
              <th className="p-2">LDL reduction</th>
            </tr>
          </thead>
          <tbody>
            {STATIN_CLASSES.map(([int, ato, rosu, red], i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-2 font-medium">{int}</td>
                <td className="p-2 font-mono text-xs">{ato}</td>
                <td className="p-2 font-mono text-xs">{rosu}</td>
                <td className="p-2 font-mono text-xs">{red}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout tone="info" title="Statin selection in diabetes">
        All adults with DM aged 40–75 yr should receive at least moderate-intensity statin regardless of baseline LDL.
        Very high risk → high-intensity statin. If LDL not at target → add ezetimibe → PCSK9i/inclisiran.
      </Callout>
    </SectionCard>
  );
}

function DrugClasses() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="Lipid-lowering drug classes" icon={<FlaskConical className="h-5 w-5" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Drug</th>
              <th className="p-2">LDL reduction</th>
              <th className="p-2">Key role</th>
              <th className="p-2">Adverse effects</th>
            </tr>
          </thead>
          <tbody>
            {DRUG_TABLE.slice(0, expanded ? DRUG_TABLE.length : 5).map(([drug, ldl, role, ae], i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-2 font-medium text-xs">{drug}</td>
                <td className="p-2 font-mono text-xs">{ldl}</td>
                <td className="p-2 text-xs text-muted-foreground">{role}</td>
                <td className="p-2 text-xs text-muted-foreground">{ae}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {expanded ? "Show fewer" : `Show all ${DRUG_TABLE.length} drug classes`}
      </button>
    </SectionCard>
  );
}

function FamilialHypercholesterolemia() {
  return (
    <SectionCard title="Familial hypercholesterolaemia (FH)" icon={<AlertTriangle className="h-5 w-5" />} tone="warning">
      <p className="mb-3 text-sm text-muted-foreground">
        FH affects ~1:250. Suspect if LDL &gt;190 mg/dL + family history of premature CAD. Diagnostic criteria:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">System</th>
              <th className="p-2">Threshold</th>
              <th className="p-2">Components</th>
            </tr>
          </thead>
          <tbody>
            {FH_CRITERIA.map(([sys, thresh, comp], i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-2 font-medium text-xs">{sys}</td>
                <td className="p-2 text-xs">{thresh}</td>
                <td className="p-2 text-xs text-muted-foreground">{comp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout tone="info" title="FH management">
        High-intensity statin + ezetimibe first-line. If not at goal → PCSK9i or inclisiran. Screen first-degree relatives.
        Cascade testing is cost-effective.
      </Callout>
    </SectionCard>
  );
}

function SpecialPopulations() {
  return (
    <SectionCard title="Special populations" icon={<Activity className="h-5 w-5" />}>
      <div className="space-y-3">
        <div>
          <h4 className="mb-1 text-sm font-semibold">Diabetes + CKD</h4>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            <li>Statin + ezetimibe first-line (SHARP, EMPA-KIDNEY lipid substudy)</li>
            <li>Atorvastatin safe at any eGFR; rosuvastatin max 10 mg if eGFR &lt;30</li>
            <li>Bempedoic acid contraindicated if eGFR &lt;30</li>
            <li>PCSK9i/inclisiran safe in CKD; no renal dose adjustment</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold">Statin intolerance</h4>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            <li>Rule out nocebo effect (SAMSON trial: 90% of symptoms reproduced on placebo)</li>
            <li>Try alternate statin (rosuvastatin → atorvastatin), lower dose, alternate-day dosing</li>
            <li>If truly intolerant: bempedoic acid ± ezetimibe ± PCSK9i</li>
            <li>Check CK only if symptomatic; routine monitoring not recommended</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold">Severe hypertriglyceridaemia (&gt;500 mg/dL)</h4>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            <li>Rule out secondary causes: alcohol, DM, hypothyroidism, nephrotic syndrome, drugs</li>
            <li>Fibrate first-line to prevent pancreatitis</li>
            <li>Add icosapent ethyl 4 g/d if TG 150–499 + ASCVD/DM (REDUCE-IT)</li>
            <li>Omega-3 OTC not effective at standard doses</li>
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

function Monitoring() {
  return (
    <SectionCard title="Monitoring & follow-up" icon={<Droplets className="h-5 w-5" />}>
      <div className="space-y-2">
        <KeyRow k="Baseline" v="Lipid panel (TC, LDL, HDL, TG, non-HDL), LFTs, CK (if symptoms), HbA1c, TSH" />
        <KeyRow k="4–12 wk after starting / titrating" v="Lipid panel, LFTs (ALT)" />
        <KeyRow k="Annually (at goal)" v="Lipid panel, LFTs; Lp(a) once" />
        <KeyRow k="Statin + DM" v="Monitor HbA1c (small ↑ with high-intensity statin — clinical significance debated)" />
        <KeyRow k="PCSK9i / inclisiran" v="No routine lab monitoring required; injection site check" />
      </div>
      <Callout tone="info" title="When to refer">
        If LDL not at goal on maximally tolerated statin + ezetimibe → consider PCSK9i/inclisiran.
        If FH suspected → refer for genetic counselling. If TG &gt;500 refractory → lipidology.
      </Callout>
    </SectionCard>
  );
}

/* ────────────────────────────────────────────────
   Main export
   ──────────────────────────────────────────────── */

export default function LipidApp() {
  return (
    <div className="space-y-4">
      <RiskStratification />
      <LipidTargetsTable />
      <StatinIntensity />
      <DrugClasses />
      <FamilialHypercholesterolemia />
      <SpecialPopulations />
      <Monitoring />
    </div>
  );
}
