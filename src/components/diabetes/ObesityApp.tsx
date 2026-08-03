import { useMemo, useState } from "react";
import { Activity, Calculator, Ruler, Scale } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ---------- Classification helpers ---------- */


function classifyBmiWHO(bmi: number) {
  if (!isFinite(bmi) || bmi <= 0) return { label: "—", tone: "default" as const };
  if (bmi < 18.5) return { label: "Underweight", tone: "info" as const };
  if (bmi < 25) return { label: "Normal", tone: "success" as const };
  if (bmi < 30) return { label: "Overweight", tone: "warning" as const };
  if (bmi < 35) return { label: "Obesity class I", tone: "warning" as const };
  if (bmi < 40) return { label: "Obesity class II", tone: "danger" as const };
  return { label: "Obesity class III", tone: "danger" as const };
}

function classifyBmiIcmr(bmi: number) {
  if (!isFinite(bmi) || bmi <= 0) return { category: "—", tone: "default" as const, obesityClass: null as string | null };
  if (bmi < 18.5) return { category: "Underweight", tone: "info" as const, obesityClass: null };
  if (bmi < 23) return { category: "Normal", tone: "success" as const, obesityClass: null };
  if (bmi < 25) return { category: "Overweight (At risk)", tone: "warning" as const, obesityClass: null };
  let obesityClass = "Class I (25.0–29.9)";
  if (bmi >= 40) obesityClass = "Class IV / Morbid (≥40)";
  else if (bmi >= 35) obesityClass = "Class III (35.0–39.9)";
  else if (bmi >= 30) obesityClass = "Class II (30.0–34.9)";
  return { category: "Obesity", tone: "danger" as const, obesityClass };
}

/* ---------- Simple BMI Calculator ---------- */

/* ---------- Ranged + exact input ---------- */

type RangeOpt = { label: string; value: number; tone: "success" | "warning" | "danger" | "info" | "default" };

function RangedField({
  label, hint, unit, options, value, setValue,
}: {
  label: string;
  hint?: string;
  unit?: string;
  options: RangeOpt[];
  value: string;
  setValue: (v: string) => void;
}) {
  const [mode, setMode] = useState<"range" | "exact">("range");
  return (
    <div className="rounded-md border border-border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">{label}{unit && <span className="text-muted-foreground"> ({unit})</span>}</Label>
        <button
          type="button"
          className="text-[11px] text-primary underline-offset-2 hover:underline"
          onClick={() => setMode((m) => (m === "range" ? "exact" : "range"))}
        >
          {mode === "range" ? "Enter exact" : "Pick range"}
        </button>
      </div>
      {mode === "range" ? (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.label} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={hint} />
      )}
    </div>
  );
}

/* ---------- Unified BMI + ICMR/INDIAB calculator ---------- */

