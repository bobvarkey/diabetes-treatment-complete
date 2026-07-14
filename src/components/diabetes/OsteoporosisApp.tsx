import { useMemo, useState } from "react";
import { Bone, Activity, Pill, ClipboardList, AlertTriangle, Copy, Printer, FileText, FileDown, FlaskConical, Search, GitBranch, RotateCcw, ArrowRight, Scale } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { SectionCard, KeyRow, Pill as Chip, Callout, Stat } from "./shared";
import { stratify, checkDxaSite, discordanceGuidance, type DxaSite, type FractureType } from "./osteoporosisLogic";

interface State {
  fractureType: FractureType;
  priorHipOrVertebral: boolean;
  tScore: string;
  dxaSite: DxaSite | "";
  fraxMajor: string;
  fraxHip: string;
  recentMultiple: boolean;
  multipleVertebral: boolean;
  glucocorticoid: boolean;
  advancedAge: boolean;
  highFallRisk: boolean;
  crCl: string;
  giComorbid: boolean;
  cardiacStroke: boolean;
  skeletalMalig: boolean;
}

const initial: State = {
  fractureType: "none",
  priorHipOrVertebral: false,
  tScore: "",
  dxaSite: "",
  fraxMajor: "",
  fraxHip: "",
  recentMultiple: false,
  multipleVertebral: false,
  glucocorticoid: false,
  advancedAge: false,
  highFallRisk: false,
  crCl: "",
  giComorbid: false,
  cardiacStroke: false,
  skeletalMalig: false,
};

