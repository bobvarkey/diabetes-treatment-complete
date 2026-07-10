import { BookOpen, Activity, ShieldAlert, Target } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout } from "./shared";

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
    </div>
  );
}
