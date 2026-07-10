import { useMemo, useState } from "react";
import { Syringe, ShieldAlert, Activity } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PriorBasal = "none" | "od_basal" | "bid_basal" | "pump";

type StackRisk = "low" | "moderate" | "high";
type ChangeCategory = "up_20" | "up_10" | "no_change" | "down_10" | "down_20";

interface CgmSummary {
  nocturnal_mean: number;
  tir: number;
  tbr_54_69: number;
  tbr_lt54: number;
  tar_gt180: number;
  nocturnal_min: number;
  nocturnal_downward_trend: boolean;
  data_completeness: number;
}

function computeStackRisk(week: number, loading: boolean, priorDaily: number, weight: number, sevHypo: boolean): StackRisk {
  if ((week <= 3 && loading) || (priorDaily > 0.7 * weight) || sevHypo) return "high";
  if ((week <= 3 && !loading) || (week <= 5 && priorDaily > 0)) return "moderate";
  return "low";
}

function riskCaps(risk: StackRisk) {
  return risk === "high"
    ? { up: 0, down: 30, msg: "High stack risk — no automatic up-titration. CGM review days 2–4." }
    : risk === "moderate"
    ? { up: 10, down: 30, msg: "Moderate stack risk — cap up-titration at +10 U/week." }
    : { up: 20, down: 30, msg: "Low stack risk — titrate per CGM up to ±20 U/week." };
}

function proposeDelta(c: CgmSummary): { delta: number; cat: ChangeCategory; reason: string } {
  if (c.data_completeness < 70) return { delta: 0, cat: "no_change", reason: "CGM completeness <70 % — fall back to SMBG cycle." };
  if (c.tbr_lt54 >= 1 || c.nocturnal_min < 54) return { delta: -20, cat: "down_20", reason: "TBR<54 ≥1 % or nocturnal min <54 mg/dL — severe hypo." };
  if (c.tbr_54_69 >= 4 || c.nocturnal_min < 70) return { delta: -10, cat: "down_10", reason: "TBR 54–69 ≥4 % or recurrent nocturnal <70." };
  if (c.nocturnal_mean > 140 && c.tbr_54_69 === 0 && c.tbr_lt54 === 0) return { delta: 20, cat: "up_20", reason: "Nocturnal mean >140 mg/dL, zero TBR." };
  if (c.nocturnal_mean > 110 && c.nocturnal_mean <= 140 && c.tbr_54_69 === 0 && c.tbr_lt54 === 0 && c.tir < 70) return { delta: 10, cat: "up_10", reason: "Mild nocturnal hyper (110–140) with TIR <70 %." };
  if (c.nocturnal_mean >= 80 && c.nocturnal_mean <= 110 && c.tbr_lt54 === 0 && c.tbr_54_69 < 4) return { delta: 0, cat: "no_change", reason: "On target — dose appropriate." };
  if (c.nocturnal_mean >= 70 && c.nocturnal_mean < 80) {
    return c.nocturnal_downward_trend
      ? { delta: -10, cat: "down_10", reason: "Borderline low with downward nocturnal drift." }
      : { delta: 0, cat: "no_change", reason: "Borderline low — hold titration." };
  }
  return { delta: 0, cat: "no_change", reason: "No rule matched — hold." };
}

function roundTo(n: number, step: number) { return Math.round(n / step) * step; }