function UnifiedBmiCalculator() {
  const [phenotype, setPhenotype] = useState<"who" | "indian">("indian");
  const [ht, setHt] = useState("");
  const [wt, setWt] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [sbp, setSbp] = useState("");
  const [fbs, setFbs] = useState("");
  const [tg, setTg] = useState("");
  const [hdl, setHdl] = useState("");

  const h = parseFloat(ht) / 100;
  const w = parseFloat(wt);
  const bmi = h > 0 && w > 0 ? w / (h * h) : NaN;
  const waistN = parseFloat(waist);
  const hipN = parseFloat(hip);
  const sbpN = parseFloat(sbp);
  const fbsN = parseFloat(fbs);
  const tgN = parseFloat(tg);
  const hdlN = parseFloat(hdl);
  const htN = parseFloat(ht);
  const whr = waistN > 0 && hipN > 0 ? waistN / hipN : NaN;
  const whtr = waistN > 0 && htN > 0 ? waistN / htN : NaN;

  const who = classifyBmiWHO(bmi);
  const icmr = classifyBmiIcmr(bmi);

  const waistCut = sex === "male" ? 90 : 80;
  const hdlCut = sex === "male" ? 40 : 50;

  const waistOpts: RangeOpt[] = sex === "male"
    ? [
        { label: "< 90 cm — Normal (M)", value: 85, tone: "success" },
        { label: "90 – 101 cm — Abdominal obesity (M)", value: 95, tone: "warning" },
        { label: "≥ 102 cm — High risk (M)", value: 105, tone: "danger" },
      ]
    : [
        { label: "< 80 cm — Normal (F)", value: 75, tone: "success" },
        { label: "80 – 87 cm — Abdominal obesity (F)", value: 83, tone: "warning" },
        { label: "≥ 88 cm — High risk (F)", value: 92, tone: "danger" },
      ];
  const bpOpts: RangeOpt[] = [
    { label: "< 120 — Normal", value: 115, tone: "success" },
    { label: "120 – 129 — Elevated", value: 125, tone: "warning" },
    { label: "130 – 139 — Stage 1 HTN", value: 135, tone: "warning" },
    { label: "≥ 140 — Stage 2 HTN", value: 145, tone: "danger" },
  ];
  const fbsOpts: RangeOpt[] = [
    { label: "< 100 mg/dL — Normal", value: 90, tone: "success" },
    { label: "100 – 125 — Impaired fasting glucose", value: 110, tone: "warning" },
    { label: "≥ 126 — Diabetes range", value: 140, tone: "danger" },
  ];
  const tgOpts: RangeOpt[] = [
    { label: "< 150 mg/dL — Normal", value: 120, tone: "success" },
    { label: "150 – 199 — Borderline high", value: 175, tone: "warning" },
    { label: "200 – 499 — High", value: 250, tone: "danger" },
    { label: "≥ 500 — Very high", value: 550, tone: "danger" },
  ];
  const hdlOpts: RangeOpt[] = sex === "male"
    ? [
        { label: "< 40 mg/dL — Low (M)", value: 35, tone: "danger" },
        { label: "40 – 59 — Acceptable (M)", value: 48, tone: "warning" },
        { label: "≥ 60 — Protective", value: 65, tone: "success" },
      ]
    : [
        { label: "< 50 mg/dL — Low (F)", value: 45, tone: "danger" },
        { label: "50 – 59 — Acceptable (F)", value: 55, tone: "warning" },
        { label: "≥ 60 — Protective", value: 65, tone: "success" },
      ];

  const waistClass = !isFinite(waistN) ? null
    : waistN >= (sex === "male" ? 102 : 88) ? { label: `Very high (≥${sex === "male" ? 102 : 88} cm)`, tone: "danger" as const }
    : waistN >= waistCut ? { label: `Abdominal obesity (≥${waistCut} cm)`, tone: "warning" as const }
    : { label: `Within cutoff (<${waistCut} cm)`, tone: "success" as const };

  const bpClass = !isFinite(sbpN) ? null
    : sbpN >= 140 ? { label: "Stage 2 hypertension", tone: "danger" as const }
    : sbpN >= 130 ? { label: "Stage 1 hypertension", tone: "warning" as const }
    : sbpN >= 120 ? { label: "Elevated BP", tone: "warning" as const }
    : { label: "Normal BP", tone: "success" as const };

  const fbsClass = !isFinite(fbsN) ? null
    : fbsN >= 126 ? { label: "Diabetes range", tone: "danger" as const }
    : fbsN >= 100 ? { label: "Impaired fasting glucose", tone: "warning" as const }
    : { label: "Normal", tone: "success" as const };

  const tgClass = !isFinite(tgN) ? null
    : tgN >= 500 ? { label: "Very high", tone: "danger" as const }
    : tgN >= 200 ? { label: "High", tone: "danger" as const }
    : tgN >= 150 ? { label: "Borderline high", tone: "warning" as const }
    : { label: "Normal", tone: "success" as const };

  const hdlClass = !isFinite(hdlN) ? null
    : hdlN < hdlCut ? { label: `Low (<${hdlCut} mg/dL)`, tone: "danger" as const }
    : hdlN >= 60 ? { label: "Protective (≥60)", tone: "success" as const }
    : { label: "Acceptable", tone: "warning" as const };

  const flags = [
    isFinite(waistN) && waistN >= waistCut,
    isFinite(sbpN) && sbpN >= 130,
    isFinite(fbsN) && fbsN >= 100,
    isFinite(tgN) && tgN >= 150,
    isFinite(hdlN) && hdlN < hdlCut,
  ].filter(Boolean).length;

  const indiabPhenotype = useMemo(() => {
    if (!isFinite(bmi)) return null;
    const obese = bmi >= 25;
    const unhealthy = flags >= 2;
    if (!obese && !unhealthy) return { code: "MHNO", tone: "success" as const, text: "Metabolically Healthy Non-Obese — lowest cardiometabolic risk." };
    if (!obese && unhealthy) return { code: "MONO", tone: "danger" as const, text: "Metabolically Obese Non-Obese (‘slim-fat’) — high T2DM & CKD risk despite normal BMI." };
    if (obese && !unhealthy) return { code: "MHO", tone: "warning" as const, text: "Metabolically Healthy Obese — lower risk than MOO; reassess periodically." };
    return { code: "MOO", tone: "danger" as const, text: "Metabolically Obese Obese — highest T2DM, CVD & obesity-related risk." };
  }, [bmi, flags]);

  const indian = phenotype === "indian";

  return (
    <div className="space-y-4">
      {/* Phenotype toggle */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px]">
          <Label>Population / phenotype</Label>
          <Select value={phenotype} onValueChange={(v) => setPhenotype(v as "who" | "indian")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="who">General (WHO / Global)</SelectItem>
              <SelectItem value="indian">Indian (ICMR / INDIAB)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {indian && (
          <div className="min-w-[160px]">
            <Label>Sex</Label>
            <Select value={sex} onValueChange={(v) => setSex(v as "male" | "female")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Core anthropometry */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="u-ht">Height (cm)</Label>
          <Input id="u-ht" inputMode="decimal" value={ht} onChange={(e) => setHt(e.target.value)} placeholder="170" />
        </div>
        <div>
          <Label htmlFor="u-wt">Weight (kg)</Label>
          <Input id="u-wt" inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value)} placeholder="72" />
        </div>
        <Stat label="BMI" value={isFinite(bmi) ? bmi.toFixed(1) : "—"} hint="kg/m²" />
      </div>

      {/* BMI classification cards */}
      <div className={`grid gap-3 ${indian ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
        {indian && (
          <div className="rounded-md border border-border p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">ICMR (Asian-Indian) BMI</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Pill tone={icmr.tone}>{icmr.category}</Pill>
              {icmr.obesityClass && <Pill tone="danger">{icmr.obesityClass}</Pill>}
            </div>
          </div>
        )}
        <div className="rounded-md border border-border p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">WHO (Global) BMI</div>
          <div className="mt-1"><Pill tone={who.tone}>{who.label}</Pill></div>
        </div>
      </div>

      {/* Indian-only extras */}
      {indian && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="u-waist">Waist (cm) <span className="text-muted-foreground">— optional</span></Label>
              <Input id="u-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={sex === "male" ? "≥90 flags" : "≥80 flags"} />
            </div>
            <div>
              <Label htmlFor="u-hip">Hip (cm) <span className="text-muted-foreground">— optional</span></Label>
              <Input id="u-hip" inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="100" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="WHtR" value={isFinite(whtr) ? whtr.toFixed(2) : "—"} hint="cutoff ≥0.50" />
            <Stat label="WHR" value={isFinite(whr) ? whr.toFixed(2) : "—"} hint={sex === "male" ? "M ≥0.90" : "F ≥0.85"} />
            <Stat label="Metabolic flags" value={`${flags} / 5`} hint="waist · BP · FBS · TG · HDL" />
            <div className="flex items-end">
              {indiabPhenotype && <Pill tone={indiabPhenotype.tone}>{indiabPhenotype.code}</Pill>}
            </div>
          </div>

          <div className="text-sm font-semibold pt-1">ICMR-INDIAB metabolic parameters</div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <RangedField label="Waist circumference" unit="cm" hint={sex === "male" ? "≥90 flags" : "≥80 flags"} options={waistOpts} value={waist} setValue={setWaist} />
            <RangedField label="Systolic BP" unit="mmHg" hint="e.g. 132" options={bpOpts} value={sbp} setValue={setSbp} />
            <RangedField label="Fasting blood sugar" unit="mg/dL" hint="e.g. 105" options={fbsOpts} value={fbs} setValue={setFbs} />
            <RangedField label="Triglycerides" unit="mg/dL" hint="e.g. 180" options={tgOpts} value={tg} setValue={setTg} />
            <RangedField label="HDL cholesterol" unit="mg/dL" hint={sex === "male" ? "<40 low" : "<50 low"} options={hdlOpts} value={hdl} setValue={setHdl} />
          </div>

          <div className="grid gap-2">
            {waistClass && <KeyRow k="Waist" v={<Pill tone={waistClass.tone}>{waistClass.label}</Pill>} />}
            {bpClass && <KeyRow k="Blood pressure" v={<Pill tone={bpClass.tone}>{bpClass.label}</Pill>} />}
            {fbsClass && <KeyRow k="Fasting glucose" v={<Pill tone={fbsClass.tone}>{fbsClass.label}</Pill>} />}
            {tgClass && <KeyRow k="Triglycerides" v={<Pill tone={tgClass.tone}>{tgClass.label}</Pill>} />}
            {hdlClass && <KeyRow k="HDL" v={<Pill tone={hdlClass.tone}>{hdlClass.label}</Pill>} />}
          </div>

          {indiabPhenotype && (
            <Callout tone={indiabPhenotype.tone} title={`Phenotype: ${indiabPhenotype.code} — ${flags} of 5 metabolic abnormalities`}>
              {indiabPhenotype.text}
            </Callout>
          )}

          {isFinite(bmi) && icmr.category !== who.label && (
            <Callout tone="warning" title="Classification differs by guideline">
              At BMI {bmi.toFixed(1)} kg/m² this patient is <b>{icmr.category}</b> by ICMR but <b>{who.label}</b> by WHO.
              Use the ICMR cutoff for Indian patients — cardiometabolic risk rises at a lower BMI in South Asians.
            </Callout>
          )}
        </>
      )}

      <Callout tone="info">
        {indian
          ? "Indian mode uses ICMR/INDIAB cutoffs: BMI ≥23 overweight, ≥25 obesity; waist ≥90 cm (M) / ≥80 cm (F); ≥2 metabolic abnormalities = ‘metabolically unhealthy’."
          : "General mode uses WHO cutoffs: BMI ≥25 overweight, ≥30 obesity. Switch to Indian phenotype for ICMR/INDIAB assessment with waist, BP, FBS, TG and HDL."}
      </Callout>
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
    </div>
  );
}

/* ---------- ICMR-INDIAB phenotype ---------- */

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
            <tr><th className="p-2">Code</th><th className="p-2">Phenotype</th><th className="p-2">Criteria</th><th className="p-2">Risk</th></tr>
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
    </div>
  );
}

/* ---------- Metabolic syndrome ---------- */

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
        <div><Label htmlFor="ms-waist">Waist (cm)</Label><Input id="ms-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={sex === "male" ? "≥90" : "≥80"} /></div>
        <div><Label htmlFor="ms-fpg">Fasting glucose (mg/dL)</Label><Input id="ms-fpg" inputMode="decimal" value={fpg} onChange={(e) => setFpg(e.target.value)} placeholder="≥100" /></div>
        <div><Label htmlFor="ms-tg">Triglycerides (mg/dL)</Label><Input id="ms-tg" inputMode="decimal" value={tg} onChange={(e) => setTg(e.target.value)} placeholder="≥150" /></div>
        <div><Label htmlFor="ms-hdl">HDL (mg/dL)</Label><Input id="ms-hdl" inputMode="decimal" value={hdl} onChange={(e) => setHdl(e.target.value)} placeholder={sex === "male" ? "<40" : "<50"} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor="ms-sbp">SBP</Label><Input id="ms-sbp" inputMode="decimal" value={sbp} onChange={(e) => setSbp(e.target.value)} placeholder="≥130" /></div>
          <div><Label htmlFor="ms-dbp">DBP</Label><Input id="ms-dbp" inputMode="decimal" value={dbp} onChange={(e) => setDbp(e.target.value)} placeholder="≥85" /></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={onBP} onCheckedChange={(v) => setOnBP(v === true)} /> On antihypertensive</label>
        <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={onLipid} onCheckedChange={(v) => setOnLipid(v === true)} /> On lipid therapy</label>
        <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={dm} onCheckedChange={(v) => setDm(v === true)} /> Diagnosed diabetes</label>
      </div>

      <div className="grid gap-2">
        {criteria.map((c) => <KeyRow key={c.k} k={c.k} v={c.met ? "Met" : "—"} />)}
      </div>

      <div className="flex items-center gap-3">
        <Stat label="Criteria met" value={`${count} / 5`} />
        <Pill tone={diagnosed ? "danger" : count === 2 ? "warning" : "success"}>
          {diagnosed ? "Metabolic syndrome" : count === 2 ? "Metabolically unhealthy (ICMR-INDIAB)" : "Does not meet criteria"}
        </Pill>
      </div>

      <Callout tone="info" title="Harmonized definition & distinctions">
        <p>≥ 3 of 5 = metabolic syndrome. Indian waist cut-offs: ≥ 90 cm (M) / ≥ 80 cm (F). MetS carries ~2× CVD risk and ~5× risk of T2DM, plus increased NAFLD, CKD, OSA and premature mortality.</p>
      </Callout>
    </div>
  );
}

/* ---------- HOMA-IR ---------- */

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
        <div><Label htmlFor="ins">Fasting insulin (μIU/mL)</Label><Input id="ins" inputMode="decimal" value={ins} onChange={(e) => setIns(e.target.value)} placeholder="12" /></div>
        <div><Label htmlFor="glu">Fasting glucose (mg/dL)</Label><Input id="glu" inputMode="decimal" value={glu} onChange={(e) => setGlu(e.target.value)} placeholder="95" /></div>
        <div className="flex flex-col justify-end">
          <Stat label="HOMA-IR" value={isFinite(homa) ? homa.toFixed(2) : "—"} hint="(insulin × glucose) / 405" />
          {cat && <div className="mt-2"><Pill tone={cat.t}>{cat.l}</Pill></div>}
        </div>
      </div>
      <Callout tone="info">
        HOMA-IR helps identify MONO (‘slim-fat’, BMI &lt; 25 with insulin resistance) and MOO phenotypes. Indian cut-offs typically flag insulin resistance at HOMA-IR ≥ 2.0–2.5.
      </Callout>
    </div>
  );
}

/* ---------- Choosing the right obesity drug ---------- */

function ChoosingObesityDrug() {
  const { open } = useImageViewer();
  const rows: [string, string][] = [
    ["Greatest weight loss", "Tirzepatide / CagriSema"],
    ["Cardiovascular benefit", "Subcutaneous semaglutide"],
    ["Heart failure (HFpEF) reduction", "Subcutaneous semaglutide / tirzepatide"],
    ["Lower certainty evidence", "Emerging agents — retatrutide, ecnoglutide, mazdutide"],
  ];
  return (
    <div className="space-y-4">
      <figure className="overflow-hidden rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => open(obesityDrugImg.url, "Choosing the right obesity drug — clinical priority vs preferred option")}
          className="block w-full"
        >
          <img
            src={obesityDrugImg.url}
            alt="Choosing the right obesity drug: greatest weight loss — tirzepatide or CagriSema; cardiovascular benefit — subcutaneous semaglutide; heart failure reduction — semaglutide or tirzepatide; lower certainty evidence — retatrutide, ecnoglutide, mazdutide. Also consider GI adverse events, discontinuation, lean mass loss, long-term safety, cost and access, and patient preference."
            className="h-auto w-full"
            loading="lazy"
          />
        </button>
        <figcaption className="border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Tap the image to zoom. Balancing benefits, harms & patient goals.
        </figcaption>
      </figure>

      <div className="space-y-1">
        {rows.map(([k, v]) => <KeyRow key={k} k={k} v={v} />)}
      </div>

      <Callout tone="info" title="Treatment decisions should also consider">
        Risk of gastrointestinal adverse events · treatment discontinuation (tolerability, cost, supply) · lean mass loss
        (pair with resistance training and adequate protein) · long-term safety · cost and access · patient preferences
        and shared decision-making.
      </Callout>

      <Callout tone="warning" title="CagriSema">
        Once-weekly injectable combination of <b>cagrilintide</b> (long-acting amylin analogue) and <b>semaglutide</b>
        (GLP-1 RA) — dual appetite/satiety pathways giving greater weight loss than either agent alone; GI adverse
        events remain the main tolerability limit and titration should be slow.
      </Callout>
    </div>
  );
}

/* ---------- Page ---------- */

export default function ObesityApp() {
  return (
    <div className="space-y-5">
      <SectionCard id="ob-bmi" title="BMI + ICMR/INDIAB calculator" subtitle="Switch to Indian phenotype to unlock ICMR ranges, waist, BP, FBS, TG & HDL" icon={<Scale className="h-5 w-5" />}>
        <UnifiedBmiCalculator />
        <div className="mt-5 border-t border-border pt-5">
          <IcmrBmiTable />
        </div>
      </SectionCard>

      <SectionCard id="ob-drug" title="Choosing the right obesity drug" subtitle="Balancing benefits, harms & patient goals" icon={<PillIcon className="h-5 w-5" />}>
        <ChoosingObesityDrug />
      </SectionCard>

      <SectionCard id="ob-phenotype" title="ICMR-INDIAB metabolic phenotypes" subtitle="MHNO / MONO / MHO / MOO" icon={<Activity className="h-5 w-5" />}>
        <IcmrPhenotypeTool />
      </SectionCard>


      <SectionCard id="ob-mets" title="Metabolic syndrome checker" subtitle="Harmonized criteria — Indian waist cut-offs" icon={<Activity className="h-5 w-5" />}>
        <MetabolicSyndromeChecker />
      </SectionCard>

      <SectionCard id="ob-homa" title="HOMA-IR calculator" subtitle="Insulin resistance — key for MONO / MOO phenotypes" icon={<Calculator className="h-5 w-5" />}>
        <HomaIrCalculator />
      </SectionCard>
    </div>
  );
}
