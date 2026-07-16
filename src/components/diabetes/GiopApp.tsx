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
        <HolidayDecisionTool />

        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold">Rule summary — with citations</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">When to consider a holiday</div>
              <KeyRow k="Steroids stopped" v={<span>Systemic glucocorticoids discontinued (or ≤2.5 mg/d prednisolone) <Ref n={1} /><Ref n={2} /></span>} />
              <KeyRow k="Risk now low" v={<span>FRAX below intervention threshold AND T-score &gt; −2.5 at all sites <Ref n={2} /><Ref n={4} /></span>} />
              <KeyRow k="No incident #" v={<span>No fragility fracture while on therapy <Ref n={3} /></span>} />
              <KeyRow k="Minimum course met" v={<span>Oral BP ≥5 y · IV zoledronate ≥3 y <Ref n={3} /><Ref n={5} /></span>} />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Do NOT hold if</div>
              <KeyRow k="Ongoing steroids" v={<span>Prednisolone ≥2.5 mg/d or planned re-exposure <Ref n={1} /></span>} />
              <KeyRow k="High risk" v={<span>Prior hip/vertebral #, T-score ≤ −2.5, or FRAX above threshold <Ref n={2} /><Ref n={4} /></span>} />
              <KeyRow k="Denosumab" v={<span>No holiday — rebound vertebral # within 6–18 mo; must transition to BP <Ref n={6} /><Ref n={7} /></span>} />
              <KeyRow k="Teriparatide/romosozumab" v={<span>No holiday — always follow with antiresorptive <Ref n={2} /></span>} />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Drug</th>
                <th className="p-2 text-left">Treat for</th>
                <th className="p-2 text-left">Holiday length</th>
                <th className="p-2 text-left">Reassess</th>
                <th className="p-2 text-left">Evidence</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t align-top">
                <td className="p-2">Alendronate / risedronate (oral)</td>
                <td className="p-2">5 years</td>
                <td className="p-2">1–2 years</td>
                <td className="p-2">DXA + FRAX; resume if T-score falls or new #</td>
                <td className="p-2 text-xs text-muted-foreground">FLEX (alendronate 5 vs 10 y) &amp; VERT extension: continued benefit past 5 y limited except in high-risk patients. <Ref n={3} /><Ref n={5} /></td>
              </tr>
              <tr className="border-t align-top">
                <td className="p-2">Zoledronic acid (IV)</td>
                <td className="p-2">3 years</td>
                <td className="p-2">2–3 years</td>
                <td className="p-2">DXA + FRAX at end of holiday</td>
                <td className="p-2 text-xs text-muted-foreground">HORIZON-PFT extension: BMD/fracture benefit sustained ~3 y after stopping in low-risk patients. <Ref n={8} /></td>
              </tr>
              <tr className="border-t align-top">
                <td className="p-2">Denosumab</td>
                <td className="p-2">Indefinite</td>
                <td className="p-2"><b>None</b></td>
                <td className="p-2">If stopping → alendronate or single zoledronate within 6 mo of the last (missed) dose</td>
                <td className="p-2 text-xs text-muted-foreground">FREEDOM extension &amp; post-hoc: rebound multiple vertebral # 6–18 mo after discontinuation. <Ref n={6} /><Ref n={7} /></td>
              </tr>
              <tr className="border-t align-top">
                <td className="p-2">Teriparatide / abaloparatide</td>
                <td className="p-2">≤24 months lifetime</td>
                <td className="p-2"><b>None</b></td>
                <td className="p-2">Follow with bisphosphonate or denosumab to preserve BMD</td>
                <td className="p-2 text-xs text-muted-foreground">DATA-Switch: BMD lost within 1 y if no antiresorptive follow-on. <Ref n={9} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 rounded-md border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm">
          <b>Restart therapy</b> if steroids restarted at ≥2.5 mg/d, new fragility fracture, T-score decline &gt;5% at spine/hip, or FRAX rises above intervention threshold during the holiday. <Ref n={2} /><Ref n={3} />
        </div>

        <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          <div className="mb-1 font-semibold text-foreground">References</div>
          <ol className="list-decimal space-y-0.5 pl-4">
            <li id="giop-holiday-ref-1">Buckley L et al. <b>2017 ACR Guideline for the Prevention and Treatment of Glucocorticoid-Induced Osteoporosis.</b> Arthritis Rheumatol 2017;69:1521.</li>
            <li id="giop-holiday-ref-2">Humphrey MB et al. <b>2022 ACR Guideline for GIOP Prevention and Treatment.</b> Arthritis Care Res 2023;75:2405.</li>
            <li id="giop-holiday-ref-3">Adler RA et al. <b>Managing osteoporosis in patients on long-term bisphosphonate treatment: ASBMR Task Force Report.</b> J Bone Miner Res 2016;31:16.</li>
            <li id="giop-holiday-ref-4">Camacho PM et al. <b>AACE/ACE Postmenopausal Osteoporosis Guidelines — 2020 Update.</b> Endocr Pract 2020;26(S1):1.</li>
            <li id="giop-holiday-ref-5">Black DM et al. <b>FLEX trial: Alendronate 5 vs 10 years.</b> JAMA 2006;296:2927.</li>
            <li id="giop-holiday-ref-6">Cummings SR et al. <b>Vertebral fractures after denosumab discontinuation (FREEDOM &amp; Extension).</b> J Bone Miner Res 2018;33:190.</li>
            <li id="giop-holiday-ref-7">Tsourdi E et al. <b>Discontinuation of denosumab: ECTS position paper 2020.</b> J Clin Endocrinol Metab 2021;106:264.</li>
            <li id="giop-holiday-ref-8">Black DM et al. <b>HORIZON-PFT extension: 3 additional years of zoledronic acid.</b> J Bone Miner Res 2012;27:243.</li>
            <li id="giop-holiday-ref-9">Leder BZ et al. <b>DATA-Switch: sequential teriparatide → denosumab.</b> Lancet 2015;386:1147.</li>
          </ol>
        </div>
      </SectionCard>
    </div>
  );
}

