import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryLabel, type FinalCategory } from "./osteoporosisAlgorithm";

interface DrugRow {
  drug: string;
  dose: string;
  duration: string;
}
interface Plan {
  heading: string;
  drugs: DrugRow[];
  switching: string[];
  monitoring: string[];
}

const PLANS: Record<Exclude<FinalCategory, "assessment_incomplete">, Plan> = {
  very_high: {
    heading: "Anabolic-first (bone-forming) therapy — specialist assessment",
    drugs: [
      { drug: "Romosozumab", dose: "210 mg SC once monthly (2 × 105 mg injections)", duration: "12 months" },
      { drug: "Teriparatide", dose: "20 µg SC once daily", duration: "Up to 24 months" },
      { drug: "Abaloparatide", dose: "80 µg SC once daily", duration: "18 months (local approval varies)" },
      { drug: "If anabolic unavailable/contraindicated: Zoledronic acid", dose: "5 mg IV once yearly", duration: "3 years, then review" },
      { drug: "If anabolic unavailable/contraindicated: Denosumab", dose: "60 mg SC every 6 months", duration: "Long term; no unplanned stop" },
    ],
    switching: [
      "After completing anabolic course, start an antiresorptive immediately (zoledronic acid 5 mg IV or denosumab 60 mg SC) to consolidate gains.",
      "Romosozumab: avoid with MI/stroke in previous 12 months; switch to teriparatide/abaloparatide or antiresorptive.",
      "Do not start denosumab or zoledronate before teriparatide course is completed.",
      "New fracture on therapy: check adherence, secondary causes, exposure ≥12 months before labelling failure; consider escalation.",
    ],
    monitoring: [
      "Calcium, 25-OH vitamin D, creatinine/eGFR at baseline; correct vitamin D before starting.",
      "DXA at 1–2 years after anabolic course; review adverse effects each visit.",
      "Dental review before antiresorptive (ONJ risk).",
    ],
  },
  high: {
    heading: "Antiresorptive therapy",
    drugs: [
      { drug: "Alendronate (first line)", dose: "70 mg orally once weekly", duration: "5 years, then review" },
      { drug: "Risedronate", dose: "35 mg orally once weekly", duration: "5 years, then review" },
      { drug: "Ibandronate", dose: "150 mg orally monthly or 3 mg IV every 3 months", duration: "5 years, then review" },
      { drug: "Zoledronic acid (oral intolerance/adherence)", dose: "5 mg IV once yearly (CrCl ≥35 mL/min)", duration: "3 years, then review" },
      { drug: "Denosumab (CKD / bisphosphonate unsuitable)", dose: "60 mg SC every 6 months", duration: "5–10 years; planned exit" },
    ],
    switching: [
      "Oral bisphosphonate intolerance or poor adherence → switch to zoledronic acid IV.",
      "CrCl <35 mL/min → avoid bisphosphonates; use denosumab (check calcium; specialist if CKD-MBD).",
      "Stopping denosumab → give zoledronic acid 5 mg IV ~6 months after last dose (avoid rebound vertebral fractures).",
      "Persistent high risk at review → continue oral BP up to 10 years / IV up to 6 years; low risk → drug holiday 1–3 years (not for denosumab).",
      "Fracture on treatment or escalation to very high risk → consider anabolic therapy.",
    ],
    monitoring: [
      "Calcium 1000–1200 mg/day (diet ± supplement) and vitamin D 800–1000 IU/day.",
      "Oral BP: take fasting with full glass of water, stay upright 30 min.",
      "DXA every 2–3 years; renal function before each IV dose.",
    ],
  },
  below_treatment_threshold: {
    heading: "No drug therapy currently indicated",
    drugs: [
      { drug: "Calcium", dose: "1000–1200 mg/day (diet preferred)", duration: "Ongoing" },
      { drug: "Vitamin D3", dose: "800–1000 IU/day (correct deficiency first)", duration: "Ongoing" },
    ],
    switching: [
      "Start antiresorptive if a fragility fracture occurs, T-score falls ≤−2.5 or FRAX crosses national threshold.",
    ],
    monitoring: [
      "Falls prevention, exercise, smoking cessation, alcohol ≤2 units/day.",
      "Repeat risk assessment/DXA in 2–5 years or sooner with new risk factors.",
    ],
  },
};

export function buildTreatmentPlanText(category: FinalCategory, provisional: boolean, routing: string): string {
  const lines = [
    `Osteoporosis risk: ${categoryLabel(category)}${provisional ? " (provisional — assessment incomplete)" : ""}`,
    routing,
  ];
  if (category !== "assessment_incomplete") {
    const p = PLANS[category];
    lines.push("", `Treatment plan: ${p.heading}`, "Medication options:");
    p.drugs.forEach((d) => lines.push(`- ${d.drug}: ${d.dose}; duration ${d.duration}`));
    lines.push("Switching / sequencing:");
    p.switching.forEach((s) => lines.push(`- ${s}`));
    lines.push("Monitoring:");
    p.monitoring.forEach((s) => lines.push(`- ${s}`));
  }
  lines.push("", "Educational decision support; confirm local approvals and contraindications.");
  return lines.join("\n");
}

export default function LiveTreatmentPlan({
  category,
  provisional,
  routing,
}: {
  category: FinalCategory;
  provisional: boolean;
  routing: string;
}) {
  const [copied, setCopied] = useState(false);
  if (category === "assessment_incomplete") return null;
  const p = PLANS[category];

  const copy = async () => {
    const text = buildTreatmentPlanText(category, provisional, routing);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 rounded-[1.15rem] border border-border/60 p-3" data-testid="live-treatment-plan">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Suggested treatment plan: {p.heading}</p>
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy result"}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 pr-2">Medication</th>
              <th className="py-1 pr-2">Dose</th>
              <th className="py-1">Duration</th>
            </tr>
          </thead>
          <tbody>
            {p.drugs.map((d) => (
              <tr key={d.drug} className="border-t border-border/40 align-top">
                <td className="py-1 pr-2 font-medium">{d.drug}</td>
                <td className="py-1 pr-2">{d.dose}</td>
                <td className="py-1">{d.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <p className="text-xs font-semibold">Switching / sequencing</p>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          {p.switching.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold">Monitoring</p>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          {p.monitoring.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
    </div>
  );
}
