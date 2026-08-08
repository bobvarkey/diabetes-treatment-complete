import { useMemo, useState } from "react";
import { TrendingDown, Copy, FileDown, Printer, AlertTriangle, Activity, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SectionCard, KeyRow, Pill as Chip, Callout, Stat } from "./shared";

/** Prednisone-equivalent conversion factors (mg of drug ≡ 5 mg prednisone). */
const EQ: Record<string, number> = {
  Prednisone: 5,
  Prednisolone: 5,
  Methylprednisolone: 4,
  Hydrocortisone: 20,
  Dexamethasone: 0.75,
  Deflazacort: 6,
  Triamcinolone: 4,
  Betamethasone: 0.6,
};

const SPEED = {
  faster: { label: "Faster", mult: 0.5, note: "Short courses, good disease control, urgent need to withdraw" },
  standard: { label: "Standard", mult: 1, note: "Default for most chronic courses" },
  slower: { label: "Slower", mult: 2, note: "Long duration, prior flares, symptomatic withdrawal" },
} as const;
type SpeedKey = keyof typeof SPEED;

interface Step {
  phase: string;
  predEq: number;
  drugDose: number;
  weeks: number;
}

/** Taper rules: faster above physiologic dose, slower near replacement. */
function decrement(predEq: number): { dec: number; weeks: number; phase: string } {
  if (predEq > 40) return { dec: 10, weeks: 1, phase: "High dose" };
  if (predEq > 20) return { dec: 5, weeks: 1, phase: "High dose" };
  if (predEq > 10) return { dec: 2.5, weeks: 2, phase: "Moderate dose" };
  if (predEq > 5) return { dec: 1, weeks: 2, phase: "Low dose" };
  return { dec: 0.5, weeks: 4, phase: "Physiologic / near-replacement" };
}

function buildSchedule(startPredEq: number, speed: SpeedKey, targetPredEq: number): Step[] {
  const steps: Step[] = [];
  let cur = startPredEq;
  let guard = 0;
  while (cur > targetPredEq + 0.001 && guard < 60) {
    const { dec, weeks, phase } = decrement(cur);
    const next = Math.max(targetPredEq, Math.round((cur - dec) * 100) / 100);
    const w = Math.max(1, Math.round(weeks * SPEED[speed].mult));
    steps.push({ phase, predEq: next, drugDose: next, weeks: w });
    cur = next;
    guard++;
  }
  return steps;
}

