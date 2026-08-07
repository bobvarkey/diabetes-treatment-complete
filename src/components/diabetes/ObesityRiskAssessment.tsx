import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Callout, KeyRow, Pill, Stat } from "./shared";

type Tone = "success" | "warning" | "danger" | "info" | "default";

type Comorbid = {
  key: string;
  label: string;
  points: number;
  monitor: string[];
};

const COMORBIDS: Comorbid[] = [
  { key: "t2dm", label: "Type 2 diabetes / prediabetes", points: 3, monitor: ["HbA1c every 3–6 months", "Annual urine ACR + eGFR", "Annual dilated retinal exam (if diabetes)"] },
  { key: "htn", label: "Hypertension (or on antihypertensives)", points: 2, monitor: ["Home BP log; office BP each visit", "Serum K⁺ & creatinine 1–2 weeks after any ACEi/ARB change"] },
  { key: "dyslip", label: "Dyslipidaemia (TG ≥150 or low HDL or on statin)", points: 2, monitor: ["Fasting lipid panel every 6–12 months", "Non-HDL cholesterol as secondary target"] },
  { key: "mafld", label: "MASLD / fatty liver on imaging", points: 2, monitor: ["ALT/AST every 6–12 months", "FIB-4 score annually; refer if FIB-4 > 1.3 (age-adjusted)"] },
  { key: "osa", label: "Obstructive sleep apnoea (or loud snoring + daytime somnolence)", points: 2, monitor: ["STOP-BANG; sleep study if untreated", "CPAP adherence download if on therapy"] },
  { key: "ascvd", label: "Established ASCVD (MI, stroke, PAD, revascularisation)", points: 4, monitor: ["LDL-C target < 55 mg/dL; lipids in 6–8 weeks after change", "Prefer agents with proven CV benefit (semaglutide)"] },
  { key: "hf", label: "Heart failure (esp. HFpEF)", points: 3, monitor: ["Daily weights, NYHA class each visit", "NT-proBNP and electrolytes with therapy changes"] },
  { key: "ckd", label: "CKD (eGFR < 60 or ACR ≥ 30)", points: 3, monitor: ["eGFR + urine ACR every 3–6 months", "Avoid volume depletion during rapid weight loss"] },
  { key: "pcos", label: "PCOS / infertility", points: 1, monitor: ["Cycle diary, OGTT every 1–2 years", "Contraception counselling before incretin therapy"] },
  { key: "oa", label: "Weight-bearing osteoarthritis or mobility limitation", points: 1, monitor: ["Function/pain score; physiotherapy referral", "Resistance training to protect lean mass"] },
  { key: "smoker", label: "Current smoker", points: 2, monitor: ["Cessation support at every visit"] },
  { key: "famhx", label: "Premature family history of ASCVD or T2DM", points: 1, monitor: ["Earlier and more frequent lipid + glycaemic screening"] },
];

function bandFor(score: number): { label: string; tone: Tone; interval: string; action: string } {
  if (score >= 12) return {
    label: "Very high cardiometabolic risk",
    tone: "danger",
    interval: "Review every 4–6 weeks until stable, then 3-monthly",
    action: "Combine intensive lifestyle therapy with pharmacotherapy now; consider metabolic surgery referral if BMI ≥ 32.5 kg/m² (Asian-Indian) with uncontrolled comorbidity.",
  };
  if (score >= 7) return {
    label: "High cardiometabolic risk",
    tone: "danger",
    interval: "Review every 6–8 weeks until targets met, then 3–6-monthly",
    action: "Structured lifestyle programme plus pharmacotherapy; prioritise an agent matched to the dominant comorbidity (CV disease, HF, CKD, diabetes).",
  };
  if (score >= 3) return {
    label: "Moderate cardiometabolic risk",
    tone: "warning",
    interval: "Review every 3 months",
    action: "Intensive lifestyle therapy targeting 5–10% weight loss; add pharmacotherapy if no response by 3–6 months.",
  };
  return {
    label: "Lower cardiometabolic risk",
    tone: "success",
    interval: "Review every 6–12 months",
    action: "Weight-stability counselling, activity and diet quality; re-screen for metabolic complications annually.",
  };
}