export default GiopApp;

// ============================================================
// Drug-holiday decision tool
// ============================================================

function Ref({ n }: { n: number }) {
  return (
    <sup className="ml-0.5 text-[10px] font-semibold text-primary">
      <a href={`#giop-holiday-ref-${n}`} aria-label={`Reference ${n}`}>[{n}]</a>
    </sup>
  );
}

type DrugChoice = "" | "oralBP" | "zoledronate" | "denosumab" | "teriparatide";

interface HolidayInputs {
  drug: DrugChoice;
  monthsOnDrug: string;
  steroidsOngoing: boolean;
  currentPrednDose: string;
  reexposureLikely: boolean;
  tScore: string;
  fraxMajor: string;
  incidentFxOnTx: boolean;
  hipOrVertebralFxEver: boolean;
  fallRisk: boolean;
  ckdSevere: boolean;
  denosumabMonthsSinceLast: string;
  fraxThresholdMajor: string;
}

const HOLIDAY_DEFAULTS: HolidayInputs = {
  drug: "", monthsOnDrug: "",
  steroidsOngoing: false, currentPrednDose: "", reexposureLikely: false,
  tScore: "", fraxMajor: "",
  incidentFxOnTx: false, hipOrVertebralFxEver: false, fallRisk: false, ckdSevere: false,
  denosumabMonthsSinceLast: "",
  fraxThresholdMajor: "20",
};