export default function IcodecTitration() {
  // Patient
  const [weight, setWeight] = useState("78");
  const [egfr, setEgfr] = useState("65");
  const [sevHypo, setSevHypo] = useState(false);
  const [pregnant, setPregnant] = useState(false);
  const [priorType, setPriorType] = useState<PriorBasal>("none");
  const [priorDaily, setPriorDaily] = useState("0");

  // Course
  const [week, setWeek] = useState("1");
  const [loading, setLoading] = useState(false);
  const [lastDose, setLastDose] = useState("");

  // CGM
  const [cgm, setCgm] = useState<CgmSummary>({
    nocturnal_mean: 165, tir: 45, tbr_54_69: 0, tbr_lt54: 0,
    tar_gt180: 55, nocturnal_min: 92, nocturnal_downward_trend: false, data_completeness: 90,
  });
  const upd = (k: keyof CgmSummary, v: number | boolean) => setCgm({ ...cgm, [k]: v as never });

  const w = parseFloat(weight) || 0;
  const pd = parseFloat(priorDaily) || 0;
  const wk = parseInt(week) || 1;
  const eligible = !pregnant && (parseFloat(egfr) || 0) >= 15;

  // Initiation
  const initiation = useMemo(() => {
    if (!eligible) return { dose: 0, note: "Not eligible: pregnancy or eGFR <15." };
    if (priorType === "pump" || priorType === "bid_basal") {
      return { dose: 0, note: "Switch from pump / BID basal — icodec not first-line; consult endocrinology." };
    }
    if (priorType === "none") {
      return { dose: 70, note: "Insulin-naïve → 70 U once weekly. No loading." };
    }
    // od_basal
    const hi = pd > 0.7 * w || sevHypo;
    const multiplier = hi ? 6 : 7;
    const base = Math.round(multiplier * pd);
    const loaded = loading && !hi ? Math.round(10.5 * pd) : null;
    return {
      dose: loaded ?? base,
      note: hi
        ? `High stack risk → 6× daily basal (${base} U). No loading. Stop daily basal at first icodec.`
        : loaded
        ? `Loading week: 10.5× daily basal (${loaded} U) week 1, then 7× (${base} U) week 2.`
        : `Standard: 7× daily basal (${base} U). Stop daily basal at first icodec.`,
    };
  }, [eligible, priorType, pd, w, sevHypo, loading]);

  // Titration
  const risk = computeStackRisk(wk, loading, pd, w, sevHypo);
  const caps = riskCaps(risk);
  const proposal = proposeDelta(cgm);
  const capped = Math.max(-caps.down, Math.min(caps.up, proposal.delta));
  const lastD = parseFloat(lastDose) || initiation.dose || 0;
  const nextDose = Math.max(0, roundTo(lastD + capped, 10));

  const bolusAdvice =
    risk === "high" && (cgm.tbr_54_69 > 0 || cgm.tbr_lt54 > 0)
      ? "Reduce total daily bolus ~10 %; re-titrate later."
      : "No automatic bolus change.";

  const copy = () => {
    const text = [
      `Icodec titration — week ${wk}`,
      `Last dose: ${lastD} U → Next dose: ${nextDose} U (Δ ${capped >= 0 ? "+" : ""}${capped} U)`,
      `Proposed by CGM rule: ${proposal.cat} (${proposal.delta >= 0 ? "+" : ""}${proposal.delta}) — ${proposal.reason}`,
      `Stack risk: ${risk.toUpperCase()} — ${caps.msg}`,
      `Bolus: ${bolusAdvice}`,
      `CGM: mean noct ${cgm.nocturnal_mean}, TIR ${cgm.tir}%, TBR54-69 ${cgm.tbr_54_69}%, TBR<54 ${cgm.tbr_lt54}%, TAR>180 ${cgm.tar_gt180}%, min ${cgm.nocturnal_min}, completeness ${cgm.data_completeness}%.`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Recommendation copied");
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Once-weekly insulin icodec — titration engine"
        subtitle="Adult T2DM · basal ± orals/GLP-1 · CGM-first logic"
        icon={<Syringe className="h-5 w-5" />}
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div><Label>Weight (kg)</Label><Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
          <div><Label>eGFR (mL/min)</Label><Input inputMode="decimal" value={egfr} onChange={(e) => setEgfr(e.target.value)} /></div>
          <div>
            <Label>Prior basal</Label>
            <Select value={priorType} onValueChange={(v) => setPriorType(v as PriorBasal)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (insulin-naïve)</SelectItem>
                <SelectItem value="od_basal">Once-daily basal</SelectItem>
                <SelectItem value="bid_basal">Twice-daily basal</SelectItem>
                <SelectItem value="pump">Insulin pump</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Prior basal (U/day)</Label><Input inputMode="decimal" value={priorDaily} onChange={(e) => setPriorDaily(e.target.value)} disabled={priorType === "none"} /></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={sevHypo} onCheckedChange={(v) => setSevHypo(!!v)} />Severe hypo history</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={pregnant} onCheckedChange={(v) => setPregnant(!!v)} />Pregnant</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={loading} onCheckedChange={(v) => setLoading(!!v)} disabled={priorType !== "od_basal" || sevHypo} />Use loading dose (low-risk switch only)</label>
        </div>
      </SectionCard>

      <SectionCard title="Initiation" tone="info">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Recommended starting dose" value={eligible ? `${initiation.dose} U/wk` : "—"} hint="Rounded to pen increment (10 U)" />
          <div className="rounded-md border border-border bg-card p-3 text-sm">{initiation.note}</div>
        </div>
        <Callout tone="warning" title="Overlap rule">
          Stop the prior daily basal on the day of the first icodec injection. Do not continue full-dose daily basal after week 1.
        </Callout>
      </SectionCard>

      <SectionCard title="Weekly CGM inputs (last 3 nights)" icon={<Activity className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-4">
          <div><Label>Week #</Label><Input inputMode="numeric" value={week} onChange={(e) => setWeek(e.target.value)} /></div>
          <div><Label>Last dose (U)</Label><Input inputMode="decimal" value={lastDose} onChange={(e) => setLastDose(e.target.value)} placeholder={`${initiation.dose}`} /></div>
          <div><Label>Nocturnal mean (mg/dL)</Label><Input inputMode="decimal" value={cgm.nocturnal_mean} onChange={(e) => upd("nocturnal_mean", +e.target.value)} /></div>
          <div><Label>Nocturnal min (mg/dL)</Label><Input inputMode="decimal" value={cgm.nocturnal_min} onChange={(e) => upd("nocturnal_min", +e.target.value)} /></div>
          <div><Label>TIR 70–180 (%)</Label><Input inputMode="decimal" value={cgm.tir} onChange={(e) => upd("tir", +e.target.value)} /></div>
          <div><Label>TBR 54–69 (%)</Label><Input inputMode="decimal" value={cgm.tbr_54_69} onChange={(e) => upd("tbr_54_69", +e.target.value)} /></div>
          <div><Label>TBR &lt;54 (%)</Label><Input inputMode="decimal" value={cgm.tbr_lt54} onChange={(e) => upd("tbr_lt54", +e.target.value)} /></div>
          <div><Label>TAR &gt;180 (%)</Label><Input inputMode="decimal" value={cgm.tar_gt180} onChange={(e) => upd("tar_gt180", +e.target.value)} /></div>
          <div><Label>Data completeness (%)</Label><Input inputMode="decimal" value={cgm.data_completeness} onChange={(e) => upd("data_completeness", +e.target.value)} /></div>
          <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><Checkbox checked={cgm.nocturnal_downward_trend} onCheckedChange={(v) => upd("nocturnal_downward_trend", !!v)} />Downward nocturnal trend</label></div>
        </div>
      </SectionCard>

      <SectionCard title="Recommendation" icon={<ShieldAlert className="h-5 w-5" />} tone={risk === "high" ? "warning" : "default"}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Next weekly dose" value={`${nextDose} U`} hint={`Δ ${capped >= 0 ? "+" : ""}${capped} U (proposed ${proposal.delta >= 0 ? "+" : ""}${proposal.delta})`} />
          <Stat label="Change category" value={proposal.cat.replace("_", " ")} />
          <Stat label="Stack risk" value={risk.toUpperCase()} hint={`cap +${caps.up} / −${caps.down}`} />
        </div>
        <div className="mt-3 space-y-2">
          <KeyRow k="CGM rule" v={proposal.reason} />
          <KeyRow k="Stack rule" v={caps.msg} />
          <KeyRow k="Bolus" v={bolusAdvice} />
          <KeyRow k="Monitoring" v="CGM review days 2–4 post-injection; recheck TIR/TBR before next dose." />
        </div>
        <div className="mt-4 flex gap-2 no-print">
          <Button size="sm" onClick={copy}>Copy recommendation</Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
      </SectionCard>

      <SectionCard title="Rule reference (weekly Δ, before stack cap)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">Condition</th><th className="p-2">Δ dose</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="p-2">Any CGM &lt;54 or TBR&lt;54 ≥1 %</td><td className="p-2"><Pill tone="danger">−20 U</Pill></td></tr>
              <tr><td className="p-2">TBR 54–69 ≥4 % or ≥2 nocturnal &lt;70</td><td className="p-2"><Pill tone="warning">−10 U</Pill></td></tr>
              <tr><td className="p-2">Nocturnal mean &gt;140, zero TBR</td><td className="p-2"><Pill tone="success">+20 U</Pill></td></tr>
              <tr><td className="p-2">Mean 110–140, TIR &lt;70 %, zero TBR</td><td className="p-2"><Pill tone="success">+10 U</Pill></td></tr>
              <tr><td className="p-2">Mean 80–110, TBR&lt;54 = 0, TBR 54–69 &lt;4 %</td><td className="p-2"><Pill>0</Pill></td></tr>
              <tr><td className="p-2">Mean 70–80 (borderline)</td><td className="p-2"><Pill tone="info">0 or −10 (if downward)</Pill></td></tr>
              <tr><td className="p-2">CGM completeness &lt;70 %</td><td className="p-2"><Pill tone="info">Use SMBG cycle</Pill></td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Absolute cap ±20 U/week without clinician override. Icodec t½ ≈ 7 days; effect of a dose change is fully seen only after ~3 weeks.
        </p>
      </SectionCard>

      <Callout tone="danger" title="Do not stack basals">
        Icodec is once weekly. Never co-administer daily basal insulin on the same days. In high stack-risk states
        (loading week, prior daily basal &gt;0.7 U/kg, severe hypo history) up-titration is blocked automatically.
      </Callout>
    </div>
  );
}
