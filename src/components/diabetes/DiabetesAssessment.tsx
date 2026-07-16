import { useMemo, useState } from "react";
import { Activity, Calculator, Ruler, Droplet, Syringe, Scale } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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

function IndiaObesityCalculator() {
  const [ht, setHt] = useState("");
  const [wt, setWt] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");

  const h = parseFloat(ht) / 100;
  const w = parseFloat(wt);
  const waistN = parseFloat(waist);
  const hipN = parseFloat(hip);
  const htN = parseFloat(ht);
  const bmi = h > 0 && w > 0 ? w / (h * h) : NaN;
  const whr = waistN > 0 && hipN > 0 ? waistN / hipN : NaN;
  const whtr = waistN > 0 && htN > 0 ? waistN / htN : NaN;

  const bmiCat = classifyBmiWHO(bmi);

  // Indian waist cutoffs
  const waistCut = sex === "male" ? 90 : 80;
  const waistFlag = isFinite(waistN) && waistN >= waistCut;

  // WHtR
  const whtrRisk = useMemo(() => {
    if (!isFinite(whtr)) return null;
    if (whtr >= 0.52) return { label: "Higher Indian risk signal (≥0.52)", tone: "danger" as const };
    if (whtr >= 0.5) return { label: "Elevated risk (≥0.50)", tone: "warning" as const };
    return { label: "Lower risk (<0.50)", tone: "success" as const };
  }, [whtr]);

  // WHR
  const whrRisk = useMemo(() => {
    if (!isFinite(whr)) return null;
    if (sex === "male") {
      if (whr >= 0.93) return { label: "Higher Indian risk signal (≥0.93)", tone: "danger" as const };
      if (whr >= 0.9) return { label: "Elevated risk (≥0.90)", tone: "warning" as const };
      return { label: "Lower risk (<0.90)", tone: "success" as const };
    }
    if (whr >= 0.85) return { label: "Elevated / higher Indian risk (≥0.85)", tone: "warning" as const };
    return { label: "Lower risk (<0.85)", tone: "success" as const };
  }, [whr, sex]);

  const centralFlag =
    waistFlag ||
    (whtrRisk && whtrRisk.tone !== "success") ||
    (whrRisk && whrRisk.tone !== "success");

  const bmiInRange = isFinite(bmi) && bmi >= 23 && bmi < 35;
  const riskUpgrade = bmiInRange && centralFlag;

  const overallNote = useMemo(() => {
    if (!isFinite(bmi)) return null;
    if (riskUpgrade)
      return {
        tone: "danger" as const,
        text: "Cardiometabolic risk upgraded: BMI 23–34.9 with elevated central adiposity (waist / WHtR / WHR). BMI class unchanged; treat as higher-risk phenotype.",
      };
    if (centralFlag)
      return {
        tone: "warning" as const,
        text: "Central adiposity flag present. BMI category unchanged; consider higher visceral fat and cardiometabolic risk.",
      };
    if (!isFinite(waistN) && !isFinite(hipN))
      return {
        tone: "info" as const,
        text: "BMI only — central adiposity not assessed. Add waist ± hip circumference for full Indian risk stratification.",
      };
    return { tone: "success" as const, text: "No central adiposity flag by Indian waist / WHtR / WHR cutoffs." };
  }, [bmi, riskUpgrade, centralFlag, waistN, hipN]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="in-ht">Height (cm)</Label>
          <Input id="in-ht" inputMode="decimal" value={ht} onChange={(e) => setHt(e.target.value)} placeholder="170" />
        </div>
        <div>
          <Label htmlFor="in-wt">Weight (kg)</Label>
          <Input id="in-wt" inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value)} placeholder="72" />
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
          <Label htmlFor="in-waist">Waist (cm) <span className="text-muted-foreground">— optional</span></Label>
          <Input id="in-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={sex === "male" ? "≥90 flags" : "≥80 flags"} />
        </div>
        <div>
          <Label htmlFor="in-hip">Hip (cm) <span className="text-muted-foreground">— optional</span></Label>
          <Input id="in-hip" inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="100" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="BMI" value={isFinite(bmi) ? bmi.toFixed(1) : "—"} hint="kg/m²" />
        <div className="flex items-end"><Pill tone={bmiCat.tone}>{bmiCat.label}</Pill></div>
        <Stat label="WHtR" value={isFinite(whtr) ? whtr.toFixed(2) : "—"} hint="cutoff ≥0.50" />
        <Stat label="WHR" value={isFinite(whr) ? whr.toFixed(2) : "—"} hint={sex === "male" ? "M ≥0.90" : "F ≥0.85"} />
      </div>

      <div className="grid gap-2">
        {isFinite(waistN) && (
          <KeyRow k={`Waist (Indian cutoff ${waistCut} cm, ${sex})`} v={waistFlag ? "Elevated — abdominal obesity" : "Within cutoff"} />
        )}
        {whtrRisk && <KeyRow k="Waist-to-height risk" v={whtrRisk.label} />}
        {whrRisk && <KeyRow k="Waist-to-hip risk" v={whrRisk.label} />}
      </div>

      {overallNote && <Callout tone={overallNote.tone} title="Interpretation">{overallNote.text}</Callout>}

      <Callout tone="info" title="Indian cutoffs & rules">
        <ul className="ml-4 list-disc space-y-1">
          <li><b>Waist:</b> ≥90 cm (M) / ≥80 cm (F) → abdominal obesity flag.</li>
          <li><b>WHtR:</b> ≥0.50 elevated; Indian studies cluster around 0.51–0.53 for metabolic risk.</li>
          <li><b>WHR:</b> screening ≥0.90 (M) / ≥0.85 (F); Indian male cohorts often ≥0.93.</li>
          <li>Any elevated central marker with BMI 23–34.9 upgrades cardiometabolic risk without changing BMI class.</li>
          <li>Waist and WHtR are often more useful than BMI alone for Indian metabolic risk screening.</li>
        </ul>
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