function validateHoliday(i: HolidayInputs): string[] {
  const errs: string[] = [];
  if (!i.drug) errs.push("Select the current antiresorptive/anabolic drug.");
  const months = parseFloat(i.monthsOnDrug);
  if (i.drug && (!isFinite(months) || months < 0)) errs.push("Enter months on current drug (≥0).");
  if (i.drug && isFinite(months) && months > 480) errs.push("Months on drug looks implausible (>40 y).");

  const dose = parseFloat(i.currentPrednDose);
  if (i.steroidsOngoing) {
    if (!isFinite(dose) || dose < 0) errs.push("Enter current prednisolone-equivalent dose (mg/day).");
    if (isFinite(dose) && dose > 200) errs.push("Prednisolone dose >200 mg/d looks implausible — check units.");
  } else if (i.currentPrednDose.trim() !== "" && isFinite(dose) && dose >= 2.5) {
    errs.push('"Steroids ongoing" is unchecked but a dose ≥2.5 mg/d is entered — resolve the contradiction.');
  }

  const t = parseFloat(i.tScore);
  if (i.tScore.trim() !== "" && (!isFinite(t) || t < -6 || t > 3)) errs.push("T-score out of range (−6 to +3).");
  const fm = parseFloat(i.fraxMajor);
  if (i.fraxMajor.trim() !== "" && (!isFinite(fm) || fm < 0 || fm > 100)) errs.push("FRAX major must be 0–100 %.");
  const thr = parseFloat(i.fraxThresholdMajor);
  if (!isFinite(thr) || thr < 5 || thr > 40) errs.push("FRAX intervention threshold must be 5–40 %.");

  if (i.drug === "denosumab") {
    const dm = parseFloat(i.denosumabMonthsSinceLast);
    if (i.denosumabMonthsSinceLast.trim() !== "" && (!isFinite(dm) || dm < 0 || dm > 60)) {
      errs.push("Months since last denosumab dose must be 0–60.");
    }
  }
  if (i.incidentFxOnTx && !i.hipOrVertebralFxEver) {
    errs.push('If a fragility fracture occurred on treatment, "any prior hip/vertebral fracture" should also be checked.');
  }
  return errs;
}

type HolidayVerdict = "hold" | "continue" | "transition" | "blocked";

