import { BookOpen, Activity, ShieldAlert, Target, FlaskConical } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout } from "./shared";
import golimumabAsset from "@/assets/golimumab-t1dm.png.asset.json";

const dmTypes = [
  { t: "Type 1", desc: "Autoimmune β-cell destruction; absolute insulin deficiency. GAD-65 / IA-2 / ZnT8 / islet-cell antibodies positive. Typically <30 yrs; C-peptide low.", tag: "Insulin required" },
  { t: "Type 2", desc: "Insulin resistance + progressive β-cell dysfunction. ~90–95% of cases. Strong genetic & obesity component; usually antibody negative.", tag: "Lifestyle + OHA ± insulin" },
  { t: "LADA (Type 1.5)", desc: "Slowly progressive autoimmune diabetes in adults. GAD-65 positive but often initially responsive to OHAs. Failure of sulfonylurea within 6 mo is a clue.", tag: "Insulin within 3–6 yrs" },
  { t: "Type 3c (Pancreatogenic)", desc: "Secondary to exocrine pancreatic disease: chronic pancreatitis, pancreatectomy, cystic fibrosis, hemochromatosis, pancreatic Ca. Brittle glycemia; concomitant fat malabsorption.", tag: "PERT + insulin" },
  { t: "Type 3b", desc: "Diabetes secondary to endocrinopathies (Cushing, acromegaly, pheo, glucagonoma) or drug-induced (glucocorticoids, thiazides, atypical antipsychotics, tacrolimus, PI-based ART).", tag: "Treat underlying cause" },
  { t: "Type 3 (Alzheimer's)", desc: "Proposed brain-specific insulin resistance in AD; not an ADA classification but relevant to research on intranasal insulin & GLP-1 neuroprotection.", tag: "Investigational" },
  { t: "Type 4", desc: "Age-related diabetes without obesity — insulin resistance driven by adipose tissue inflammation in lean elderly. Distinct from classic T2DM.", tag: "Research entity" },
  { t: "Type 5 (MRDM)", desc: "Malnutrition-related; recently formally recognized (IDF 2025). Onset in lean young adults from low-income settings; insulin-requiring but ketosis-resistant.", tag: "Insulin + nutrition" },
  { t: "GDM", desc: "Hyperglycemia first recognized in pregnancy (not overt DM). Screen 24–28 wks with 75g OGTT (IADPSG/ADA 2026).", tag: "MNT ± insulin" },
  { t: "MODY", desc: "Monogenic; HNF1A, GCK, HNF4A most common. Autosomal dominant, <25 yr onset, non-obese, antibody negative. Genetic testing changes therapy.", tag: "Sulfonylurea (HNF1A)" },
];

const ominousOctet = [
  "↓ Insulin secretion (β-cell failure)",
  "↑ Glucagon secretion (α-cell)",
  "↑ Hepatic glucose production",
  "↓ Muscle glucose uptake (insulin resistance)",
  "↑ Lipolysis (adipocyte)",
  "↓ Incretin effect (GLP-1 / GIP)",
  "↑ Renal glucose reabsorption (SGLT2)",
  "Neurotransmitter dysfunction (CNS resistance)",
];

const diagnosis = [
  ["HbA1c", "≥ 6.5 %", "NGSP-certified assay, absent hemoglobinopathy"],
  ["Fasting plasma glucose", "≥ 126 mg/dL (7.0 mmol/L)", "8-hr fast"],
  ["2-hr OGTT (75 g)", "≥ 200 mg/dL (11.1 mmol/L)", "WHO protocol"],
  ["Random glucose + symptoms", "≥ 200 mg/dL", "Classic hyperglycemic symptoms or crisis"],
];

const prediabetes = [
  ["HbA1c", "5.7 – 6.4 %"],
  ["IFG (fasting)", "100 – 125 mg/dL"],
  ["IGT (2-hr OGTT)", "140 – 199 mg/dL"],
];