function OsteoporosisApp() {
  const [s, setS] = useState<State>(initial);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  const { risk, reasons } = useMemo(() => stratify(s), [s]);
  const crCl = parseFloat(s.crCl);
  const lowCrCl = !isNaN(crCl) && crCl < 35;

  const riskLabel = risk === "veryHigh" ? "Very high risk" : risk === "high" ? "High risk" : "Moderate risk";
  const riskTone = risk === "veryHigh" ? "danger" : risk === "high" ? "warning" : "info";

  const summary = useMemo(() => {
    const lines = [
      "OSTEOPOROSIS ASSESSMENT",
      `Fracture type: ${s.fractureType}`,
      `T-score: ${s.tScore || "—"}   FRAX major: ${s.fraxMajor || "—"}%   FRAX hip: ${s.fraxHip || "—"}%`,
      `CrCl: ${s.crCl || "—"} mL/min`,
      "",
      `RISK CATEGORY: ${riskLabel}`,
      `Reasons: ${reasons.join("; ")}`,
      "",
      "RECOMMENDATION:",
      risk === "veryHigh"
        ? "Start anabolic (teriparatide / abaloparatide / romosozumab) → follow with antiresorptive."
        : risk === "high"
          ? "Potent antiresorptive: oral or IV bisphosphonate, or denosumab."
          : "Oral bisphosphonate; denosumab alternative. Optimize Ca/vitamin D, lifestyle.",
      lowCrCl ? "⚠ CrCl < 35 mL/min: avoid bisphosphonates; prefer denosumab (monitor Ca)." : "",
      s.cardiacStroke ? "⚠ Recent MI/stroke: romosozumab contraindicated." : "",
      s.skeletalMalig ? "⚠ Skeletal malignancy / prior bone radiation: avoid teriparatide/abaloparatide." : "",
      s.giComorbid ? "⚠ Significant GI disease: avoid oral bisphosphonates; use IV or denosumab." : "",
      "",
      "ADJUNCTS: Calcium 1000–1200 mg/d, Vitamin D 800–1000 IU/d, fall-prevention, weight-bearing exercise.",
      "FOLLOW-UP: DXA at 12–24 mo; reassess response; plan sequencing (esp. after denosumab/anabolic).",
    ].filter(Boolean);
    return lines.join("\n");
  }, [s, risk, reasons, riskLabel, lowCrCl]);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Osteoporosis after fragility fracture"
        subtitle="Risk stratification + drug selection · IOF/ESCEO 2019, AACE/ACE 2020, AO Foundation"
        icon={<Bone className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Fragility fracture type</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(["none", "hip", "vertebral", "distal radius", "humerus", "other"] as FractureType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => set("fractureType", f)}
                    className={`rounded-md border px-2 py-1 text-xs capitalize ${
                      s.fractureType === f ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Index-site T-score</Label>
                <Input type="number" step="0.1" value={s.tScore} onChange={(e) => set("tScore", e.target.value)} placeholder="-2.5" />
              </div>
              <div>
                <Label className="text-xs">FRAX major %</Label>
                <Input type="number" step="0.1" value={s.fraxMajor} onChange={(e) => set("fraxMajor", e.target.value)} placeholder="20" />
              </div>
              <div>
                <Label className="text-xs">FRAX hip %</Label>
                <Input type="number" step="0.1" value={s.fraxHip} onChange={(e) => set("fraxHip", e.target.value)} placeholder="3" />
              </div>
            </div>

            <div>
              <Label className="text-xs">DXA site of the T-score entered above</Label>
              <select
                value={s.dxaSite}
                onChange={(e) => set("dxaSite", e.target.value as DxaSite | "")}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">— Select site —</option>
                <option value="femoral neck">Femoral neck (default FRAX index)</option>
                <option value="total hip">Total hip</option>
                <option value="lumbar spine">Lumbar spine</option>
                <option value="distal radius">Distal radius (peripheral)</option>
              </select>
              {(() => {
                const c = checkDxaSite(s.dxaSite);
                if (c.severity === "ok") return <div className="mt-1 text-xs text-emerald-600">✓ {c.message}</div>;
                const tone = c.severity === "error" ? "danger" : "warning";
                return <div className="mt-2"><Callout tone={tone as "danger" | "warning"} title={c.severity === "error" ? "Wrong DXA site for FRAX" : "Select DXA site"}>{c.message}</Callout></div>;
              })()}
            </div>

            <Callout tone="info" title="Which T-score to enter?">
              <div className="space-y-1">
                <div>Use the <b>femoral neck T-score</b> (or total hip if your local protocol specifies it) — the index site FRAX and IOF/ESCEO/AACE thresholds are calibrated to.</div>
                <ul className="ml-4 list-disc space-y-0.5">
                  <li><b>Do not</b> use the maximum (best) T-score across sites — it underestimates risk.</li>
                  <li><b>Do not</b> default to the fracture-site T-score (e.g. distal radius); peripheral DXA is not the FRAX calibration site.</li>
                  <li>Fracture type is entered separately and drives risk category / drug class.</li>
                  <li>If lumbar spine T-score is markedly lower than hip, up-adjust risk per IOF/ESCEO discordance rules rather than swapping the FRAX input.</li>
                </ul>
              </div>
            </Callout>

            <div>
              <Label className="text-xs">CrCl (mL/min)</Label>
              <Input type="number" value={s.crCl} onChange={(e) => set("crCl", e.target.value)} placeholder="60" />
            </div>

            <div className="grid grid-cols-1 gap-1.5 rounded-md border border-border p-3 sm:grid-cols-2">
              {[
                ["priorHipOrVertebral", "Prior hip / clinical vertebral fx"],
                ["recentMultiple", "Multiple fractures within 1 y"],
                ["multipleVertebral", "Multiple vertebral fractures"],
                ["glucocorticoid", "Chronic glucocorticoids"],
                ["advancedAge", "Age > 75 y"],
                ["highFallRisk", "High fall risk"],
                ["giComorbid", "Severe GI / esophageal disease"],
                ["cardiacStroke", "MI or stroke within 1 y"],
                ["skeletalMalig", "Skeletal malignancy / prior RT"],
              ].map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={s[k as keyof State] as boolean}
                    onCheckedChange={(v) => set(k as keyof State, Boolean(v) as never)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setS(initial)}>Reset</Button>
          </div>

          {/* Output */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Risk category" value={<span className="capitalize">{riskLabel}</span>} />
              <Stat label="T-score" value={s.tScore || "—"} hint={s.tScore ? (parseFloat(s.tScore) <= -2.5 ? "Osteoporosis" : parseFloat(s.tScore) <= -1 ? "Osteopenia" : "Normal") : ""} />
            </div>

            <Callout tone={riskTone as "info" | "warning" | "danger"} title={riskLabel}>
              <ul className="ml-4 list-disc space-y-0.5">
                {reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </Callout>

            {risk === "veryHigh" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4" /> Phase 1 — Anabolic (12–24 mo)</div>
                <KeyRow k="Teriparatide" v={<span>SC daily · up to 2 y {s.skeletalMalig && <Chip tone="danger">contra</Chip>}</span>} />
                <KeyRow k="Abaloparatide" v={<span>SC daily · up to 2 y {s.skeletalMalig && <Chip tone="danger">contra</Chip>}</span>} />
                <KeyRow k="Romosozumab" v={<span>SC monthly · 12 mo {s.cardiacStroke && <Chip tone="danger">contra (MI/CVA)</Chip>}</span>} />
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold"><Pill className="h-4 w-4" /> Phase 2 — Antiresorptive (sequence)</div>
                <KeyRow k="Denosumab" v="SC 60 mg q6mo (no holiday — must transition)" />
                <KeyRow k="Zoledronic acid" v={<span>IV 5 mg / y × 3 y {lowCrCl && <Chip tone="danger">CrCl low</Chip>}</span>} />
              </div>
            )}

            {risk === "high" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold"><Pill className="h-4 w-4" /> Potent antiresorptive</div>
                <KeyRow k="Alendronate / Risedronate" v={<span>PO weekly {s.giComorbid && <Chip tone="danger">GI contra</Chip>} {lowCrCl && <Chip tone="danger">CrCl low</Chip>}</span>} />
                <KeyRow k="Zoledronic acid" v={<span>IV 5 mg / y {lowCrCl && <Chip tone="danger">avoid</Chip>}</span>} />
                <KeyRow k="Denosumab" v="SC 60 mg q6mo · preferred if CrCl low" />
              </div>
            )}

            {risk === "moderate" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold"><Pill className="h-4 w-4" /> First-line</div>
                <KeyRow k="Oral bisphosphonate" v="Alendronate / Risedronate weekly" />
                <KeyRow k="Denosumab" v="Alternative — long-term commitment" />
                <Callout tone="info">Reassess FRAX / DXA in 2 y. Lifestyle, Ca + Vit D, fall prevention.</Callout>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(summary); toast.success("Summary copied"); }}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "osteoporosis-regimen.txt"; a.click();
                URL.revokeObjectURL(url);
                toast.success("Text file downloaded");
              }}>
                <FileText className="mr-1 h-3.5 w-3.5" /> .txt
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const doc = new jsPDF({ unit: "pt", format: "letter" });
                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);
                const margin = 48;
                const maxWidth = 612 - margin * 2;
                const lines = doc.splitTextToSize(summary, maxWidth);
                let y = margin;
                const lh = 14;
                lines.forEach((line: string) => {
                  if (y > 792 - margin) { doc.addPage(); y = margin; }
                  doc.text(line, margin, y);
                  y += lh;
                });
                doc.save("osteoporosis-regimen.pdf");
                toast.success("PDF downloaded");
              }}>
                <FileDown className="mr-1 h-3.5 w-3.5" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1 h-3.5 w-3.5" /> Print
              </Button>
            </div>

          </div>
        </div>
      </SectionCard>

      <SecondaryCausesPanel />

      <SequentialTherapyPanel />

      <SteroidVCFPanel />






      <SectionCard title="Adjuncts, monitoring & drug holidays" icon={<ClipboardList className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 font-semibold">Universal adjuncts</div>
            <KeyRow k="Calcium" v="1000–1200 mg/d (diet + supplement)" />
            <KeyRow k="Vitamin D" v="800–1000 IU/d; target 25-OH-D ≥ 30 ng/mL" />
            <KeyRow k="Exercise" v="Weight-bearing + resistance 3×/wk" />
            <KeyRow k="Fall prevention" v="Home safety, vision, sedative review" />
          </div>
          <div>
            <div className="mb-1 font-semibold">Follow-up</div>
            <KeyRow k="6–12 mo" v="DXA (LS + hip), CTX/P1NP, adherence check" />
            <KeyRow k="1–2 y" v="Repeat DXA; reassess risk / holiday" />
            <KeyRow k="Suboptimal" v="Check adherence, secondary causes; switch PO→IV or antiresorptive→anabolic" />
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <Callout tone="info" title="Drug holidays">
            <KeyRow k="Oral BP" v="~5 y if risk no longer very high" />
            <KeyRow k="Zoledronic acid" v="~3 y if risk lowered" />
            <KeyRow k="Denosumab" v="No holiday — transition to bisphosphonate" />
            <KeyRow k="Anabolic" v="Teriparatide/abalo 2 y · romo 1 y → antiresorptive" />
          </Callout>
          <Callout tone="warning" title="Special situations">
            <div><b>Hip fracture:</b> initiate treatment in hospital (AO Foundation pathway).</div>
            <div><b>Steroid-induced (high risk):</b> denosumab or teriparatide.</div>
            <div><b>Men, very high risk:</b> teriparatide or romosozumab.</div>
          </Callout>
        </div>
        <Callout tone="danger" title="Key contraindications">
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="danger">Romosozumab — MI/CVA within 1 y</Chip>
            <Chip tone="danger">Bisphosphonates — CrCl &lt; 35</Chip>
            <Chip tone="danger">Oral BP — severe esophageal disease</Chip>
            <Chip tone="danger">Teriparatide/abalo — skeletal malignancy / prior RT</Chip>
            <Chip tone="warning"><AlertTriangle className="mr-1 inline h-3 w-3" />Denosumab — never stop without transition</Chip>
          </div>
        </Callout>
      </SectionCard>
    </div>
  );
}

// ── Secondary causes checklist + baseline labs ─────────────────────────
const CAUSES: { id: string; label: string; labs: string[]; tone?: "warning" | "danger" }[] = [
  { id: "t2dm",       label: "Diabetes mellitus type 2",             labs: ["HbA1c", "fasting glucose"], tone: "warning" },
  { id: "t1dm",       label: "Diabetes mellitus type 1",             labs: ["HbA1c"] },
  { id: "steroids",   label: "Chronic glucocorticoids (≥ 5 mg/d, ≥ 3 mo)", labs: ["morning cortisol if Cushing suspected"] },
  { id: "hypogonad",  label: "Hypogonadism / early menopause",       labs: ["Testosterone (M)", "FSH/LH/estradiol (F)"] },
  { id: "thyroid",    label: "Hyperthyroidism / over-replacement",   labs: ["TSH", "free T4"] },
  { id: "hyperpth",   label: "Primary hyperparathyroidism",          labs: ["PTH", "ionized Ca", "24-h urine Ca"] },
  { id: "ckd",        label: "CKD / renal osteodystrophy",           labs: ["Cr / eGFR", "phosphate", "PTH", "25-OH-D"] },
  { id: "liver",      label: "Chronic liver disease",                 labs: ["LFTs", "INR", "albumin"] },
  { id: "malabs",     label: "Malabsorption / celiac / IBD / bariatric", labs: ["tTG-IgA", "25-OH-D", "albumin", "Mg"] },
  { id: "mm",         label: "Multiple myeloma / MGUS",              labs: ["SPEP + free light chains", "24-h UPEP"] },
  { id: "ai",         label: "Aromatase inhibitor / ADT",             labs: ["baseline DXA if not done"] },
  { id: "ppi",        label: "Chronic PPI / anticonvulsants / heparin", labs: ["25-OH-D", "Mg"] },
  { id: "etoh",       label: "Alcohol > 3 units/d or smoker",        labs: ["LFTs"] },
  { id: "ra",         label: "Rheumatoid arthritis / inflammatory",  labs: ["CRP", "ESR"] },
];

const BASELINE_LABS = [
  "CBC",
  "CMP (Ca, phosphate, albumin, Cr, LFTs)",
  "25-OH vitamin D",
  "Intact PTH",
  "TSH",
  "ESR / CRP",
  "24-h urine calcium + creatinine",
  "HbA1c (screen for T2DM)",
  "SPEP + serum free light chains (age > 50 or unexplained fracture / anemia / ↑ESR)",
  "Testosterone (men) · FSH/LH/estradiol (women where indicated)",
];

const EXTENDED_LABS = [
  "Hemoglobin electrophoresis — if anemia / ethnic risk (sickle-cell, thalassemia)",
  "Iron studies (ferritin, TSAT) — anemia workup",
  "Morning cortisol ± low-dose DST — suspected Cushing / long-term steroids",
  "Free T4 (with TSH) — thyroid disease",
  "24-h urine free cortisol — if Cushing suspected",
  "Tryptase — mastocytosis (unexplained low BMD, flushing, GI sx)",
  "HIV serology — if risk factors",
];


function SecondaryCausesPanel() {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setPicked((p) => ({ ...p, [id]: !p[id] }));

  const targetedLabs = Array.from(new Set(
    CAUSES.filter((c) => picked[c.id]).flatMap((c) => c.labs),
  ));

  const text = [
    "SECONDARY OSTEOPOROSIS WORKUP",
    "",
    "Baseline labs (all patients):",
    ...BASELINE_LABS.map((l) => `  • ${l}`),
    "",
    "Extended labs — if clinically indicated:",
    ...EXTENDED_LABS.map((l) => `  • ${l}`),
    "",
    "Flagged causes:",
    ...CAUSES.filter((c) => picked[c.id]).map((c) => `  • ${c.label}`),
    "",
    "Targeted add-ons:",
    ...targetedLabs.map((l) => `  • ${l}`),
    "",
    "Rule: exclude/treat secondary causes BEFORE starting anti-resorptive or anabolic therapy.",
  ].join("\n");


  return (
    <SectionCard
      title="Secondary causes & baseline labs"
      subtitle="Screen before initiating therapy · T2DM is an independent risk factor (↑ fracture at any BMD)"
      icon={<FlaskConical className="h-5 w-5" />}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Search className="h-4 w-4" /> Secondary-cause checklist
          </div>
          <div className="grid grid-cols-1 gap-1.5 rounded-md border border-border p-3">
            {CAUSES.map((c) => (
              <label key={c.id} className="flex items-start gap-2 text-xs">
                <Checkbox checked={!!picked[c.id]} onCheckedChange={() => toggle(c.id)} />
                <span>
                  {c.label}
                  {c.tone && <span className="ml-1.5"><Chip tone={c.tone}>flag</Chip></span>}
                </span>
              </label>
            ))}
          </div>
          <Callout tone="warning" title="T2DM-specific caveat">
            In T2DM, DXA T-score underestimates fracture risk. Treat at higher T-scores (e.g. ≤ –2.0) and lower FRAX thresholds. Avoid TZDs; optimize glycemia and fall risk (hypoglycemia, neuropathy, vision).
          </Callout>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FlaskConical className="h-4 w-4" /> Baseline labs — all patients
          </div>
          <div className="rounded-md border border-border p-3 text-xs">
            <ul className="ml-4 list-disc space-y-0.5">
              {BASELINE_LABS.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>

          <div className="mt-3 mb-1 text-sm font-semibold">Targeted add-ons ({targetedLabs.length})</div>
          {targetedLabs.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
              Tick any secondary cause to populate targeted labs.
            </div>
          ) : (
            <div className="rounded-md border border-border p-3 text-xs">
              <ul className="ml-4 list-disc space-y-0.5">
                {targetedLabs.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-3 mb-1 text-sm font-semibold">If clinically indicated</div>
          <div className="rounded-md border border-border p-3 text-xs">
            <ul className="ml-4 list-disc space-y-0.5">
              {EXTENDED_LABS.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>


          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(text); toast.success("Workup copied"); }}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "osteoporosis-workup.txt"; a.click();
              URL.revokeObjectURL(url);
            }}>
              <FileText className="mr-1 h-3.5 w-3.5" /> .txt
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const doc = new jsPDF({ unit: "pt", format: "letter" });
              doc.setFont("helvetica", "normal"); doc.setFontSize(11);
              const lines = doc.splitTextToSize(text, 612 - 96);
              let y = 48;
              lines.forEach((ln: string) => {
                if (y > 792 - 48) { doc.addPage(); y = 48; }
                doc.text(ln, 48, y); y += 14;
              });
              doc.save("osteoporosis-workup.pdf");
            }}>
              <FileDown className="mr-1 h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Sequential osteoporosis therapy decision tree ──────────────────────
type NodeId =
  | "N1_confirm_indication"
  | "N2_risk_category"
  | "N3A_bisphosphonate_suitability"
  | "N3A_alternative_antiresorptive"
  | "N3B_anabolic_eligibility"
  | "N3B_select_potent_antiresorptive"
  | "N3C_anabolic_first"
  | "A2_start_oral_bisphosphonate"
  | "A3_start_iv_bisphosphonate"
  | "A4_start_denosumab"
  | "A5_start_anabolic_high_risk"
  | "N4A_bisphosphonate_reassessment"
  | "N4A_high_risk_persistent_on_bisphosphonate"
  | "A6_consider_bisphosphonate_holiday"
  | "A7_switch_to_denosumab_or_anabolic"
  | "N4B_denosumab_followup"
  | "A8_continue_denosumab"
  | "A9_transition_off_denosumab"
  | "N4C_end_of_anabolic_course"
  | "A10_sequential_bisphosphonate_after_anabolic"
  | "A11_sequential_denosumab_after_anabolic"
  | "A1_non_pharmacologic_exit";

type Choice = { value: string; label: string; next: NodeId; tone?: "info" | "warning" | "danger" | "success" };

type TreeNode =
  | { id: NodeId; kind: "decision"; label: string; help?: string; choices: Choice[] }
  | { id: NodeId; kind: "action"; label: string; summary: string[]; tone: "info" | "warning" | "danger" | "success"; next?: { label: string; to: NodeId }[]; terminal?: boolean };

const TREE: Record<NodeId, TreeNode> = {
  N1_confirm_indication: {
    id: "N1_confirm_indication", kind: "decision",
    label: "Does the patient meet criteria for pharmacologic osteoporosis therapy?",
    help: "Prior fragility fx (hip/vertebral), T-score ≤ –2.5, or FRAX major ≥ 20% / hip ≥ 3%.",
    choices: [
      { value: "yes", label: "Yes — meets criteria", next: "N2_risk_category" },
      { value: "no", label: "No", next: "A1_non_pharmacologic_exit", tone: "info" },
    ],
  },
  N2_risk_category: {
    id: "N2_risk_category", kind: "decision",
    label: "Fracture risk category",
    choices: [
      { value: "low_or_moderate", label: "Low / moderate", next: "N3A_bisphosphonate_suitability" },
      { value: "high", label: "High", next: "N3B_anabolic_eligibility" },
      { value: "very_high_imminent", label: "Very high / imminent", next: "N3C_anabolic_first", tone: "danger" },
    ],
  },
  N3A_bisphosphonate_suitability: {
    id: "N3A_bisphosphonate_suitability", kind: "decision",
    label: "Is an oral bisphosphonate suitable?",
    help: "Consider CrCl ≥ 35, no severe GI disease, adherence, able to sit upright 30 min.",
    choices: [
      { value: "yes", label: "Yes", next: "A2_start_oral_bisphosphonate" },
      { value: "no", label: "No", next: "N3A_alternative_antiresorptive" },
    ],
  },
  N3A_alternative_antiresorptive: {
    id: "N3A_alternative_antiresorptive", kind: "decision",
    label: "Choose alternative antiresorptive",
    choices: [
      { value: "iv_bp", label: "IV bisphosphonate", next: "A3_start_iv_bisphosphonate" },
      { value: "denosumab", label: "Denosumab", next: "A4_start_denosumab" },
    ],
  },
  N3B_anabolic_eligibility: {
    id: "N3B_anabolic_eligibility", kind: "decision",
    label: "Eligible and willing for anabolic therapy?",
    help: "Exclude prior skeletal RT / bone malignancy (teriparatide/abalo) or recent MI/CVA (romosozumab).",
    choices: [
      { value: "yes", label: "Yes", next: "A5_start_anabolic_high_risk" },
      { value: "no", label: "No", next: "N3B_select_potent_antiresorptive" },
    ],
  },
  N3B_select_potent_antiresorptive: {
    id: "N3B_select_potent_antiresorptive", kind: "decision",
    label: "Select potent antiresorptive",
    choices: [
      { value: "iv_bp", label: "IV zoledronate", next: "A3_start_iv_bisphosphonate" },
      { value: "denosumab", label: "Denosumab", next: "A4_start_denosumab" },
    ],
  },
  N3C_anabolic_first: {
    id: "N3C_anabolic_first", kind: "action", tone: "danger",
    label: "Anabolic-first regimen (very high / imminent risk)",
    summary: [
      "Start anabolic: romosozumab 12 mo, OR teriparatide / abaloparatide up to 24 mo.",
      "Plan sequential antiresorptive at completion (bisphosphonate or denosumab).",
      "Never leave patient untreated at anabolic end — bone gains are lost rapidly.",
    ],
    next: [{ label: "Go to end-of-anabolic transition", to: "N4C_end_of_anabolic_course" }],
  },
  A2_start_oral_bisphosphonate: {
    id: "A2_start_oral_bisphosphonate", kind: "action", tone: "success",
    label: "Start oral bisphosphonate",
    summary: ["Alendronate or risedronate weekly.", "Planned duration ~5 y, then reassess.", "Ensure Ca 1000–1200 mg/d + Vit D 800–1000 IU/d."],
    next: [{ label: "Reassess after 3–5 y", to: "N4A_bisphosphonate_reassessment" }],
  },
  A3_start_iv_bisphosphonate: {
    id: "A3_start_iv_bisphosphonate", kind: "action", tone: "success",
    label: "Start IV bisphosphonate",
    summary: ["Zoledronic acid 5 mg IV yearly.", "Planned duration ~3 y, then reassess.", "Check CrCl ≥ 35 and vitamin D before each infusion."],
    next: [{ label: "Reassess after 3 y", to: "N4A_bisphosphonate_reassessment" }],
  },
  A4_start_denosumab: {
    id: "A4_start_denosumab", kind: "action", tone: "warning",
    label: "Start denosumab (requires structured stop plan)",
    summary: [
      "Denosumab 60 mg SC every 6 months.",
      "⚠ No drug holiday — abrupt discontinuation → rebound vertebral fractures.",
      "Flag chart: requires transition to bisphosphonate when stopping.",
    ],
    next: [{ label: "Ongoing follow-up", to: "N4B_denosumab_followup" }],
  },
  A5_start_anabolic_high_risk: {
    id: "A5_start_anabolic_high_risk", kind: "action", tone: "info",
    label: "Start anabolic therapy (high risk)",
    summary: [
      "Teriparatide or abaloparatide (up to 24 mo) OR romosozumab (12 mo).",
      "Plan sequential antiresorptive at end of course.",
    ],
    next: [{ label: "End-of-course transition", to: "N4C_end_of_anabolic_course" }],
  },
  N4A_bisphosphonate_reassessment: {
    id: "N4A_bisphosphonate_reassessment", kind: "decision",
    label: "Reassess risk after 3–5 y of bisphosphonate",
    choices: [
      { value: "low_moderate", label: "Now low / moderate risk", next: "A6_consider_bisphosphonate_holiday" },
      { value: "still_high", label: "Still high risk", next: "N4A_high_risk_persistent_on_bisphosphonate" },
    ],
  },
  N4A_high_risk_persistent_on_bisphosphonate: {
    id: "N4A_high_risk_persistent_on_bisphosphonate", kind: "decision",
    label: "Persistent high risk on bisphosphonate — next step?",
    choices: [
      { value: "extend", label: "Extend BP (up to 10 y PO / 6 y IV)", next: "A2_start_oral_bisphosphonate" },
      { value: "switch", label: "Switch to denosumab or anabolic", next: "A7_switch_to_denosumab_or_anabolic" },
    ],
  },
  A6_consider_bisphosphonate_holiday: {
    id: "A6_consider_bisphosphonate_holiday", kind: "action", tone: "success",
    label: "Consider bisphosphonate holiday",
    summary: [
      "Oral BP: ~5 y therapy → 1–2 y holiday, reassess with DXA + FRAX.",
      "IV zoledronate: ~3 y therapy → 2–3 y holiday.",
      "Maintain Ca / Vit D / exercise / fall-prevention. Reassess yearly.",
    ],
    terminal: true,
  },
  A7_switch_to_denosumab_or_anabolic: {
    id: "A7_switch_to_denosumab_or_anabolic", kind: "action", tone: "warning",
    label: "Switch off bisphosphonate",
    summary: [
      "Options: denosumab (needs structured stop plan) OR anabolic (teriparatide/abaloparatide/romosozumab).",
      "Anabolic preferred if very high risk / new fx on BP.",
      "Always plan the NEXT step before starting — never stop denosumab alone.",
    ],
    next: [
      { label: "→ Denosumab pathway", to: "A4_start_denosumab" },
      { label: "→ Anabolic pathway", to: "A5_start_anabolic_high_risk" },
    ],
  },
  N4B_denosumab_followup: {
    id: "N4B_denosumab_followup", kind: "decision",
    label: "Denosumab follow-up — continue or stop?",
    choices: [
      { value: "continue", label: "Continue (still high risk, tolerating)", next: "A8_continue_denosumab" },
      { value: "stop", label: "Plan to stop / switch", next: "A9_transition_off_denosumab", tone: "danger" },
    ],
  },
  A8_continue_denosumab: {
    id: "A8_continue_denosumab", kind: "action", tone: "success",
    label: "Continue denosumab",
    summary: [
      "60 mg SC q6 mo indefinitely while high risk.",
      "Do not miss doses > 7 mo — rebound vertebral fracture risk.",
      "Annual DXA / clinical review; re-evaluate stopping plan yearly.",
    ],
    terminal: true,
  },
  A9_transition_off_denosumab: {
    id: "A9_transition_off_denosumab", kind: "action", tone: "danger",
    label: "Transition off denosumab (mandatory bridge)",
    summary: [
      "Give zoledronate 5 mg IV 6 mo after the last denosumab dose.",
      "Alternative: oral alendronate for 12–24 mo starting at month 6.",
      "Recheck DXA + CTX at 12 and 24 mo; re-treat if bone loss.",
      "⚠ Never stop denosumab without an antiresorptive bridge.",
    ],
    terminal: true,
  },
  N4C_end_of_anabolic_course: {
    id: "N4C_end_of_anabolic_course", kind: "decision",
    label: "Anabolic course complete — sequential antiresorptive",
    help: "Bone gains from anabolic are lost within 12 mo without antiresorptive follow-on.",
    choices: [
      { value: "bp", label: "Sequential bisphosphonate", next: "A10_sequential_bisphosphonate_after_anabolic" },
      { value: "denosumab", label: "Sequential denosumab", next: "A11_sequential_denosumab_after_anabolic" },
    ],
  },
  A10_sequential_bisphosphonate_after_anabolic: {
    id: "A10_sequential_bisphosphonate_after_anabolic", kind: "action", tone: "success",
    label: "Sequential bisphosphonate after anabolic",
    summary: [
      "Zoledronate 5 mg IV within 1 mo of anabolic completion (preferred).",
      "Or oral alendronate/risedronate weekly.",
      "Reassess at 3 y.",
    ],
    terminal: true,
  },
  A11_sequential_denosumab_after_anabolic: {
    id: "A11_sequential_denosumab_after_anabolic", kind: "action", tone: "warning",
    label: "Sequential denosumab after anabolic",
    summary: [
      "Denosumab 60 mg SC q6 mo starting within 1 mo of anabolic completion.",
      "Preferred if greater BMD gain desired.",
      "Document long-term stop plan (bridging with zoledronate when eventually stopped).",
    ],
    terminal: true,
  },
  A1_non_pharmacologic_exit: {
    id: "A1_non_pharmacologic_exit", kind: "action", tone: "info",
    label: "Non-pharmacologic management",
    summary: [
      "Ca 1000–1200 mg/d, Vit D 800–1000 IU/d.",
      "Weight-bearing + resistance exercise, fall-prevention.",
      "Reassess fracture risk yearly (FRAX ± repeat DXA in 2 y).",
    ],
    terminal: true,
  },
};

function SequentialTherapyPanel() {
  const [path, setPath] = useState<NodeId[]>(["N1_confirm_indication"]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const current = TREE[path[path.length - 1]];

  const choose = (nodeId: NodeId, value: string, label: string, next: NodeId) => {
    setPicks((p) => ({ ...p, [nodeId]: label }));
    setPath((p) => [...p, next]);
  };
  const jump = (to: NodeId) => setPath((p) => [...p, to]);
  const reset = () => { setPath(["N1_confirm_indication"]); setPicks({}); };
  const back = () => setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));

  const toneChip: Record<string, "info" | "warning" | "danger" | "success" | "primary"> = {
    info: "info", warning: "warning", danger: "danger", success: "success",
  };

  return (
    <SectionCard
      title="Sequential osteoporosis therapy — decision tree"
      subtitle="Interactive long-term sequencing of anabolic and antiresorptive agents"
      icon={<GitBranch className="h-5 w-5" />}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Path / breadcrumb */}
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chosen path</div>
          <ol className="space-y-1.5 rounded-md border border-border p-3 text-xs">
            {path.map((nid, i) => {
              const n = TREE[nid];
              const pick = picks[nid];
              return (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{i + 1}</span>
                  <div>
                    <div className="font-medium">{n.label}</div>
                    {pick && <div className="text-muted-foreground">→ {pick}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={back} disabled={path.length <= 1}>← Back</Button>
            <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset</Button>
          </div>
        </div>

        {/* Current node */}
        <div>
          {current.kind === "decision" ? (
            <div className="space-y-3">
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                <div className="text-xs uppercase tracking-wide text-primary">Decision</div>
                <div className="mt-1 text-sm font-semibold">{current.label}</div>
                {current.help && <div className="mt-1 text-xs text-muted-foreground">{current.help}</div>}
              </div>
              <div className="grid gap-2">
                {current.choices.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => choose(current.id, c.value, c.label, c.next)}
                    className="group flex items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:border-primary hover:bg-primary/5"
                  >
                    <span className="flex items-center gap-2">
                      {c.tone && <Chip tone={toneChip[c.tone]}>{c.tone}</Chip>}
                      <span>{c.label}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Callout tone={current.tone} title={current.label}>
                <ul className="ml-4 list-disc space-y-0.5">
                  {current.summary.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </Callout>
              {current.next && current.next.length > 0 && (
                <div className="grid gap-2">
                  {current.next.map((n) => (
                    <button
                      key={n.to}
                      onClick={() => jump(n.to)}
                      className="flex items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:border-primary hover:bg-primary/5"
                    >
                      <span>{n.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
              {current.terminal && (
                <div className="text-xs text-muted-foreground">End of pathway. Use Reset to start over, or Back to explore alternatives.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}


// ── Steroid-induced vertebral fragility fracture panel ─────────────────
function SteroidVCFPanel() {
  const [dose, setDose] = useState("");
  const [months, setMonths] = useState("");
  const [codfish, setCodfish] = useState(false);
  const [severePain, setSeverePain] = useState(false);
  const [neuro, setNeuro] = useState(false);
  const [systemic, setSystemic] = useState(false);

  const d = parseFloat(dose);
  const m = parseFloat(months);
  const highSteroidExposure = (!isNaN(d) && d >= 7.5) && (!isNaN(m) && m >= 3);
  const treatEmpirically = highSteroidExposure && (codfish || severePain);

  return (
    <SectionCard
      title="Steroid-induced vertebral fragility fracture — clinical alert"
      subtitle="New severe back pain + codfish vertebrae in a chronic-steroid patient = fragility fracture until proven otherwise"
      icon={<AlertTriangle className="h-5 w-5" />}
      tone="danger"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Prednisolone-equivalent daily dose (mg)</Label>
          <Input type="number" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 10" />
          <Label className="mt-2 block">Duration (months)</Label>
          <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="e.g. 6" />

          <div className="mt-3 grid gap-1.5 text-xs">
            <label className="flex items-start gap-2"><Checkbox checked={codfish} onCheckedChange={() => setCodfish(!codfish)} /><span>Codfish / fish-vertebra deformity on imaging</span></label>
            <label className="flex items-start gap-2"><Checkbox checked={severePain} onCheckedChange={() => setSeverePain(!severePain)} /><span>New severe thoracolumbar back pain</span></label>
            <label className="flex items-start gap-2"><Checkbox checked={neuro} onCheckedChange={() => setNeuro(!neuro)} /><span>Neurological deficit / sphincter involvement</span></label>
            <label className="flex items-start gap-2"><Checkbox checked={systemic} onCheckedChange={() => setSystemic(!systemic)} /><span>Systemic features (fever, weight loss, night sweats)</span></label>
          </div>
        </div>

        <div className="space-y-2">
          {treatEmpirically && (
            <Callout tone="danger" title="Treat as fragility fracture — do not wait for DXA">
              ≥ 7.5 mg prednisolone-equivalent ≥ 3 months + acute severe pain or codfish vertebrae: start bone protection now (oral bisphosphonate + Ca/vit D), image the spine, and manage pain aggressively.
            </Callout>
          )}
          {(neuro || systemic) && (
            <Callout tone="danger" title="Red flag — urgent MRI + broader workup">
              Neurological deficit or systemic features → same-day MRI (± cord compression protocol) and rule out myeloma / infection / metastasis (SPEP + FLC, ESR/CRP, CBC).
            </Callout>
          )}

          <Callout tone="warning" title="Immediate actions">
            <ul className="ml-4 list-disc space-y-0.5 text-xs">
              <li>Spine MRI (T + L) — confirm acute/subacute VCF, marrow edema, canal compromise, exclude mimics</li>
              <li>DXA to stage GIOP (but do NOT delay treatment if high-risk)</li>
              <li>Labs: Ca, PO₄, ALP, 25-OH D, PTH, Cr/eGFR, CBC, ESR/CRP, SPEP + free light chains</li>
              <li>Multimodal analgesia: paracetamol ± short NSAID course (if GI/renal OK) ± opioid for breakthrough</li>
              <li>Avoid flexion / axial loading; consider TLSO short-term if multilevel</li>
            </ul>
          </Callout>

          <Callout tone="info" title="Disease-modifying therapy">
            <div className="text-xs space-y-1">
              <div><b>First-line:</b> oral bisphosphonate (alendronate/risedronate) + Ca 1000–1200 mg/d + vit D 800–1000 IU/d.</div>
              <div><b>Consider anabolic (teriparatide):</b> multiple VCFs, T ≤ −3.5, or bisphosphonate failure/intolerance.</div>
              <div><b>Refractory pain / confirmed painful VCF:</b> vertebroplasty or kyphoplasty after MDT review.</div>
              <div><b>Steroid strategy:</b> minimize dose / steroid-sparing agent; if tapering below physiologic dose, screen for adrenal suppression (AM cortisol ± SST) and issue sick-day rules + emergency steroid card.</div>
            </div>
          </Callout>
        </div>
      </div>
    </SectionCard>
  );
}

export default OsteoporosisApp;