function decideHoliday(i: HolidayInputs): { verdict: HolidayVerdict; headline: string; reasons: string[]; plan: string[] } {
  const reasons: string[] = [];
  const plan: string[] = [];
  const months = parseFloat(i.monthsOnDrug) || 0;
  const t = i.tScore.trim() === "" ? NaN : parseFloat(i.tScore);
  const fm = i.fraxMajor.trim() === "" ? NaN : parseFloat(i.fraxMajor);
  const thr = parseFloat(i.fraxThresholdMajor) || 20;

  if (i.drug === "denosumab") {
    reasons.push("Denosumab has no drug-holiday: rebound multiple vertebral # 6–18 mo after stopping.");
    plan.push("Continue denosumab 60 mg SC q6mo on schedule.");
    plan.push("If discontinuation is unavoidable, give alendronate 70 mg weekly ×12 mo OR one 5 mg IV zoledronate within 6 mo of the last (missed) dose.");
    const dm = parseFloat(i.denosumabMonthsSinceLast);
    if (isFinite(dm) && dm > 7) {
      return { verdict: "blocked", headline: "URGENT: Denosumab overdue — rebound risk window", reasons: [`Last dose ${dm} mo ago (>7 mo).`, ...reasons], plan: ["Give a bridging antiresorptive NOW (single IV zoledronate 5 mg) and reassess.", ...plan] };
    }
    return { verdict: "transition", headline: "Continue denosumab — no holiday permitted", reasons, plan };
  }
  if (i.drug === "teriparatide") {
    reasons.push("Anabolic therapy has no holiday: BMD gains are lost within ~12 mo without follow-on antiresorptive.");
    plan.push("Complete ≤24 mo lifetime course, then start alendronate, zoledronate, or denosumab immediately.");
    if (months >= 24) plan.unshift("Lifetime 24-month cap reached — start antiresorptive now.");
    return { verdict: "transition", headline: "Continue → sequence to antiresorptive", reasons, plan };
  }

  const isOral = i.drug === "oralBP";
  const minCourse = isOral ? 60 : 36;
  const minCourseLabel = isOral ? "5 years" : "3 years";

  if (i.steroidsOngoing) reasons.push("Systemic glucocorticoids still active — GIOP risk persists.");
  const dose = parseFloat(i.currentPrednDose);
  if (i.steroidsOngoing && isFinite(dose) && dose >= 2.5) reasons.push(`Prednisolone ${dose} mg/d ≥ 2.5 mg/d threshold.`);
  if (i.reexposureLikely) reasons.push("Steroid re-exposure anticipated within the holiday window.");
  if (i.incidentFxOnTx) reasons.push("Incident fragility fracture on treatment — treatment failure, not holiday candidate.");
  if (i.hipOrVertebralFxEver) reasons.push("Prior hip or vertebral fragility fracture — remains high risk.");
  if (isFinite(t) && t <= -2.5) reasons.push(`T-score ${t.toFixed(1)} ≤ −2.5 at lowest site.`);
  if (isFinite(fm) && fm >= thr) reasons.push(`FRAX major ${fm}% ≥ intervention threshold ${thr}%.`);
  if (months < minCourse) reasons.push(`Minimum course not met: ${months} mo on drug (need ≥ ${minCourseLabel}).`);

  if (reasons.length > 0) {
    plan.push("Continue current bisphosphonate; reassess DXA + FRAX in 12 mo.");
    if (i.ckdSevere && !isOral) plan.push("eGFR <35 — avoid further IV zoledronate; discuss denosumab.");
    return { verdict: "continue", headline: "Do NOT hold — continue therapy", reasons, plan };
  }

  const holidayLen = isOral ? "1–2 years" : "2–3 years";
  plan.push(`Pause ${isOral ? "oral bisphosphonate" : "IV zoledronate"} for ${holidayLen}.`);
  plan.push("DXA + FRAX at 12–24 mo (sooner if new risk factor).");
  plan.push("Restart if steroids restarted ≥2.5 mg/d, new fragility #, T-score drops >5 % at spine/hip, or FRAX ≥ threshold.");
  return {
    verdict: "hold",
    headline: "Drug holiday appropriate",
    reasons: [
      "Steroids stopped (or <2.5 mg/d) with no planned re-exposure.",
      "No fracture on treatment and no historical hip/vertebral #.",
      `Current risk below threshold${isFinite(fm) ? "" : " — FRAX not entered"}${isFinite(t) ? "" : "; T-score not entered"}.`,
      `Minimum treatment course met (${months} mo ≥ ${minCourseLabel}).`,
    ],
    plan,
  };
}

