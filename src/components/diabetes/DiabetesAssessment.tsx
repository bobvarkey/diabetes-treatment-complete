import { useMemo, useState } from "react";
import { Calculator, Ruler, Droplet, Syringe } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function classifyBmiIndian(bmi: number) {
  if (!isFinite(bmi) || bmi <= 0) return { label: "—", tone: "default" as const };
  if (bmi < 18.5) return { label: "Underweight", tone: "info" as const };
  if (bmi < 23) return { label: "Normal (Asian-Indian)", tone: "success" as const };
  if (bmi < 25) return { label: "Overweight (Asian-Indian)", tone: "warning" as const };
  if (bmi < 30) return { label: "Obesity I", tone: "warning" as const };
  return { label: "Obesity II", tone: "danger" as const };
}

function classifyBmiWHO(bmi: number) {
  if (!isFinite(bmi) || bmi <= 0) return { label: "—", tone: "default" as const };
  if (bmi < 18.5) return { label: "Underweight", tone: "info" as const };
  if (bmi < 25) return { label: "Normal", tone: "success" as const };
  if (bmi < 30) return { label: "Overweight", tone: "warning" as const };
  if (bmi < 35) return { label: "Obesity class I", tone: "warning" as const };
  if (bmi < 40) return { label: "Obesity class II", tone: "danger" as const };
  return { label: "Obesity class III", tone: "danger" as const };
}

function BmiCalculator() {
  const [ht, setHt] = useState("");
  const [wt, setWt] = useState("");
  const bmi = useMemo(() => {
    const h = parseFloat(ht) / 100;
    const w = parseFloat(wt);
    return h > 0 && w > 0 ? w / (h * h) : NaN;
  }, [ht, wt]);
  const c = classifyBmiIndian(bmi);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <Label htmlFor="ht">Height (cm)</Label>
        <Input id="ht" inputMode="decimal" value={ht} onChange={(e) => setHt(e.target.value)} placeholder="170" />
      </div>
      <div>
        <Label htmlFor="wt">Weight (kg)</Label>
        <Input id="wt" inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value)} placeholder="72" />
      </div>
      <div className="flex flex-col justify-end">
        <Stat label="BMI" value={isFinite(bmi) ? bmi.toFixed(1) : "—"} hint="kg/m²" />
        <div className="mt-2"><Pill tone={c.tone}>{c.label}</Pill></div>
      </div>
    </div>
  );
}

function AdaObesityCalculator() {
  const [ht, setHt] = useState("");
  const [wt, setWt] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");

  const h = parseFloat(ht) / 100;
  const w = parseFloat(wt);
  const waistN = parseFloat(waist);
  const hipN = parseFloat(hip);
  const bmi = h > 0 && w > 0 ? w / (h * h) : NaN;
  const whr = waistN > 0 && hipN > 0 ? waistN / hipN : NaN;

  const bmiCat = classifyBmiWHO(bmi);

  const waistCutoff = sex === "male" ? 102 : 88;
  const waistElevated = isFinite(waistN) && waistN > waistCutoff;

  const whrRisk = useMemo(() => {
    if (!isFinite(whr)) return null;
    if (sex === "male") {
      if (whr >= 1.0) return { label: "High (≥1.00)", tone: "danger" as const };
      if (whr >= 0.9) return { label: "Increased (≥0.90)", tone: "warning" as const };
      return { label: "Low (<0.90)", tone: "success" as const };
    }
    if (whr >= 0.85) return { label: "Increased (≥0.85)", tone: "warning" as const };
    return { label: "Low (<0.85)", tone: "success" as const };
  }, [whr, sex]);

  const centralFlag = waistElevated || (whrRisk && whrRisk.tone !== "success");
  const bmiInRange = isFinite(bmi) && bmi >= 25 && bmi < 35;
  const riskUpgrade = bmiInRange && centralFlag;

  const overallNote = useMemo(() => {
    if (!isFinite(bmi)) return null;
    if (riskUpgrade)
      return {
        tone: "danger" as const,
        text: "Cardiometabolic risk upgraded: BMI 25–34.9 with elevated central adiposity. BMI class unchanged; treat as higher-risk phenotype.",
      };
    if (centralFlag)
      return {
        tone: "warning" as const,
        text: "Central adiposity flag present. BMI category unchanged; consider higher visceral fat / cardiometabolic risk.",
      };
    if (!isFinite(waistN) && !isFinite(hipN))
      return { tone: "info" as const, text: "BMI only — central adiposity not assessed. Add waist ± hip circumference for full ADA-style stratification." };
    return { tone: "success" as const, text: "No central adiposity flag by waist / WHR cutoffs." };
  }, [bmi, riskUpgrade, centralFlag, waistN, hipN]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="ada-ht">Height (cm)</Label>
          <Input id="ada-ht" inputMode="decimal" value={ht} onChange={(e) => setHt(e.target.value)} placeholder="170" />
        </div>
        <div>
          <Label htmlFor="ada-wt">Weight (kg)</Label>
          <Input id="ada-wt" inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value)} placeholder="82" />
        </div>
        <div>
          <Label>Sex</Label>
          <Select value={sex} onValueChange={(v) => setSex(v as "male" | "female")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ada-waist">Waist circumference (cm) <span className="text-muted-foreground">— optional</span></Label>
          <Input id="ada-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={sex === "male" ? "≤102" : "≤88"} />
        </div>
        <div>
          <Label htmlFor="ada-hip">Hip circumference (cm) <span className="text-muted-foreground">— optional</span></Label>
          <Input id="ada-hip" inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="100" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="BMI" value={isFinite(bmi) ? bmi.toFixed(1) : "—"} hint="kg/m² (WHO)" />
        <div className="flex items-end"><Pill tone={bmiCat.tone}>{bmiCat.label}</Pill></div>
        <Stat label="Waist-to-hip ratio" value={isFinite(whr) ? whr.toFixed(2) : "—"} hint={sex === "male" ? "M cutoff ≥0.90" : "F cutoff ≥0.85"} />
      </div>

      <div className="grid gap-2">
        {isFinite(waistN) && (
          <KeyRow
            k={`Waist (cutoff ${waistCutoff} cm, ${sex})`}
            v={waistElevated ? "Elevated — central adiposity flag" : "Within cutoff"}
          />
        )}
        {whrRisk && (
          <KeyRow k="WHR risk" v={whrRisk.label} />
        )}
      </div>

      {overallNote && <Callout tone={overallNote.tone} title="Interpretation">{overallNote.text}</Callout>}

      <Callout tone="info" title="ADA-aligned rules">
        BMI classifies adiposity burden; waist circumference and WHR act as risk modifiers, not replacements. Elevated
        central measures with BMI 25–34.9 upgrade cardiometabolic risk even though BMI category is unchanged. Cutoffs:
        waist &gt;102 cm (M) / &gt;88 cm (F); WHR ≥0.90 (M) / ≥0.85 (F); WHR ≥1.00 (M) = high.
      </Callout>
    </div>
  );
}

