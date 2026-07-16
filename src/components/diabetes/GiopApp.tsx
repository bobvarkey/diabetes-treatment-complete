import { useMemo, useState } from "react";
import { Bone, Calculator, ShieldAlert, CheckCircle2, Pill, ClipboardList, Copy, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { SectionCard, KeyRow, Pill as Chip, Callout, Stat } from "./shared";

type RiskBand = "low" | "moderate" | "high" | "veryHigh";

interface Inputs {
  age: string;
  sex: "female" | "male" | "";
  postmenopausal: boolean;
  prednisoneDose: string;      // mg/day equivalent
  durationMonths: string;
  priorFragilityFx: boolean;
  hipOrVertebralFx: boolean;
  tScore: string;              // femoral neck / total hip
  fraxMajor: string;
  fraxHip: string;
  fallRisk: boolean;
  smoker: boolean;
  lowBMI: boolean;             // BMI < 20
  ckd: boolean;                // eGFR < 35
  esophDisease: boolean;
  hypocalcemia: boolean;
  pregnancy: boolean;
}

const DEFAULTS: Inputs = {
  age: "", sex: "", postmenopausal: false,
  prednisoneDose: "", durationMonths: "",
  priorFragilityFx: false, hipOrVertebralFx: false,
  tScore: "", fraxMajor: "", fraxHip: "",
  fallRisk: false, smoker: false, lowBMI: false,
  ckd: false, esophDisease: false, hypocalcemia: false, pregnancy: false,
};

function classify(i: Inputs): { band: RiskBand; reasons: string[] } {
  const age = parseFloat(i.age);
  const dose = parseFloat(i.prednisoneDose);
  const dur = parseFloat(i.durationMonths);
  const t = parseFloat(i.tScore);
  const fm = parseFloat(i.fraxMajor);
  const fh = parseFloat(i.fraxHip);

  const reasons: string[] = [];
  // Very high
  if (i.hipOrVertebralFx) reasons.push("Prior hip/vertebral fracture");
  if (!isNaN(t) && t <= -3.5) reasons.push(`Very low BMD (T ${t.toFixed(1)})`);
  if (!isNaN(dose) && dose >= 30) reasons.push(`High-dose steroids (${dose} mg/d)`);
  if (!isNaN(fm) && fm >= 30) reasons.push(`FRAX major ${fm}% ≥ 30%`);
  if (!isNaN(fh) && fh >= 4.5) reasons.push(`FRAX hip ${fh}% ≥ 4.5%`);
  if (reasons.length) return { band: "veryHigh", reasons };

  // High
  const high: string[] = [];
  if (i.priorFragilityFx) high.push("Prior fragility fracture");
  if (!isNaN(t) && t <= -2.5) high.push(`T-score ${t.toFixed(1)} ≤ –2.5`);
  if (!isNaN(fm) && fm >= 20) high.push(`FRAX major ${fm}% ≥ 20%`);
  if (!isNaN(fh) && fh >= 3) high.push(`FRAX hip ${fh}% ≥ 3%`);
  if (!isNaN(dose) && dose >= 7.5 && !isNaN(dur) && dur >= 3 &&
      (i.sex === "male" && !isNaN(age) && age >= 50 || i.postmenopausal))
    high.push("Long-term steroid ≥7.5 mg/d in older adult / postmenopausal");
  if (high.length) return { band: "high", reasons: high };

  // Moderate
  const mod: string[] = [];
  if (!isNaN(dose) && dose >= 5 && !isNaN(dur) && dur >= 3)
    mod.push("Prednisone ≥5 mg/d for ≥3 months");
  if (!isNaN(t) && t <= -1.5) mod.push(`Low BMD (T ${t.toFixed(1)})`);
  if (!isNaN(fm) && fm >= 10) mod.push(`FRAX major ${fm}% ≥ 10%`);
  if (i.fallRisk) mod.push("High fall risk");
  if (i.smoker) mod.push("Current smoker");
  if (i.lowBMI) mod.push("Low BMI (<20)");
  if (mod.length) return { band: "moderate", reasons: mod };

  return { band: "low", reasons: ["No clear moderate/high risk features"] };
}

function recommend(i: Inputs, band: RiskBand) {
  const contraindications: string[] = [];
  if (i.ckd) contraindications.push("eGFR <35 → avoid oral/IV bisphosphonate; consider denosumab");
  if (i.esophDisease) contraindications.push("Esophageal disease → avoid oral bisphosphonate; use IV zoledronic acid or denosumab");
  if (i.hypocalcemia) contraindications.push("Correct hypocalcemia + vit D BEFORE any antiresorptive");
  if (i.pregnancy) contraindications.push("Pregnancy / planned pregnancy → avoid bisphosphonate & denosumab");

  const universal = [
    "Calcium 1000–1200 mg/day (diet + supplement)",
    "Vitamin D 800–1000 IU/day (target 25-OH-D ≥30 ng/mL)",
    "Weight-bearing + resistance exercise",
    "Smoking cessation, limit alcohol (<3 U/day)",
    "Fall-risk assessment · home safety",
    "Use lowest effective steroid dose · steroid-sparing agents where possible",
  ];

  let firstLine = "";
  let alternatives: string[] = [];
  let action = "";

  if (band === "low") {
    firstLine = "No pharmacologic therapy indicated";
    action = "Universal measures. Reassess risk yearly and after any dose change.";
  } else if (band === "moderate") {
    firstLine = "Oral bisphosphonate (alendronate 70 mg PO weekly OR risedronate 35 mg PO weekly) — continue for as long as systemic steroids are given; typical minimum 3–5 years, then reassess for a drug holiday (fracture risk + BMD)";
    alternatives = ["Zoledronic acid 5 mg IV yearly (if oral intolerant)", "Denosumab 60 mg SC q6 months (if CKD or oral CI)"];
    action = "Start prophylaxis; DXA at baseline and every 1–2 years.";
  } else if (band === "high") {
    firstLine = "Oral bisphosphonate first line (alendronate 70 mg PO weekly OR risedronate 35 mg PO weekly) — continue for the duration of steroid therapy; usual course 5 years oral (3 years if IV zoledronate) before considering a holiday";
    alternatives = [
      "Zoledronic acid 5 mg IV yearly",
      "Denosumab 60 mg SC q6 months (esp. if CKD, esophageal disease)",
      "Teriparatide 20 mcg SC daily (if very high risk or bisphosphonate failure)",
    ];
    action = "Treat now; do not delay for DXA. Reassess at 12 months.";
  } else {
    firstLine = "Anabolic therapy preferred: Teriparatide 20 mcg SC daily × up to 24 months";
    alternatives = [
      "Zoledronic acid 5 mg IV yearly",
      "Denosumab 60 mg SC q6 months",
      "Follow anabolic with antiresorptive (never stop denosumab without transition)",
    ];
    action = "Immediate treatment. Rheumatology / endocrinology referral.";
  }

  return { universal, firstLine, alternatives, action, contraindications };
}

const BAND_META: Record<RiskBand, { label: string; tone: "success" | "info" | "warning" | "danger" }> = {
  low:      { label: "Low risk",       tone: "success" },
  moderate: { label: "Moderate risk",  tone: "info" },
  high:     { label: "High risk",      tone: "warning" },
  veryHigh: { label: "Very high risk", tone: "danger" },
};

function GiopApp() {
  const [i, setI] = useState<Inputs>(DEFAULTS);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setI((s) => ({ ...s, [k]: v }));

  const { band, reasons } = useMemo(() => classify(i), [i]);
  const rec = useMemo(() => recommend(i, band), [i, band]);
  const meta = BAND_META[band];

  const copySummary = () => {
    const t = [
      `GIOP assessment`,
      `Age ${i.age || "?"} · Sex ${i.sex || "?"}${i.postmenopausal ? " · postmenopausal" : ""}`,
      `Prednisone ${i.prednisoneDose || "?"} mg/d × ${i.durationMonths || "?"} months`,
      `T-score (femoral neck/total hip): ${i.tScore || "—"}`,
      `FRAX major ${i.fraxMajor || "—"}% · hip ${i.fraxHip || "—"}%`,
      ``,
      `Risk: ${meta.label}`,
      `Reasons: ${reasons.join("; ")}`,
      ``,
      `First line: ${rec.firstLine}`,
      rec.alternatives.length ? `Alternatives: ${rec.alternatives.join(" | ")}` : "",
      `Action: ${rec.action}`,
      rec.contraindications.length ? `Cautions: ${rec.contraindications.join("; ")}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(t);
    toast.success("Summary copied");
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Glucocorticoid-induced osteoporosis (GIOP)"
        subtitle="Adult algorithm · ACR / IOF-aligned bone protection for steroid users"
        icon={<Bone className="h-5 w-5" />}
      >
        <Callout tone="info" title="Rule of thumb">
          If systemic steroids are likely to continue and fracture risk is not clearly low, start bone protection early rather than waiting for a fracture. Fracture risk rises within the first 3 months of therapy.
        </Callout>
        <ol className="ml-5 list-decimal space-y-1 text-sm">
          <li><b>Confirm exposure:</b> systemic steroids expected &gt;3 months, or shorter high-dose bursts.</li>
          <li><b>Universal measures:</b> calcium, vitamin D, exercise, smoking cessation, fall reduction, baseline renal + 25-OH-D.</li>
          <li><b>Estimate fracture risk:</b> clinical factors + DXA (femoral neck / total hip); FRAX adjusted for steroid dose.</li>
          <li><b>Treat if moderate/high risk:</b> oral bisphosphonate first line; IV bisphosphonate, denosumab, or teriparatide when appropriate.</li>
          <li><b>Reassess:</b> BMD + risk during ongoing therapy and after taper/discontinuation.</li>
        </ol>
      </SectionCard>

      <SectionCard title="Patient inputs" icon={<Calculator className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="text-xs">Age (yrs)</Label>
            <Input type="number" value={i.age} onChange={(e) => set("age", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Sex</Label>
            <select
              value={i.sex}
              onChange={(e) => set("sex", e.target.value as Inputs["sex"])}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <Checkbox checked={i.postmenopausal} onCheckedChange={(v) => set("postmenopausal", !!v)} />
            Postmenopausal
          </label>

          <div>
            <Label className="text-xs">Prednisone equivalent (mg/day)</Label>
            <Input type="number" value={i.prednisoneDose} onChange={(e) => set("prednisoneDose", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Expected duration (months)</Label>
            <Input type="number" value={i.durationMonths} onChange={(e) => set("durationMonths", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">T-score (femoral neck / total hip)</Label>
            <Input type="number" step="0.1" value={i.tScore} onChange={(e) => set("tScore", e.target.value)} />
          </div>

          <div>
            <Label className="text-xs">FRAX major (%) — steroid-adjusted</Label>
            <Input type="number" step="0.1" value={i.fraxMajor} onChange={(e) => set("fraxMajor", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">FRAX hip (%)</Label>
            <Input type="number" step="0.1" value={i.fraxHip} onChange={(e) => set("fraxHip", e.target.value)} />
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {([
            ["priorFragilityFx", "Prior fragility fracture"],
            ["hipOrVertebralFx", "Prior hip or vertebral fracture"],
            ["fallRisk", "High fall risk"],
            ["smoker", "Current smoker"],
            ["lowBMI", "Low BMI (<20)"],
            ["ckd", "CKD (eGFR <35)"],
            ["esophDisease", "Esophageal disease / achalasia / reflux"],
            ["hypocalcemia", "Uncorrected hypocalcemia / vit D deficiency"],
            ["pregnancy", "Pregnancy or planning pregnancy"],
          ] as [keyof Inputs, string][]).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <Checkbox checked={i[k] as boolean} onCheckedChange={(v) => set(k, !!v as never)} />
              {label}
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Risk stratification & recommendation"
        icon={<ShieldAlert className="h-5 w-5" />}
        tone={meta.tone === "danger" ? "danger" : meta.tone === "warning" ? "warning" : "default"}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Risk band" value={meta.label} />
          <Stat label="Steroid exposure" value={`${i.prednisoneDose || "?"} mg × ${i.durationMonths || "?"} mo`} />
          <Stat label="Index T-score" value={i.tScore || "—"} />
        </div>
        <div className="mt-2">
          <div className="mb-1 text-xs font-semibold text-muted-foreground">Why this band</div>
          <div className="flex flex-wrap gap-1">
            {reasons.map((r) => <Chip key={r} tone={meta.tone === "success" ? "info" : meta.tone}>{r}</Chip>)}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <KeyRow k="First line" v={rec.firstLine} />
          {rec.alternatives.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Alternatives</div>
              <ul className="ml-4 list-disc text-sm">
                {rec.alternatives.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
          )}
          <KeyRow k="Action" v={rec.action} />
        </div>

        {rec.contraindications.length > 0 && (
          <Callout tone="danger" title="Cautions / contraindications">
            <ul className="ml-4 list-disc">{rec.contraindications.map((c) => <li key={c}>{c}</li>)}</ul>
          </Callout>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={copySummary}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Copy summary
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 h-3.5 w-3.5" /> Print
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Universal measures (all patients on steroids)" icon={<CheckCircle2 className="h-5 w-5" />}>
        <ul className="ml-5 list-disc space-y-1 text-sm">
          {rec.universal.map((u) => <li key={u}>{u}</li>)}
        </ul>
      </SectionCard>

      <SectionCard title="Medication reference" icon={<Pill className="h-5 w-5" />}>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Drug</th>
                <th className="p-2">Dose · route</th>
                <th className="p-2">Role in GIOP</th>
                <th className="p-2">Key cautions</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Alendronate", "70 mg PO weekly", "First line, oral", "Esophageal disease, eGFR <35, hypocalcemia"],
                ["Risedronate", "35 mg PO weekly (or 150 mg monthly)", "First line, oral", "As above"],
                ["Zoledronic acid", "5 mg IV once yearly", "IV option; poor adherence, esophageal disease", "eGFR <35, hypocalcemia, acute-phase reaction"],
                ["Denosumab", "60 mg SC every 6 months", "CKD, oral intolerance, high risk", "Do NOT interrupt (rebound vertebral #); hypocalcemia; infection"],
                ["Teriparatide", "20 mcg SC daily × ≤24 months", "Very high risk / severe / anabolic preferred", "Prior skeletal radiation, hypercalcemia; follow with antiresorptive"],
              ].map((r) => (
                <tr key={r[0]} className="border-t border-border">
                  <td className="p-2 font-medium">{r[0]}</td>
                  <td className="p-2">{r[1]}</td>
                  <td className="p-2 text-muted-foreground">{r[2]}</td>
                  <td className="p-2 text-muted-foreground">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Monitoring & reassessment" icon={<ClipboardList className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-semibold">While on steroids</div>
            <KeyRow k="DXA" v="Baseline; every 1–2 years while on therapy" />
            <KeyRow k="25-OH vit D" v="Baseline; recheck at 3 months if repleting" />
            <KeyRow k="Calcium, renal" v="Before and after starting antiresorptive" />
            <KeyRow k="Height / vertebral #" v="Yearly (loss ≥2 cm → imaging)" />
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold">After steroid taper / stop</div>
            <KeyRow k="Continue therapy" v="If risk remains moderate/high or on ≥2.5 mg/d ongoing" />
            <KeyRow k="Reassess" v="DXA + FRAX 1–2 y after steroid stop before any holiday" />
            <KeyRow k="Denosumab" v="Never stop without transition to bisphosphonate" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Drug holiday guidance" icon={<ClipboardList className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-semibold">When to consider a holiday</div>
            <KeyRow k="Steroids stopped" v="Systemic glucocorticoids discontinued (or ≤2.5 mg/d prednisolone)" />
            <KeyRow k="Risk now low" v="FRAX below intervention threshold AND T-score > −2.5 at all sites" />
            <KeyRow k="No incident #" v="No fragility fracture on treatment" />
            <KeyRow k="Minimum course met" v="Oral BP ≥5 y · IV zoledronate ≥3 y" />
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold">Do NOT hold if</div>
            <KeyRow k="Ongoing steroids" v="Any prednisolone ≥2.5 mg/d or expected re-exposure" />
            <KeyRow k="High risk" v="Prior hip/vertebral #, T-score ≤ −2.5, or FRAX above threshold" />
            <KeyRow k="Denosumab" v="No holiday — rebound vertebral #; must transition to BP" />
            <KeyRow k="Teriparatide/romosozumab" v="No holiday — always follow with antiresorptive" />
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Drug</th>
                <th className="p-2 text-left">Treat for</th>
                <th className="p-2 text-left">Holiday length</th>
                <th className="p-2 text-left">Reassess</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">Alendronate / risedronate (oral)</td>
                <td className="p-2">5 years</td>
                <td className="p-2">1–2 years</td>
                <td className="p-2">DXA + FRAX; resume if T-score falls or new #</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Zoledronic acid (IV)</td>
                <td className="p-2">3 years</td>
                <td className="p-2">2–3 years</td>
                <td className="p-2">DXA + FRAX at end of holiday</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Denosumab</td>
                <td className="p-2">Indefinite</td>
                <td className="p-2"><b>None</b></td>
                <td className="p-2">If stopping → alendronate/zoledronate within 6 mo of last dose</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Teriparatide</td>
                <td className="p-2">≤24 months</td>
                <td className="p-2"><b>None</b></td>
                <td className="p-2">Follow with bisphosphonate or denosumab to preserve BMD</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 rounded-md border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm">
          <b>Restart therapy</b> if steroids restarted at ≥2.5 mg/d, new fragility fracture, T-score decline &gt;5% at spine/hip, or FRAX rises above intervention threshold during the holiday.
        </div>
      </SectionCard>
    </div>
  );
}

export default GiopApp;
