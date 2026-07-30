import { useMemo, useState } from "react";
import { Siren, Copy, Printer, Download } from "lucide-react";
import { SectionCard, Pill, Callout, Stat } from "./shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FlagDef = { k: string; label: string; critical?: boolean; group: "clinical" | "endocrine" | "imaging" };

const FLAGS: FlagDef[] = [
  { k: "thunderclap", label: "Sudden severe (thunderclap) headache", group: "clinical", critical: true },
  { k: "visual_loss", label: "Acute visual loss / bitemporal field defect", group: "clinical", critical: true },
  { k: "ophthalmoplegia", label: "Ophthalmoplegia (CN III, IV or VI palsy)", group: "clinical", critical: true },
  { k: "altered_mental", label: "Altered mental status / reduced GCS", group: "clinical", critical: true },
  { k: "meningism", label: "Nausea, vomiting, photophobia, meningism", group: "clinical" },
  { k: "hypotension", label: "Hypotension or shock unresponsive to fluids", group: "endocrine", critical: true },
  { k: "hyponatraemia", label: "Hyponatraemia (Na < 130 mEq/L)", group: "endocrine", critical: true },
  { k: "hypoglycaemia", label: "Hypoglycaemia or unexplained fever", group: "endocrine" },
  { k: "known_adenoma", label: "Known pituitary adenoma or recent precipitant (anticoag, surgery, DA start)", group: "clinical" },
  { k: "haemorrhage_mri", label: "Haemorrhage / infarction within sella on CT or MRI", group: "imaging", critical: true },
  { k: "chiasm_compression", label: "Chiasmal compression on imaging", group: "imaging" },
];

const GROUP_LABEL: Record<FlagDef["group"], string> = {
  clinical: "Clinical red flags",
  endocrine: "Endocrine collapse",
  imaging: "Imaging",
};

const IMMEDIATE_STEPS = [
  "NOW — IV hydrocortisone 100 mg bolus, then 50 mg q6h (or 200 mg/24 h infusion). Do NOT wait for the cortisol result.",
  "NOW — draw cortisol, ACTH, prolactin, IGF-1, TSH/free T4, LH/FSH, testosterone/oestradiol, U&E, glucose, FBC, coagulation before or alongside steroid.",
  "< 15 min — ABC, large-bore IV access, 0.9% NaCl resuscitation, treat hypoglycaemia, correct Na cautiously (no rapid correction).",
  "< 1 h — urgent non-contrast CT head to exclude SAH; proceed to pituitary MRI as soon as feasible.",
  "< 1 h — bedside visual acuity and formal visual fields; document serially every 4 h.",
  "< 1 h — urgent neurosurgery AND ophthalmology referral; discuss decompression within 7 days (sooner if vision deteriorating).",
  "Ongoing — hourly neuro-obs, strict fluid balance, watch for AVP-D (polyuria) and delayed SIADH.",
  "Do NOT start levothyroxine before glucocorticoid — precipitates adrenal crisis.",
  "Hold anticoagulants/antiplatelets where possible; reverse if bleeding and vision-threatening.",
];

export default function PituitaryApoplexyRedFlags() {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const toggle = (k: string, v: boolean) => setOn((p) => ({ ...p, [k]: v }));

  const selected = FLAGS.filter((f) => on[f.k]);
  const criticalCount = selected.filter((f) => f.critical).length;
  const total = selected.length;

  const level = useMemo(() => {
    if (criticalCount >= 2 || (criticalCount >= 1 && total >= 3)) return "emergency" as const;
    if (criticalCount >= 1 || total >= 2) return "urgent" as const;
    if (total >= 1) return "watch" as const;
    return "none" as const;
  }, [criticalCount, total]);

  const banner: Record<typeof level, { tone: "danger" | "warning" | "info"; title: string; body: string }> = {
    emergency: {
      tone: "danger",
      title: "TIME-CRITICAL — treat as pituitary apoplexy now",
      body: "Give IV hydrocortisone immediately and activate neurosurgery + ophthalmology. Vision and life are at risk within hours; imaging must not delay steroid.",
    },
    urgent: {
      tone: "warning",
      title: "High suspicion — escalate within the hour",
      body: "Give stress-dose hydrocortisone after drawing bloods, arrange emergency imaging and senior review the same hour. Re-assess vision every 4 h.",
    },
    watch: {
      tone: "info",
      title: "Possible apoplexy — do not discharge without imaging",
      body: "Keep the patient monitored, obtain pituitary imaging and a full anterior pituitary panel, and reassess if any further red flag appears.",
    },
    none: {
      tone: "info",
      title: "No red flags selected",
      body: "Tick the features present. Any single critical feature in a patient with a known or suspected adenoma mandates emergency assessment.",
    },
  };

  const b = banner[level];

  const summary = `PITUITARY APOPLEXY RED-FLAG CHECKLIST
=====================================
Urgency: ${level === "emergency" ? "EMERGENCY — treat now" : level === "urgent" ? "URGENT — escalate within 1 h" : level === "watch" ? "POSSIBLE — image before discharge" : "No red flags selected"}
Red flags present: ${total} (critical: ${criticalCount})

Features
--------
${selected.length ? selected.map((f) => `[x] ${f.label}`).join("\n") : "none selected"}

Immediate management
--------------------
${IMMEDIATE_STEPS.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;

  const copy = () => { navigator.clipboard.writeText(summary); toast.success("Checklist copied"); };
  const print = () => window.print();
  const download = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pituitary-apoplexy-checklist.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionCard
      id="pit-apoplexy"
      title="Pituitary apoplexy — red-flag checklist"
      subtitle="Tick what is present; steroid first, imaging second"
      icon={<Siren className="h-5 w-5" />}
      tone="danger"
    >
      <div className="space-y-4">
        {(["clinical", "endocrine", "imaging"] as const).map((g) => (
          <fieldset key={g} className="rounded-md border border-border p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {GROUP_LABEL[g]}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {FLAGS.filter((f) => f.group === g).map((f) => (
                <label key={f.k} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(on[f.k])}
                    onCheckedChange={(v) => toggle(f.k, Boolean(v))}
                    aria-label={f.label}
                  />
                  <span>
                    {f.label}{" "}
                    {f.critical && <span className="text-xs font-semibold text-destructive">critical</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Red flags" value={String(total)} hint={`of ${FLAGS.length}`} />
          <Stat label="Critical flags" value={String(criticalCount)} hint="vision / haemodynamic / imaging" />
          <Stat
            label="Urgency"
            value={level === "emergency" ? "Emergency" : level === "urgent" ? "Urgent" : level === "watch" ? "Possible" : "—"}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {level === "emergency" && <Pill tone="danger">Act now — hydrocortisone before imaging</Pill>}
          {level === "urgent" && <Pill tone="warning">Escalate within 1 hour</Pill>}
          {level === "watch" && <Pill tone="info">Image before discharge</Pill>}
        </div>

        <Callout tone={b.tone} title={b.title}>{b.body}</Callout>

        {level !== "none" && (
          <div className="rounded-md border border-border p-3">
            <h4 className="mb-2 text-sm font-semibold">Immediate management steps</h4>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {IMMEDIATE_STEPS.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>
        )}

        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="outline" size="sm" onClick={copy}><Copy className="mr-1 h-4 w-4" />Copy</Button>
          <Button variant="outline" size="sm" onClick={print}><Printer className="mr-1 h-4 w-4" />Print</Button>
          <Button variant="outline" size="sm" onClick={download}><Download className="mr-1 h-4 w-4" />Download</Button>
        </div>
      </div>
    </SectionCard>
  );
}