export default function ObesityRiskAssessment() {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [ht, setHt] = useState("");
  const [wt, setWt] = useState("");
  const [waist, setWaist] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const h = parseFloat(ht) / 100;
  const w = parseFloat(wt);
  const bmi = h > 0 && w > 0 ? w / (h * h) : NaN;
  const waistN = parseFloat(waist);
  const ageN = parseFloat(age);
  const htN = parseFloat(ht);
  const whtr = waistN > 0 && htN > 0 ? waistN / htN : NaN;
  const waistCut = sex === "male" ? 90 : 80;

  const result = useMemo(() => {
    let score = 0;
    const drivers: string[] = [];

    if (isFinite(bmi)) {
      if (bmi >= 35) { score += 4; drivers.push(`BMI ${bmi.toFixed(1)} — obesity class III/IV (Asian-Indian)`); }
      else if (bmi >= 30) { score += 3; drivers.push(`BMI ${bmi.toFixed(1)} — obesity class II (Asian-Indian)`); }
      else if (bmi >= 25) { score += 2; drivers.push(`BMI ${bmi.toFixed(1)} — obesity class I (Asian-Indian)`); }
      else if (bmi >= 23) { score += 1; drivers.push(`BMI ${bmi.toFixed(1)} — overweight / at risk`); }
    }
    if (isFinite(waistN) && waistN >= waistCut) {
      score += 2;
      drivers.push(`Waist ${waistN} cm ≥ ${waistCut} cm — abdominal obesity`);
    }
    if (isFinite(whtr) && whtr >= 0.5) {
      score += 1;
      drivers.push(`Waist-to-height ratio ${whtr.toFixed(2)} ≥ 0.50 — central adiposity`);
    }
    if (isFinite(ageN) && ((sex === "male" && ageN >= 45) || (sex === "female" && ageN >= 55))) {
      score += 1;
      drivers.push("Age above sex-specific ASCVD risk threshold");
    }

    const monitor = new Set<string>();
    for (const c of COMORBIDS) {
      if (checked[c.key]) {
        score += c.points;
        drivers.push(c.label);
        c.monitor.forEach((m) => monitor.add(m));
      }
    }

    // Baseline monitoring for anyone with excess adiposity
    if (isFinite(bmi) && bmi >= 23) {
      monitor.add("Weight, waist circumference and BP at every visit");
      monitor.add("Fasting glucose or HbA1c annually (6-monthly if prediabetes)");
      monitor.add("Fasting lipid profile annually");
      monitor.add("ALT/AST + FIB-4 to screen for MASLD");
      monitor.add("eGFR and urine ACR annually");
      monitor.add("TSH once, plus screening questions for OSA and depression");
    }

    return { score, drivers, monitor: Array.from(monitor), band: bandFor(score) };
  }, [bmi, waistN, whtr, ageN, sex, waistCut, checked]);

  const toggle = (k: string) => setChecked((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Sex</Label>
          <Select value={sex} onValueChange={(v) => setSex(v as "male" | "female")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="ora-age">Age (years)</Label>
          <Input id="ora-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 48" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="ora-ht">Height (cm)</Label>
          <Input id="ora-ht" inputMode="decimal" value={ht} onChange={(e) => setHt(e.target.value)} placeholder="e.g. 168" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="ora-wt">Weight (kg)</Label>
          <Input id="ora-wt" inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value)} placeholder="e.g. 84" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="ora-waist">Waist (cm)</Label>
          <Input id="ora-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={`cut-off ${waistCut} cm`} />
        </div>
      </div>

      <div className="rounded-md border border-border p-3">
        <div className="mb-2 text-sm font-semibold">Comorbidities & risk factors</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMORBIDS.map((c) => (
            <label key={c.key} className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 text-sm hover:bg-muted/50">
              <Checkbox checked={!!checked[c.key]} onCheckedChange={() => toggle(c.key)} aria-label={c.label} />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="BMI" value={isFinite(bmi) ? bmi.toFixed(1) : "—"} hint="Asian-Indian cut-offs" />
        <Stat label="Waist-to-height" value={isFinite(whtr) ? whtr.toFixed(2) : "—"} hint="Target < 0.50" />
        <Stat label="Risk score" value={result.score} hint="Composite cardiometabolic burden" />
      </div>

      <Callout tone={result.band.tone === "success" ? "success" : result.band.tone === "warning" ? "warning" : "danger"} title={result.band.label}>
        {result.band.action}
        <div className="mt-2"><Pill tone={result.band.tone === "success" ? "success" : result.band.tone === "warning" ? "warning" : "danger"}>{result.band.interval}</Pill></div>
      </Callout>

      {result.drivers.length > 0 && (
        <div>
          <div className="mb-1 text-sm font-semibold">Risk drivers identified</div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {result.drivers.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-1 text-sm font-semibold">What to monitor next</div>
        {result.monitor.length === 0 ? (
          <p className="text-sm text-muted-foreground">Enter height, weight and any comorbidities to generate a monitoring plan.</p>
        ) : (
          <div className="space-y-1">
            {result.monitor.map((m, i) => <KeyRow key={m} k={`${i + 1}`} v={m} />)}
          </div>
        )}
      </div>

      <Callout tone="info" title="If pharmacotherapy is started">
        Recheck weight and tolerability at 4 weeks and each dose escalation; reassess at 3 months — continue only if
        ≥ 5% weight loss. Monitor for GI intolerance and dehydration, review sulfonylurea/insulin doses to avoid
        hypoglycaemia, and pair therapy with resistance training plus adequate protein to limit lean-mass loss.
      </Callout>
    </div>
  );
}