function HbA1cInterpretation() {
  const [a1c, setA1c] = useState("");
  const val = parseFloat(a1c);
  const eAG = isFinite(val) ? 28.7 * val - 46.7 : NaN;
  const cat = useMemo(() => {
    if (!isFinite(val)) return null;
    if (val < 5.7) return { l: "Normal", t: "success" as const };
    if (val < 6.5) return { l: "Prediabetes", t: "warning" as const };
    if (val < 7) return { l: "DM — at target (most adults)", t: "success" as const };
    if (val < 8) return { l: "DM — above target; intensify", t: "warning" as const };
    if (val < 10) return { l: "DM — poor control", t: "danger" as const };
    return { l: "DM — severe hyperglycemia (consider insulin)", t: "danger" as const };
  }, [val]);
  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="a1c">HbA1c (%)</Label>
          <Input id="a1c" inputMode="decimal" value={a1c} onChange={(e) => setA1c(e.target.value)} placeholder="7.2" />
        </div>
        <Stat label="eAG" value={isFinite(eAG) ? Math.round(eAG) : "—"} hint="mg/dL (ADAG formula)" />
        <div className="flex items-end">{cat && <Pill tone={cat.t}>{cat.l}</Pill>}</div>
      </div>
      <div className="grid gap-1">
        <KeyRow k="Most adults" v="< 7.0 %" mono />
        <KeyRow k="Pregnancy" v="< 6.0 – 6.5 %" mono />
        <KeyRow k="Older / frail / hypo-prone" v="< 8.0 %" mono />
        <KeyRow k="Newly diagnosed / young / few comorbidities" v="< 6.5 %" mono />
      </div>
    </div>
  );
}