export default function DiabetesOverview() {
  return (
    <div className="space-y-5">
      <SectionCard
        id="classification"
        title="Diabetes classification"
        subtitle="ADA 2026 categories plus emerging types (Type 5 / MRDM added 2025)"
        icon={<BookOpen className="h-5 w-5" />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {dmTypes.map((d) => (
            <div key={d.t} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-foreground">{d.t}</div>
                <Pill tone="primary">{d.tag}</Pill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="octet"
        title="DeFronzo's Ominous Octet"
        subtitle="Eight core pathophysiologic defects in Type 2 diabetes"
        icon={<Activity className="h-5 w-5" />}
      >
        <ol className="grid list-decimal grid-cols-1 gap-1 pl-5 md:grid-cols-2">
          {ominousOctet.map((x) => <li key={x}>{x}</li>)}
        </ol>
        <Callout tone="info" title="Therapeutic implication">
          Monotherapy addresses at most one or two defects. Early combination therapy (metformin + GLP-1 RA + SGLT2i)
          targets multiple mechanisms and is now preferred over sequential add-on in most T2DM patients.
        </Callout>
      </SectionCard>

      <SectionCard
        id="diagnosis"
        title="ADA 2026 diagnostic criteria"
        subtitle="Any one criterion; confirm with a second test unless unequivocal hyperglycemia present"
        icon={<Target className="h-5 w-5" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">Test</th><th className="p-2">Threshold</th><th className="p-2">Notes</th></tr>
            </thead>
            <tbody>
              {diagnosis.map(([a, b, c]) => (
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
          <h4 className="mb-2 font-semibold">Prediabetes (increased risk)</h4>
          <div className="grid gap-1">
            {prediabetes.map(([k, v]) => <KeyRow key={k} k={k} v={v} mono />)}
          </div>
        </div>

        <Callout tone="warning" title="HbA1c pitfalls">
          Inaccurate with hemoglobinopathies, recent transfusion, hemolysis, iron/B12 deficiency, ESRD, pregnancy (2nd/3rd trimester),
          and after high-dose vitamin C/E. Use fasting glucose or fructosamine in these settings.
        </Callout>
      </SectionCard>

      <SectionCard
        id="complications"
        title="Complication risk & targets"
        subtitle="ADA / KDIGO 2024–2026 harmonised targets"
        icon={<ShieldAlert className="h-5 w-5" />}
        tone="info"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-semibold">Risk stratification</h4>
            <ul className="list-disc space-y-1 pl-5">
              <li><b>Very high:</b> established ASCVD, HF, CKD (eGFR &lt;60 or ACR ≥30), ≥3 major CV risk factors.</li>
              <li><b>High:</b> DM ≥10 yr without target organ damage + ≥1 risk factor.</li>
              <li><b>Moderate:</b> young (&lt;35 yr T1DM &lt;10 yr, T2DM &lt;10 yr) without risk factors.</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Targets (individualise)</h4>
            <div className="space-y-1">
              <KeyRow k="HbA1c (most adults)" v="< 7.0 %" mono />
              <KeyRow k="HbA1c (frail / limited life expectancy)" v="< 8.0 %" mono />
              <KeyRow k="BP" v="< 130 / 80 mmHg" mono />
              <KeyRow k="LDL (very high risk)" v="< 55 mg/dL & ↓ ≥50 %" mono />
              <KeyRow k="LDL (high risk)" v="< 70 mg/dL" mono />
              <KeyRow k="TIR (CGM)" v="> 70 %" mono />
              <KeyRow k="TBR (<70 mg/dL)" v="< 4 %" mono />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="t1dm-golimumab"
        title="Type 1 DM — disease-modifying therapy (golimumab)"
        subtitle="Phase 2 RCT in youth with new-onset T1DM (Quattrin et al., NEJM 2020)"
        icon={<FlaskConical className="h-5 w-5" />}
        tone="info"
      >
        <p className="text-sm text-muted-foreground">
          In this phase 2 trial, children and young adults with newly diagnosed overt type 1 diabetes were randomly
          assigned to receive <b>golimumab</b>, a human monoclonal antibody to tumor necrosis factor α, or placebo.
          Golimumab resulted in <b>better endogenous insulin production</b> (higher 4-hour C-peptide AUC on mixed-meal
          tolerance testing at 52 weeks) and <b>less exogenous insulin use</b> than placebo.
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <KeyRow k="4-hr C-peptide AUC (52 wk)" v="0.64 ± 0.42 vs 0.43 ± 0.39 pmol/mL (p<0.001)" mono />
          <KeyRow k="Δ HbA1c at 52 wk" v="0.47 % vs 0.56 % (p=0.80)" mono />
          <KeyRow k="Δ Insulin use (U/kg/day)" v="0.07 vs 0.24 (p=0.001)" mono />
          <KeyRow k="Mean hypoglycaemic events" v="38.2 vs 42.9 (p=0.80)" mono />
        </div>

        <figure className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <img
            src={golimumabAsset.url}
            alt="NEJM infographic: Golimumab in youth with new-onset type 1 diabetes — phase 2 RCT results showing higher C-peptide AUC and lower insulin use vs placebo."
            loading="lazy"
            className="h-auto w-full"
          />
          <figcaption className="border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Quattrin T, et al. <i>N Engl J Med</i> 2020;383:2007–2017. DOI 10.1056/NEJMoa2006136.
          </figcaption>
        </figure>

        <Callout tone="info" title="Clinical context">
          Anti-TNFα therapy joins teplizumab (anti-CD3, FDA-approved 2022 to delay stage-3 T1DM) as evidence that
          immune modulation can preserve β-cell function in new-onset T1DM. Golimumab is not yet approved for this
          indication; use remains investigational.
        </Callout>
      </SectionCard>

      <SectionCard
        id="t1dm-teplizumab"
        title="Type 1 DM — teplizumab (Tzield) to delay Stage 3 onset"
        subtitle="First and only FDA-approved disease-modifying therapy in T1DM (Nov 2022)"
        icon={<FlaskConical className="h-5 w-5" />}
        tone="info"
      >
        <p className="text-sm text-muted-foreground">
          <b>Teplizumab-mzwv</b> is an anti-CD3 humanised monoclonal antibody that modulates autoreactive
          T-cells. In the pivotal TN-10 trial (Herold et al., <i>NEJM</i> 2019), a single 14-day IV course
          delayed progression from Stage 2 to Stage 3 (clinical) T1DM by a <b>median of ~2 years</b>
          (48.4 vs 24.4 months) in at-risk relatives.
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <KeyRow k="Indication" v="Delay onset of Stage 3 T1DM in adults & children ≥8 yr with Stage 2 T1DM" />
          <KeyRow k="Stage 2 criteria" v="≥2 islet autoantibodies + dysglycaemia, still normoglycaemic fasting" />
          <KeyRow k="Course" v="Single 14-day IV infusion course (once in a lifetime)" />
          <KeyRow k="Dose (BSA-based)" v="Days 1–4 escalate, Days 5–14: 65 µg/m²/day IV over ≥30 min" mono />
          <KeyRow k="Median delay to Stage 3" v="≈ 24 months (48.4 vs 24.4 mo, HR 0.41)" mono />
          <KeyRow k="Premedication" v="NSAID + antihistamine + antipyretic before first 5 infusions" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Callout tone="warning" title="Key adverse effects">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li><b>Lymphopenia</b> — expected, nadir wk 1–2, recovers by wk 6; monitor CBC weekly ×14 days.</li>
              <li><b>Cytokine release syndrome</b> — headache, fever, nausea, myalgia; mitigated by premedication.</li>
              <li><b>Rash</b> (~36%) and <b>headache</b> (~11%).</li>
              <li><b>Serious infections</b> — hold if active serious infection; screen for EBV/CMV/HBV/HCV/TB baseline.</li>
              <li>Avoid <b>live vaccines</b> 8 wk before, during, and 52 wk after dosing; complete age-appropriate vaccines pre-treatment.</li>
            </ul>
          </Callout>
          <Callout tone="info" title="Eligibility & monitoring">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Confirm Stage 2 T1DM: ≥2 positive islet autoantibodies (GAD-65, IA-2, ZnT8, insulin, ICA) <i>plus</i> dysglycaemia on OGTT/HbA1c/CGM without meeting Stage 3 criteria.</li>
              <li>Baseline: CBC with differential, LFTs, EBV/CMV serology, HBV/HCV, TB screen, pregnancy test.</li>
              <li>Weekly CBC and LFTs during the 14-day course.</li>
              <li>Post-course: continue metabolic surveillance (HbA1c, OGTT, CGM) — teplizumab <i>delays</i> but does not prevent T1DM.</li>
            </ul>
          </Callout>
        </div>

        <Callout tone="info" title="Clinical context">
          Together with golimumab (anti-TNFα, investigational in new-onset T1DM), teplizumab establishes
          immune modulation as a viable strategy to preserve β-cell function. Screening first-degree
          relatives of people with T1DM for islet autoantibodies is now recommended so that eligible
          Stage 2 individuals can be offered therapy.
        </Callout>
      </SectionCard>
    </div>
  );
}