function SteroidTaper() {
  const [drug, setDrug] = useState("Prednisone");
  const [dose, setDose] = useState("40");
  const [durationWeeks, setDurationWeeks] = useState("6");
  const [speed, setSpeed] = useState<SpeedKey>("standard");
  const [target, setTarget] = useState("0");
  const [cortisol, setCortisol] = useState("");
  const [flare, setFlare] = useState(false);

  const factor = EQ[drug] ?? 5;
  const doseNum = parseFloat(dose);
  const targetNum = parseFloat(target);
  const predEq = !isNaN(doseNum) ? (doseNum / factor) * 5 : NaN;
  const durNum = parseFloat(durationWeeks);

  const invalid =
    isNaN(doseNum) || doseNum <= 0 || doseNum > 1000
      ? "Enter a dose between 0 and 1000 mg"
      : isNaN(durNum) || durNum < 0
        ? "Enter a valid duration in weeks"
        : isNaN(targetNum) || targetNum < 0 || (!isNaN(predEq) && targetNum >= predEq)
          ? "Target prednisone-equivalent must be ≥ 0 and below the current dose"
          : null;

  const schedule = useMemo(
    () => (invalid ? [] : buildSchedule(predEq, speed, targetNum)),
    [invalid, predEq, speed, targetNum],
  );

  const totalWeeks = schedule.reduce((a, s) => a + s.weeks, 0);
  const hpaRisk = !isNaN(predEq) && !isNaN(durNum) && (durNum >= 3 || predEq >= 20);

  const cort = parseFloat(cortisol);
  const cortInterp = isNaN(cort)
    ? null
    : cort < 83
      ? { tone: "danger" as const, text: "<83 nmol/L (3 µg/dL): adrenal insufficiency likely — continue replacement, do not stop; endocrine referral." }
      : cort < 275
        ? { tone: "warning" as const, text: "83–275 nmol/L (3–10 µg/dL): indeterminate — perform ACTH (Synacthen 250 µg) stimulation test; continue hydrocortisone replacement meanwhile." }
        : { tone: "success" as const, text: "≥275 nmol/L (10 µg/dL): HPA axis likely recovered — glucocorticoid may be stopped; keep stress-dose advice for 6–12 months." };

  const plainText = () => {
    const lines = [
      "STEROID TAPER PLAN",
      `Drug: ${drug} ${dose} mg/day  (≈ ${predEq.toFixed(2)} mg prednisone-equivalent)`,
      `Duration of therapy so far: ${durationWeeks} weeks`,
      `Taper pace: ${SPEED[speed].label}`,
      `Target: ${target} mg prednisone-equivalent`,
      "",
      ...schedule.map(
        (s, i) =>
          `Step ${i + 1}: ${((s.predEq / 5) * factor).toFixed(2)} mg ${drug}/day (${s.predEq.toFixed(2)} mg pred-eq) × ${s.weeks} week(s) — ${s.phase}`,
      ),
      "",
      `Estimated total taper duration: ${totalWeeks} weeks`,
      hpaRisk ? "HPA suppression risk: assess 08:00 cortisol at/near physiologic dose." : "",
      "Educational decision support only — verify against local protocol and clinician review.",
    ];
    return lines.filter(Boolean).join("\n");
  };

  const download = () => {
    const blob = new Blob([plainText()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "steroid-taper-plan.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Steroid taper planner"
        subtitle="Prednisone-equivalent, phase-based tapering with HPA safety checks"
        icon={<TrendingDown className="h-5 w-5" />}
      >
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <Label className="text-xs">Glucocorticoid</Label>
            <select
              value={drug}
              onChange={(e) => setDrug(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {Object.keys(EQ).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Current dose (mg/day)</Label>
            <Input type="number" min={0} value={dose} onChange={(e) => setDose(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Duration so far (weeks)</Label>
            <Input type="number" min={0} value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Taper pace</Label>
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as SpeedKey)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {Object.entries(SPEED).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Target (mg pred-eq)</Label>
            <Input type="number" min={0} value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
        </div>

        {invalid ? (
          <Callout tone="warning" title="Check inputs">{invalid}</Callout>
        ) : (
          <>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Stat label="Prednisone equivalent" value={`${predEq.toFixed(2)} mg/d`} hint={`${dose} mg ${drug} ÷ ${factor} × 5`} />
              <Stat label="Taper steps" value={String(schedule.length)} hint={SPEED[speed].note} />
              <Stat label="Estimated duration" value={`${totalWeeks} week${totalWeeks === 1 ? "" : "s"}`} hint="Adjust to disease control" />
            </div>

            <div className="mt-3 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2">Step</th>
                    <th className="p-2">Phase</th>
                    <th className="p-2">{drug} dose</th>
                    <th className="p-2">Pred-eq</th>
                    <th className="p-2">Hold for</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((s, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 font-medium">{i + 1}</td>
                      <td className="p-2 text-muted-foreground">{s.phase}</td>
                      <td className="p-2">{((s.predEq / 5) * factor).toFixed(2)} mg/d</td>
                      <td className="p-2">{s.predEq.toFixed(2)} mg</td>
                      <td className="p-2">{s.weeks} wk</td>
                    </tr>
                  ))}
                  {schedule.length === 0 && (
                    <tr><td className="p-2 text-muted-foreground" colSpan={5}>No taper needed for these inputs.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(plainText()); toast.success("Taper plan copied"); }}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={download}>
                <FileDown className="mr-1 h-3.5 w-3.5" /> Download
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1 h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </>
        )}

        <div className="mt-3 flex items-center gap-2 rounded-md border border-border p-2">
          <input id="flare" type="checkbox" checked={flare} onChange={(e) => setFlare(e.target.checked)} className="h-4 w-4" />
          <Label htmlFor="flare" className="text-xs">Disease activity is not controlled / flare on last reduction</Label>
        </div>
        {flare && (
          <Callout tone="danger" title="Hold the taper">
            Return to the last effective dose (or the previous step) and maintain for 2–4 weeks before resuming at half the decrement.
            Consider steroid-sparing therapy rather than a faster taper.
          </Callout>
        )}

        <Callout tone="info" title="Taper principle">
          Reduce quickly while above physiologic replacement (~5 mg prednisone-equivalent/day) — the goal there is disease control.
          Below that, reduce slowly (0.5–1 mg every 2–4 weeks) because the limiting factor becomes HPA axis recovery, not disease.
        </Callout>
      </SectionCard>

      <SectionCard title="HPA axis assessment" subtitle="Morning cortisol & ACTH stimulation" icon={<Activity className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">08:00 serum cortisol (nmol/L)</Label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 220"
              value={cortisol}
              onChange={(e) => setCortisol(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Measure ≥24 h after the last hydrocortisone dose (or ≥48–72 h after prednisolone). Do not measure while on dexamethasone-suppressive doses.
            </p>
          </div>
          <div className="space-y-1">
            <KeyRow k="When to test" v="At/near physiologic dose (≤5 mg pred-eq) after ≥3–4 weeks of therapy" />
            <KeyRow k="Indeterminate result" v="250 µg Synacthen: 30/60-min cortisol ≥ 450–500 nmol/L = adequate" />
            <KeyRow k="Retest interval" v="Every 2–3 months until recovery (may take 6–12 months, occasionally years)" />
          </div>
        </div>
        {cortInterp && <Callout tone={cortInterp.tone} title="Interpretation">{cortInterp.text}</Callout>}
        {hpaRisk && (
          <Callout tone="warning" title="HPA suppression risk">
            ≥3 weeks of therapy or ≥20 mg prednisone-equivalent/day — assume suppression, taper to physiologic dose then assess biochemically before stopping.
          </Callout>
        )}
      </SectionCard>

      <SectionCard title="Withdrawal, stress dosing & adrenal crisis" icon={<ShieldAlert className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <Callout tone="info" title="Glucocorticoid withdrawal syndrome">
            Fatigue, myalgia, arthralgia, nausea, anorexia, postural dizziness, low mood — with normal cortisol.
            Slow the taper (halve the decrement, double the interval); it is not an indication to increase the disease dose.
          </Callout>
          <Callout tone="warning" title="Sick-day / stress dosing">
            <KeyRow k="Minor illness (fever, infection)" v="Double the usual dose for 2–3 days (sick-day rule 1)" />
            <KeyRow k="Vomiting / diarrhoea" v="Parenteral hydrocortisone 100 mg IM, seek care (sick-day rule 2)" />
            <KeyRow k="Minor surgery" v="Hydrocortisone 25–50 mg IV at induction" />
            <KeyRow k="Major surgery" v="100 mg IV then 50 mg q6–8h × 24–48 h, taper to baseline" />
          </Callout>
        </div>
        <Callout tone="danger" title="Adrenal crisis — emergency">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Hypotension/shock, vomiting, abdominal pain, confusion, hyponatraemia, hypoglycaemia.
              Give hydrocortisone 100 mg IV/IM immediately + IV 0.9% saline; do not delay for test results.
              Every tapering patient needs a steroid emergency card and IM hydrocortisone at home.
            </div>
          </div>
        </Callout>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Steroid card", "Emergency IM hydrocortisone", "Sick-day education", "Bone/glucose monitoring", "Clinician review each step"].map((c) => (
            <Chip key={c} tone="info">{c}</Chip>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Educational decision support based on ESE/Endocrine Society tapering principles. Always confirm against local protocol and individual clinical judgement.
        </p>
      </SectionCard>
    </div>
  );
}

export default SteroidTaper;