function classifyBmiIcmr(bmi: number) {
  if (!isFinite(bmi) || bmi <= 0) return { category: "—", tone: "default" as const, obesityClass: null as string | null };
  if (bmi < 18.5) return { category: "Underweight", tone: "info" as const, obesityClass: null };
  if (bmi < 23) return { category: "Normal", tone: "success" as const, obesityClass: null };
  if (bmi < 25) return { category: "Overweight (At risk)", tone: "warning" as const, obesityClass: null };
  // Obesity ≥25 — sub-classified by Indian clinical practice
  let obesityClass = "Class I (25.0–29.9)";
  if (bmi >= 40) obesityClass = "Class IV / Morbid (≥40)";
  else if (bmi >= 35) obesityClass = "Class III (35.0–39.9)";
  else if (bmi >= 30) obesityClass = "Class II (30.0–34.9)";
  return { category: "Obesity", tone: "danger" as const, obesityClass };
}

function IcmrBmiCalculator() {
  const [ht, setHt] = useState("");
  const [wt, setWt] = useState("");
  const bmi = useMemo(() => {
    const h = parseFloat(ht) / 100;
    const w = parseFloat(wt);
    return h > 0 && w > 0 ? w / (h * h) : NaN;
  }, [ht, wt]);
  const icmr = classifyBmiIcmr(bmi);
  const who = classifyBmiWHO(bmi);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="icmr-ht">Height (cm)</Label>
          <Input id="icmr-ht" inputMode="decimal" value={ht} onChange={(e) => setHt(e.target.value)} placeholder="170" />
        </div>
        <div>
          <Label htmlFor="icmr-wt">Weight (kg)</Label>
          <Input id="icmr-wt" inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value)} placeholder="72" />
        </div>
        <Stat label="BMI" value={isFinite(bmi) ? bmi.toFixed(1) : "—"} hint="kg/m²" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">ICMR (Asian-Indian)</div>
          <div className="mt-1 flex items-center gap-2">
            <Pill tone={icmr.tone}>{icmr.category}</Pill>
            {icmr.obesityClass && <Pill tone="danger">{icmr.obesityClass}</Pill>}
          </div>
        </div>
        <div className="rounded-md border border-border p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">WHO (Global)</div>
          <div className="mt-1"><Pill tone={who.tone}>{who.label}</Pill></div>
        </div>
      </div>

      {isFinite(bmi) && icmr.category !== who.label && (
        <Callout tone="warning" title="Classification differs by guideline">
          At BMI {bmi.toFixed(1)} kg/m² this patient is <b>{icmr.category}</b> by ICMR but <b>{who.label}</b> by WHO.
          Use the ICMR cutoff for Indian patients — cardiometabolic risk rises at a lower BMI in South Asians.
        </Callout>
      )}
    </div>
  );
}