function InsulinDosingCalculator() {
  const [wt, setWt] = useState("");
  const [status, setStatus] = useState("insulin_naive");
  const [ckd, setCkd] = useState("no");
  const w = parseFloat(wt);
  const base = useMemo(() => {
    if (!isFinite(w) || w <= 0) return null;
    let perKg = 0.5;
    if (status === "t1dm") perKg = 0.5;               // 0.4–0.6
    if (status === "t2dm_moderate") perKg = 0.4;      // 0.3–0.5
    if (status === "t2dm_severe") perKg = 0.7;        // 0.5–1.0
    if (status === "insulin_naive") perKg = 0.3;      // conservative start
    if (ckd === "ckd") perKg *= 0.75;
    if (ckd === "elderly") perKg *= 0.7;
    const tdd = perKg * w;
    return { tdd, basal: tdd * 0.5, bolus: tdd * 0.5, perMeal: (tdd * 0.5) / 3 };
  }, [w, status, ckd]);

  const icr = base ? 500 / base.tdd : NaN; // rule of 500
  const isf = base ? 1800 / base.tdd : NaN; // rule of 1800 (rapid)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="w">Weight (kg)</Label>
          <Input id="w" inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value)} placeholder="70" />
        </div>
        <div>
          <Label>Clinical scenario</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="insulin_naive">Insulin-naive T2DM (start low)</SelectItem>
              <SelectItem value="t2dm_moderate">T2DM moderate hyperglycemia</SelectItem>
              <SelectItem value="t2dm_severe">T2DM severe / glucotoxicity</SelectItem>
              <SelectItem value="t1dm">Type 1 DM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Adjustment</Label>
          <Select value={ckd} onValueChange={setCkd}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">None</SelectItem>
              <SelectItem value="ckd">CKD (eGFR &lt;60): −25 %</SelectItem>
              <SelectItem value="elderly">Elderly / frail: −30 %</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {base && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="TDD" value={base.tdd.toFixed(1)} hint="units/day" />
            <Stat label="Basal (50 %)" value={base.basal.toFixed(1)} hint="units glargine/degludec qHS" />
            <Stat label="Prandial total" value={base.bolus.toFixed(1)} hint="units rapid-acting/day" />
            <Stat label="Per meal" value={base.perMeal.toFixed(1)} hint="units before B / L / D" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Stat label="ICR (rule of 500)" value={`1 : ${Math.round(icr)}`} hint="1 U covers ~x g carbs" />
            <Stat label="ISF (rule of 1800)" value={`1 : ${Math.round(isf)}`} hint="1 U drops glucose by mg/dL" />
          </div>
        </>
      )}

      <Callout tone="warning" title="Titration">
        Adjust basal by 2 U every 3 days until fasting glucose 80–130 mg/dL. For prandial, adjust ±10–20 % based on 2-hr
        post-meal glucose. Stop sulfonylureas when starting prandial insulin; continue metformin, SGLT2i, GLP-1 RA.
      </Callout>
    </div>
  );
}

function GlucosePatterns() {
  const rows = [
    ["Fasting hyperglycemia", "Dawn phenomenon / insufficient basal / rebound (Somogyi)", "↑ basal by 10–20%; check 3 AM glucose"],
    ["Post-prandial hyperglycemia", "Insufficient prandial insulin / ICR / high-GI meal", "Titrate mealtime dose or ICR; add GLP-1 RA"],
    ["Nocturnal hypoglycemia", "Excess basal, late exercise, alcohol", "↓ basal 10–20%; snack ± switch to degludec"],
    ["Erratic swings", "Missed doses, gastroparesis, injection lipohypertrophy", "Rotate sites; consider CGM + pump"],
    ["Steroid-induced hyperglycemia", "Post-lunch/afternoon peak with morning prednisone", "NPH-based regimen morning, matched to steroid"],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr><th className="p-2">Pattern</th><th className="p-2">Likely cause</th><th className="p-2">Action</th></tr>
        </thead>
        <tbody>
          {rows.map(([a, b, c]) => (
            <tr key={a} className="border-t border-border">
              <td className="p-2 font-medium">{a}</td>
              <td className="p-2 text-muted-foreground">{b}</td>
              <td className="p-2">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DiabetesAssessment() {
  return (
    <div className="space-y-5">
      <SectionCard id="bmi" title="BMI Calculator" subtitle="Asian-Indian cutoffs (IAP 2023)" icon={<Ruler className="h-5 w-5" />}>
        <BmiCalculator />
        <Callout tone="info">
          Asian-Indians develop cardiometabolic risk at lower BMI. Waist circumference &gt; 90 cm (M) / &gt; 80 cm (F)
          confers additional risk regardless of BMI.
        </Callout>
      </SectionCard>

      <SectionCard id="ada-obesity" title="ADA obesity calculator" subtitle="BMI + waist & waist-to-hip ratio as risk modifiers" icon={<Ruler className="h-5 w-5" />}>
        <AdaObesityCalculator />
      </SectionCard>

      <SectionCard id="a1c" title="HbA1c interpretation" subtitle="eAG conversion + individualised targets" icon={<Droplet className="h-5 w-5" />}>
        <HbA1cInterpretation />
      </SectionCard>

      <SectionCard id="insulin-dose" title="Insulin dosing calculator" subtitle="TDD → basal / bolus with CKD & geriatric adjustment" icon={<Syringe className="h-5 w-5" />}>
        <InsulinDosingCalculator />
      </SectionCard>

      <SectionCard id="patterns" title="Glucose pattern recognition" icon={<Calculator className="h-5 w-5" />}>
        <GlucosePatterns />
      </SectionCard>
    </div>
  );
}