function HolidayDecisionTool() {
  const [i, setI] = useState<HolidayInputs>(HOLIDAY_DEFAULTS);
  const errors = useMemo(() => validateHoliday(i), [i]);
  const decision = useMemo(() => (errors.length === 0 && i.drug ? decideHoliday(i) : null), [i, errors]);

  const set = <K extends keyof HolidayInputs>(k: K, v: HolidayInputs[K]) =>
    setI((prev) => ({ ...prev, [k]: v }));

  const verdictTone: Record<HolidayVerdict, string> = {
    hold: "border-success/50 bg-success/10 text-success",
    continue: "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    transition: "border-info/50 bg-info/10 text-info",
    blocked: "border-destructive/60 bg-destructive/10 text-destructive",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-md border border-border bg-card p-4">
        <div className="text-sm font-semibold">Patient-factor checklist</div>

        <div className="space-y-1">
          <Label htmlFor="hd-drug">Current bone drug</Label>
          <select
            id="hd-drug"
            value={i.drug}
            onChange={(e) => set("drug", e.target.value as DrugChoice)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">— select drug —</option>
            <option value="oralBP">Oral bisphosphonate (alendronate / risedronate)</option>
            <option value="zoledronate">IV zoledronic acid</option>
            <option value="denosumab">Denosumab</option>
            <option value="teriparatide">Teriparatide / abaloparatide</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="hd-months">Months on this drug</Label>
            <Input id="hd-months" inputMode="numeric" value={i.monthsOnDrug} onChange={(e) => set("monthsOnDrug", e.target.value)} placeholder="e.g. 60" />
          </div>
          {i.drug === "denosumab" && (
            <div className="space-y-1">
              <Label htmlFor="hd-denolast">Months since last dose</Label>
              <Input id="hd-denolast" inputMode="numeric" value={i.denosumabMonthsSinceLast} onChange={(e) => set("denosumabMonthsSinceLast", e.target.value)} placeholder="e.g. 6" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="hd-ster" checked={i.steroidsOngoing} onCheckedChange={(v) => set("steroidsOngoing", !!v)} />
          <Label htmlFor="hd-ster" className="cursor-pointer text-sm font-normal">Systemic glucocorticoids ongoing</Label>
        </div>
        {i.steroidsOngoing && (
          <div className="space-y-1">
            <Label htmlFor="hd-dose">Prednisolone equivalent (mg/day)</Label>
            <Input id="hd-dose" inputMode="decimal" value={i.currentPrednDose} onChange={(e) => set("currentPrednDose", e.target.value)} placeholder="e.g. 5" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Checkbox id="hd-reexp" checked={i.reexposureLikely} onCheckedChange={(v) => set("reexposureLikely", !!v)} />
          <Label htmlFor="hd-reexp" className="cursor-pointer text-sm font-normal">Steroid re-exposure likely (flare-prone disease)</Label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="hd-t">Lowest T-score</Label>
            <Input id="hd-t" inputMode="decimal" value={i.tScore} onChange={(e) => set("tScore", e.target.value)} placeholder="e.g. −2.1" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hd-frax">FRAX major (%)</Label>
            <Input id="hd-frax" inputMode="decimal" value={i.fraxMajor} onChange={(e) => set("fraxMajor", e.target.value)} placeholder="e.g. 12" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="hd-thr">FRAX intervention threshold (%)</Label>
          <Input id="hd-thr" inputMode="decimal" value={i.fraxThresholdMajor} onChange={(e) => set("fraxThresholdMajor", e.target.value)} placeholder="20" />
        </div>

        <div className="grid grid-cols-1 gap-1.5 pt-1">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={i.incidentFxOnTx} onCheckedChange={(v) => set("incidentFxOnTx", !!v)} /> Fragility fracture <b>on</b> treatment</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={i.hipOrVertebralFxEver} onCheckedChange={(v) => set("hipOrVertebralFxEver", !!v)} /> Ever hip or vertebral fragility #</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={i.fallRisk} onCheckedChange={(v) => set("fallRisk", !!v)} /> Recurrent falls</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={i.ckdSevere} onCheckedChange={(v) => set("ckdSevere", !!v)} /> eGFR &lt; 35 mL/min/1.73 m²</label>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setI(HOLIDAY_DEFAULTS)}>Reset</Button>
        </div>
      </div>

      <div className="space-y-3">
        {errors.length > 0 ? (
          <Callout tone="warning" title="Fix these before a recommendation is issued">
            <ul className="ml-5 list-disc space-y-0.5 text-sm">
              {errors.map((e, k) => <li key={k}>{e}</li>)}
            </ul>
          </Callout>
        ) : decision ? (
          <>
            <div className={cnJoin("rounded-md border-l-4 p-3", verdictTone[decision.verdict])}>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {decision.verdict === "blocked" ? "Safety alert" : "Recommendation"}
              </div>
              <div className="mt-0.5 text-base font-semibold">{decision.headline}</div>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reasoning</div>
              <ul className="ml-5 list-disc space-y-0.5 text-sm">
                {decision.reasons.map((r, k) => <li key={k}>{r}</li>)}
              </ul>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan</div>
              <ul className="ml-5 list-disc space-y-0.5 text-sm">
                {decision.plan.map((r, k) => <li key={k}>{r}</li>)}
              </ul>
            </div>
          </>
        ) : (
          <Callout tone="info" title="Enter patient factors">
            Select a drug and fill in the checklist to receive a hold-vs-continue recommendation with cited reasoning.
          </Callout>
        )}
        <Stat label="Guideline anchors" value="ACR 2022 · Endocrine Soc · ASBMR" hint="See numbered references below." />
      </div>
    </div>
  );
}

function cnJoin(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}