function IcmrBmiTable() {
  const icmr = [
    ["Underweight", "< 18.5", "Nutritional deficiency", "info"],
    ["Normal", "18.5 – 22.9", "Low risk", "success"],
    ["Overweight (At risk)", "23.0 – 24.9", "Increased cardiometabolic risk", "warning"],
    ["Obesity", "≥ 25.0", "High cardiometabolic risk", "danger"],
  ] as const;
  const classes = [
    ["Class I", "25.0 – 29.9"],
    ["Class II", "30.0 – 34.9"],
    ["Class III", "35.0 – 39.9"],
    ["Class IV (Morbid / Extreme)", "≥ 40.0"],
  ];
  const cmp = [
    ["Underweight", "< 18.5", "< 18.5", "Nutritional deficiencies"],
    ["Normal weight", "18.5 – 22.9", "18.5 – 24.9", "Standard healthy range"],
    ["Overweight", "23.0 – 24.9", "25.0 – 29.9", "Pre-obesity / increased risk"],
    ["Obesity I", "25.0 – 29.9", "30.0 – 34.9", "High metabolic risk"],
    ["Obesity II", "30.0 – 34.9", "35.0 – 39.9", "Severe health risk"],
    ["Obesity III", "≥ 35.0", "≥ 40.0", "Morbid obesity"],
  ];
  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-semibold">ICMR (Asian-Indian) BMI classification</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">Category</th><th className="p-2">BMI (kg/m²)</th><th className="p-2">Risk</th></tr>
            </thead>
            <tbody>
              {icmr.map(([a, b, c, tone]) => (
                <tr key={a} className="border-t border-border">
                  <td className="p-2 font-medium">{a}</td>
                  <td className="p-2 font-mono">{b}</td>
                  <td className="p-2"><Pill tone={tone as never}>{c}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Obesity classes (Indian clinical practice)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">Class</th><th className="p-2">BMI (kg/m²)</th></tr>
            </thead>
            <tbody>
              {classes.map(([a, b]) => (
                <tr key={a} className="border-t border-border">
                  <td className="p-2 font-medium">{a}</td>
                  <td className="p-2 font-mono">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ICMR/Indian consensus primarily defines obesity as BMI ≥ 25 kg/m². Subdivision into Classes I–IV is widely used
          for severity grading in Indian practice, although the original consensus emphasises the lower threshold rather
          than formal classes.
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">ICMR vs WHO — side-by-side</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-2">Category</th>
                <th className="p-2">ICMR (India)</th>
                <th className="p-2">WHO (Global)</th>
                <th className="p-2">Risk for Indians</th>
              </tr>
            </thead>
            <tbody>
              {cmp.map(([a, b, c, d]) => (
                <tr key={a} className="border-t border-border">
                  <td className="p-2 font-medium">{a}</td>
                  <td className="p-2 font-mono">{b}</td>
                  <td className="p-2 font-mono">{c}</td>
                  <td className="p-2 text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Callout tone="info" title="Why the guidelines differ">
        <ul className="ml-4 list-disc space-y-1">
          <li><b>Visceral fat:</b> Asian Indians carry more abdominal / visceral fat at a lower BMI than Caucasians.</li>
          <li><b>“Thin-fat” phenotype:</b> lean external appearance with high internal fat around major organs.</li>
          <li><b>Metabolic vulnerability:</b> insulin resistance, T2DM and premature CAD occur at lower BMI in Indians.</li>
        </ul>
      </Callout>
    </div>
  );
}

function IcmrPhenotypeTool() {
  const [bmi, setBmi] = useState("");
  const [unhealthy, setUnhealthy] = useState(false);
  const b = parseFloat(bmi);
  const phenotype = useMemo(() => {
    if (!isFinite(b)) return null;
    const obese = b >= 25;
    if (!obese && !unhealthy) return { code: "MHNO", label: "Metabolically Healthy Non-Obese", risk: "Lowest cardiometabolic risk", tone: "success" as const };
    if (!obese && unhealthy) return { code: "MONO", label: "Metabolically Obese Non-Obese (‘slim-fat’)", risk: "High risk of T2DM & CKD despite normal BMI", tone: "danger" as const };
    if (obese && !unhealthy) return { code: "MHO", label: "Metabolically Healthy Obese", risk: "Lower than MOO but requires periodic reassessment", tone: "warning" as const };
    return { code: "MOO", label: "Metabolically Obese Obese", risk: "Highest risk for T2DM, CVD & obesity-related complications", tone: "danger" as const };
  }, [b, unhealthy]);

  const rows = [
    ["MHNO", "Metabolically Healthy Non-Obese", "BMI <25 + healthy", "Lowest risk"],
    ["MONO", "Metabolically Obese Non-Obese", "BMI <25 + unhealthy", "‘Slim-fat’; high T2DM/CKD risk"],
    ["MHO", "Metabolically Healthy Obese", "BMI ≥25 + healthy", "Lower risk than MOO; reassess"],
    ["MOO", "Metabolically Obese Obese", "BMI ≥25 + unhealthy", "Highest T2DM & CVD risk"],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="phen-bmi">BMI (kg/m²)</Label>
          <Input id="phen-bmi" inputMode="decimal" value={bmi} onChange={(e) => setBmi(e.target.value)} placeholder="24" />
        </div>
        <div className="md:col-span-2 flex items-end gap-2">
          <Checkbox id="phen-unhealthy" checked={unhealthy} onCheckedChange={(v) => setUnhealthy(v === true)} />
          <Label htmlFor="phen-unhealthy" className="cursor-pointer">
            Metabolically unhealthy (≥ 2 abnormalities: BP, glucose, TG, HDL, waist)
          </Label>
        </div>
      </div>
      {phenotype && (
        <Callout tone={phenotype.tone} title={`${phenotype.code} — ${phenotype.label}`}>
          {phenotype.risk}
        </Callout>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Code</th><th className="p-2">Phenotype</th><th className="p-2">Criteria</th><th className="p-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b, c, d]) => (
              <tr key={a} className="border-t border-border">
                <td className="p-2 font-mono font-semibold">{a}</td>
                <td className="p-2">{b}</td>
                <td className="p-2 text-muted-foreground">{c}</td>
                <td className="p-2">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout tone="info" title="Key takeaways">
        <ul className="ml-4 list-disc space-y-1">
          <li>BMI alone is insufficient for risk stratification in Indians.</li>
          <li>MONO individuals appear non-obese but carry substantial metabolic risk.</li>
          <li>MOO has the greatest risk of diabetes and cardiovascular disease.</li>
          <li>MHO may progress over time — periodic reassessment recommended.</li>
        </ul>
      </Callout>
    </div>
  );
}

function MetabolicSyndromeChecker() {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [waist, setWaist] = useState("");
  const [tg, setTg] = useState("");
  const [hdl, setHdl] = useState("");
  const [sbp, setSbp] = useState("");
  const [dbp, setDbp] = useState("");
  const [fpg, setFpg] = useState("");
  const [onBP, setOnBP] = useState(false);
  const [onLipid, setOnLipid] = useState(false);
  const [dm, setDm] = useState(false);

  const waistN = parseFloat(waist), tgN = parseFloat(tg), hdlN = parseFloat(hdl);
  const sbpN = parseFloat(sbp), dbpN = parseFloat(dbp), fpgN = parseFloat(fpg);

  const waistCut = sex === "male" ? 90 : 80;
  const hdlCut = sex === "male" ? 40 : 50;

  const criteria = [
    { k: `Abdominal obesity (waist ≥ ${waistCut} cm)`, met: isFinite(waistN) && waistN >= waistCut },
    { k: "Triglycerides ≥ 150 mg/dL or on Rx", met: onLipid || (isFinite(tgN) && tgN >= 150) },
    { k: `HDL < ${hdlCut} mg/dL or on Rx`, met: onLipid || (isFinite(hdlN) && hdlN < hdlCut) },
    { k: "BP ≥ 130/85 mmHg or on antihypertensive", met: onBP || (isFinite(sbpN) && sbpN >= 130) || (isFinite(dbpN) && dbpN >= 85) },
    { k: "Fasting glucose ≥ 100 mg/dL or DM", met: dm || (isFinite(fpgN) && fpgN >= 100) },
  ];
  const count = criteria.filter((c) => c.met).length;
  const diagnosed = count >= 3;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
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
          <Label htmlFor="ms-waist">Waist (cm)</Label>
          <Input id="ms-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={sex === "male" ? "≥90" : "≥80"} />
        </div>
        <div>
          <Label htmlFor="ms-fpg">Fasting glucose (mg/dL)</Label>
          <Input id="ms-fpg" inputMode="decimal" value={fpg} onChange={(e) => setFpg(e.target.value)} placeholder="≥100" />
        </div>
        <div>
          <Label htmlFor="ms-tg">Triglycerides (mg/dL)</Label>
          <Input id="ms-tg" inputMode="decimal" value={tg} onChange={(e) => setTg(e.target.value)} placeholder="≥150" />
        </div>
        <div>
          <Label htmlFor="ms-hdl">HDL (mg/dL)</Label>
          <Input id="ms-hdl" inputMode="decimal" value={hdl} onChange={(e) => setHdl(e.target.value)} placeholder={sex === "male" ? "<40" : "<50"} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="ms-sbp">SBP</Label>
            <Input id="ms-sbp" inputMode="decimal" value={sbp} onChange={(e) => setSbp(e.target.value)} placeholder="≥130" />
          </div>
          <div>
            <Label htmlFor="ms-dbp">DBP</Label>
            <Input id="ms-dbp" inputMode="decimal" value={dbp} onChange={(e) => setDbp(e.target.value)} placeholder="≥85" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={onBP} onCheckedChange={(v) => setOnBP(v === true)} /> On antihypertensive
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={onLipid} onCheckedChange={(v) => setOnLipid(v === true)} /> On lipid therapy
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={dm} onCheckedChange={(v) => setDm(v === true)} /> Diagnosed diabetes
        </label>
      </div>

      <div className="grid gap-2">
        {criteria.map((c) => (
          <KeyRow key={c.k} k={c.k} v={c.met ? "Met" : "—"} />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Stat label="Criteria met" value={`${count} / 5`} />
        <Pill tone={diagnosed ? "danger" : count === 2 ? "warning" : "success"}>
          {diagnosed ? "Metabolic syndrome" : count === 2 ? "Metabolically unhealthy (ICMR-INDIAB)" : "Does not meet criteria"}
        </Pill>
      </div>

      <Callout tone="info" title="Harmonized definition & distinctions">
        <p>≥ 3 of 5 = metabolic syndrome. Indian waist cut-offs: ≥ 90 cm (M) / ≥ 80 cm (F). Patients with MetS have ~2×
          CVD risk and ~5× risk of T2DM, plus increased NAFLD, CKD, OSA and premature mortality.</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Note: ICMR-INDIAB defines “metabolically unhealthy” as ≥ 2 abnormalities and combines it with BMI to derive
          MHNO/MONO/MHO/MOO — a research framework distinct from formal MetS (≥ 3 abnormalities, BMI not included).
        </p>
      </Callout>
    </div>
  );
}

function HomaIrCalculator() {
  const [ins, setIns] = useState("");
  const [glu, setGlu] = useState("");
  const i = parseFloat(ins), g = parseFloat(glu);
  const homa = isFinite(i) && isFinite(g) && i > 0 && g > 0 ? (i * g) / 405 : NaN;
  const cat = useMemo(() => {
    if (!isFinite(homa)) return null;
    if (homa < 1.0) return { l: "Normal insulin sensitivity", t: "success" as const };
    if (homa < 1.9) return { l: "Early insulin resistance", t: "warning" as const };
    if (homa < 2.9) return { l: "Significant insulin resistance", t: "warning" as const };
    return { l: "Severe insulin resistance", t: "danger" as const };
  }, [homa]);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="ins">Fasting insulin (μIU/mL)</Label>
          <Input id="ins" inputMode="decimal" value={ins} onChange={(e) => setIns(e.target.value)} placeholder="12" />
        </div>
        <div>
          <Label htmlFor="glu">Fasting glucose (mg/dL)</Label>
          <Input id="glu" inputMode="decimal" value={glu} onChange={(e) => setGlu(e.target.value)} placeholder="95" />
        </div>
        <div className="flex flex-col justify-end">
          <Stat label="HOMA-IR" value={isFinite(homa) ? homa.toFixed(2) : "—"} hint="(insulin × glucose) / 405" />
          {cat && <div className="mt-2"><Pill tone={cat.t}>{cat.l}</Pill></div>}
        </div>
      </div>
      <Callout tone="info">
        HOMA-IR helps identify MONO (‘slim-fat’, BMI &lt; 25 with insulin resistance) and MOO phenotypes. Indian cut-offs
        typically flag insulin resistance at HOMA-IR ≥ 2.0–2.5; interpret alongside waist, lipids, BP and glucose.
      </Callout>
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

      <SectionCard id="india-obesity" title="India obesity & adiposity calculator" subtitle="BMI + waist, WHtR & WHR with Indian cutoffs" icon={<Ruler className="h-5 w-5" />}>
        <IndiaObesityCalculator />
      </SectionCard>

      <SectionCard id="icmr-bmi" title="ICMR (Asian-Indian) BMI classification" subtitle="Interactive calculator + WHO comparison" icon={<Scale className="h-5 w-5" />}>
        <IcmrBmiCalculator />
        <div className="mt-5 border-t border-border pt-5">
          <IcmrBmiTable />
        </div>
      </SectionCard>

      <SectionCard id="icmr-phenotype" title="ICMR-INDIAB metabolic phenotypes" subtitle="MHNO / MONO / MHO / MOO" icon={<Activity className="h-5 w-5" />}>
        <IcmrPhenotypeTool />
      </SectionCard>

      <SectionCard id="met-syndrome" title="Metabolic syndrome checker" subtitle="Harmonized criteria — Indian waist cut-offs" icon={<Activity className="h-5 w-5" />}>
        <MetabolicSyndromeChecker />
      </SectionCard>

      <SectionCard id="homa-ir" title="HOMA-IR calculator" subtitle="Insulin resistance — key for MONO / MOO phenotypes" icon={<Calculator className="h-5 w-5" />}>
        <HomaIrCalculator />
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
