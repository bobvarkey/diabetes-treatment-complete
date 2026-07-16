import { useMemo, useState } from "react";
import { Calculator, Droplet, Syringe } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



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

