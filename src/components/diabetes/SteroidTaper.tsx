import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ClipboardList, Copy, Download, Printer, ShieldAlert, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Callout, KeyRow, Pill, SectionCard, Stat } from "./shared";
import {
  GLUCOCORTICOID_EQUIVALENTS,
  assessTaperEligibility,
  buildTaperSchedule,
  clinicalResponse,
  interpretMorningCortisol,
  prednisoneEquivalent,
  type Glucocorticoid,
  type TaperPace,
} from "./steroidTaperLogic";

const PACE: Record<TaperPace, { label: string; note: string }> = {
  faster: { label: "Faster", note: "Shorter holds when disease control is secure" },
  standard: { label: "Standard", note: "Example guideline pace" },
  slower: { label: "Slower", note: "Longer holds after symptoms or prior failed taper" },
};

const CONTEXT_FLAGS = [
  "Repeated recent systemic courses",
  "Prior unsuccessful taper",
  "Long-term high-dose exposure",
  "Pregnancy, frailty, or significant comorbidity",
  "Complex or uncertain steroid conversion",
] as const;

const SYMPTOM_GROUPS = [
  { id: "flare", title: "Disease recurrence", detail: "Return of disease-specific symptoms, signs, or objective organ deterioration." },
  { id: "withdrawal", title: "Withdrawal syndrome", detail: "Fatigue, myalgia, arthralgia, malaise, low mood, or sleep disturbance." },
  { id: "adrenal", title: "Possible adrenal insufficiency", detail: "Marked weakness, anorexia, nausea, postural dizziness, hypotension, abdominal pain, hypoglycaemia, or unexplained hyponatraemia." },
  { id: "crisis", title: "Emergency features", detail: "Collapse, severe hypotension, persistent vomiting, altered mental status, severe weakness, or hypoglycaemia." },
] as const;

type SymptomId = (typeof SYMPTOM_GROUPS)[number]["id"];

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

async function copyWithFallback(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function Choice({ id, checked, onChange, title, detail }: { id: string; checked: boolean; onChange: (checked: boolean) => void; title: string; detail?: string }) {
  return (
    <Label htmlFor={id} className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/20 p-2.5 font-normal">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} className="mt-0.5" />
      <span className="min-w-0 text-xs">
        <span className="block font-medium text-foreground">{title}</span>
        {detail && <span className="mt-0.5 block text-muted-foreground">{detail}</span>}
      </span>
    </Label>
  );
}

function SteroidTaper() {
  const [indication, setIndication] = useState("");
  const [drug, setDrug] = useState<Glucocorticoid>("Prednisolone");
  const [dose, setDose] = useState("40");
  const [durationWeeks, setDurationWeeks] = useState("6");
  const [target, setTarget] = useState("0");
  const [pace, setPace] = useState<TaperPace>("standard");
  const [diseaseControlled, setDiseaseControlled] = useState(false);
  const [currentDoseNoLongerRequired, setCurrentDoseNoLongerRequired] = useState(false);
  const [excludedScenario, setExcludedScenario] = useState(false);
  const [contextFlags, setContextFlags] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomId[]>([]);
  const [cortisol, setCortisol] = useState("");
  const [cortisolUnit, setCortisolUnit] = useState<"nmol/L" | "µg/dL">("nmol/L");
  const [copied, setCopied] = useState(false);

  const doseNumber = Number.parseFloat(dose);
  const durationNumber = Number.parseFloat(durationWeeks);
  const targetNumber = Number.parseFloat(target);
  const predEq = Number.isFinite(doseNumber) ? prednisoneEquivalent(drug, doseNumber) : Number.NaN;
  const repeatedRecentCourses = contextFlags.includes("Repeated recent systemic courses");
  const crisisSymptoms = symptoms.includes("crisis");
  const eligibility = assessTaperEligibility({
    durationWeeks: Number.isFinite(durationNumber) ? durationNumber : 0,
    diseaseControlled,
    currentDoseNoLongerRequired,
    excludedScenario,
    adrenalCrisisConcern: crisisSymptoms,
    repeatedRecentCourses,
  });
  const inputError = !Number.isFinite(doseNumber) || doseNumber <= 0 || doseNumber > 1000
    ? "Enter a current daily dose above 0 and no more than 1000 mg."
    : !Number.isFinite(durationNumber) || durationNumber < 0
      ? "Enter a valid treatment duration."
      : !Number.isFinite(targetNumber) || targetNumber < 0 || targetNumber >= predEq
        ? "Enter a target prednisone-equivalent dose at or above 0 and below the current equivalent dose."
        : null;
  const schedule = useMemo(
    () => eligibility.status === "taper" && !inputError ? buildTaperSchedule(drug, predEq, targetNumber, pace) : [],
    [drug, eligibility.status, inputError, pace, predEq, targetNumber],
  );
  const totalWeeks = schedule.reduce((total, step) => total + step.holdWeeks, 0);
  const response = clinicalResponse({
    diseaseFlare: symptoms.includes("flare"),
    withdrawalSymptoms: symptoms.includes("withdrawal"),
    adrenalSymptoms: symptoms.includes("adrenal"),
    crisisSymptoms,
  });
  const cortisolNumber = cortisol.trim() === "" ? null : Number.parseFloat(cortisol);
  const cortisolResult = interpretMorningCortisol(cortisolNumber, cortisolUnit);
  const nearPhysiologic = Number.isFinite(predEq) && predEq <= 6;
  const longActing = drug === "Dexamethasone" || drug === "Betamethasone";
  const escalationFlags = [
    ...contextFlags.filter((flag) => flag !== "Repeated recent systemic courses"),
    ...(symptoms.includes("adrenal") ? ["Symptoms compatible with adrenal insufficiency"] : []),
    ...(cortisolResult?.level === "indeterminate" ? ["Dynamic adrenal testing may be needed"] : []),
  ];

  const reportText = useMemo(() => {
    const lines = [
      "SYSTEMIC GLUCOCORTICOID WITHDRAWAL — FULL REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "CLINICAL INTAKE",
      `Indication: ${indication.trim() || "Not recorded"}`,
      `Current therapy: ${drug} ${dose || "—"} mg/day`,
      `Prednisone/prednisolone equivalent: ${Number.isFinite(predEq) ? `${formatNumber(predEq)} mg/day` : "Not calculated"}`,
      `Duration: ${durationWeeks || "—"} weeks`,
      `Target: ${target || "—"} mg/day prednisone/prednisolone-equivalent`,
      `Taper pace: ${PACE[pace].label}`,
      `Underlying disease controlled: ${diseaseControlled ? "Confirmed" : "Not confirmed"}`,
      `Current dose no longer required: ${currentDoseNoLongerRequired ? "Confirmed" : "Not confirmed"}`,
      `Outside-framework scenario present: ${excludedScenario ? "Yes" : "No"}`,
      `Clinical context: ${contextFlags.length ? contextFlags.join("; ") : "None selected"}`,
      "",
      "ELIGIBILITY DECISION",
      `${eligibility.title}: ${eligibility.detail}`,
      inputError ? `Input check: ${inputError}` : "",
      "",
      "EXAMPLE TAPER SCHEDULE",
      eligibility.status === "short-course" ? "No HPA-protection taper generated. Reassess the original disease indication and cumulative/repeated exposure." : "",
      eligibility.status === "blocked" ? "No schedule generated until the safety or disease-control gate is resolved." : "",
      ...schedule.map((step, index) => `Step ${index + 1}: ${formatNumber(step.selectedDrugMg)} mg ${drug}/day (${formatNumber(step.prednisoneEquivalentMg)} mg prednisone-equivalent) for ${step.holdWeeks} week(s) — ${step.phase}. ${step.guidance}`),
      schedule.length ? `Estimated example duration: ${totalWeeks} weeks.` : "",
      longActing ? "Long-acting agent: consider conversion to prednisone, prednisolone, or hydrocortisone before the final taper and HPA-axis assessment when the long-acting agent is no longer specifically required." : "",
      "",
      "SYMPTOM REVIEW",
      `Selected branches: ${symptoms.length ? symptoms.map((id) => SYMPTOM_GROUPS.find((group) => group.id === id)?.title).filter(Boolean).join("; ") : "None"}`,
      `${response.title}: ${response.action}`,
      "",
      "HPA-AXIS ASSESSMENT",
      `Testing context: ${nearPhysiologic ? "Current dose is at/near physiologic range; testing may be considered if disease control permits withdrawal." : "Routine testing is not recommended while clearly supraphysiologic treatment remains necessary."}`,
      `Morning cortisol: ${cortisolNumber === null ? "Not entered" : `${cortisol} ${cortisolUnit}`}`,
      cortisolResult ? `${cortisolResult.summary}: ${cortisolResult.action}` : "",
      "Collection: approximately 08:00–09:00. Withholding depends on the agent, formulation, half-life, assay, and local endocrine protocol; a universal 24-hour rule is not appropriate.",
      "",
      "SAFETY AND ESCALATION",
      `Specialist-review flags: ${escalationFlags.length ? escalationFlags.join("; ") : "None selected"}`,
      "Provide local sick-day rules and emergency instructions when adrenal suppression is suspected or confirmed. Consider a steroid card or medical-alert identification.",
      "Persistent vomiting or inability to retain oral medication requires urgent parenteral glucocorticoid coverage and medical assessment.",
      "Hypotension, collapse, altered mental status, severe weakness, hypoglycaemia, or persistent vomiting may indicate adrenal crisis. Treat immediately and do not delay for laboratory confirmation.",
      "",
      "DOCUMENTATION CHECKLIST",
      "• Original indication and disease activity",
      "• Agent, route, start date, cumulative exposure, and current dose",
      "• Disease activity and symptoms at each taper step",
      "• Steroid conversion calculation and example schedule",
      "• Morning cortisol timing, units, assay, and medication-withholding plan",
      "• Sick-day, steroid-card, and emergency advice provided",
      "",
      "Educational decision support only — not an automatic prescription. Verify against the patient context, local protocols, and specialist advice.",
      "Evidence basis: European Society of Endocrinology and Endocrine Society Joint Clinical Guideline on glucocorticoid-induced adrenal insufficiency (2024).",
    ];
    return lines.filter((line) => line !== "").join("\n").replace(/\n{3,}/g, "\n\n");
  }, [contextFlags, cortisol, cortisolNumber, cortisolResult, cortisolUnit, diseaseControlled, dose, drug, durationWeeks, eligibility, escalationFlags, indication, inputError, longActing, nearPhysiologic, pace, predEq, response, schedule, symptoms, target, totalWeeks, currentDoseNoLongerRequired, excludedScenario]);

  const toggleContext = (flag: string) => setContextFlags((current) => current.includes(flag) ? current.filter((item) => item !== flag) : [...current, flag]);
  const toggleSymptom = (id: SymptomId) => setSymptoms((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const copyReport = async () => {
    await copyWithFallback(reportText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const downloadReport = () => {
    const url = URL.createObjectURL(new Blob([reportText], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "systemic-glucocorticoid-withdrawal-report.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  const printReport = () => {
    const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
    if (!popup) return;
    const escaped = reportText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Systemic glucocorticoid withdrawal report</title><style>body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;max-width:820px;margin:auto;padding:32px}pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>${escaped}</pre><script>window.onload=function(){window.print()}</script></body></html>`);
    popup.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Systemic glucocorticoid withdrawal report</h2>
          <p className="text-xs text-muted-foreground">The same complete report is used for copying, downloading, and printing.</p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button size="sm" onClick={copyReport} aria-label="Copy the full steroid taper report to the clipboard"><Copy className="mr-1.5 h-4 w-4" />{copied ? "Copied — paste into notes / EHR" : "Copy full report"}</Button>
          <Button size="sm" variant="outline" onClick={downloadReport}><Download className="mr-1.5 h-4 w-4" />Download .txt</Button>
          <Button size="sm" variant="outline" onClick={printReport}><Printer className="mr-1.5 h-4 w-4" />Print / PDF</Button>
        </div>
      </div>

      <SectionCard id="steroid-taper-intake" title="Enter withdrawal scenario" subtitle="Adults receiving systemic glucocorticoids" icon={<ClipboardList className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2"><Label className="text-xs">Original indication</Label><Input value={indication} onChange={(event) => setIndication(event.target.value)} placeholder="e.g. polymyalgia rheumatica, asthma" /></div>
          <div><Label className="text-xs">Systemic glucocorticoid</Label><select value={drug} onChange={(event) => setDrug(event.target.value as Glucocorticoid)} className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm">{Object.keys(GLUCOCORTICOID_EQUIVALENTS).map((name) => <option key={name}>{name}</option>)}</select></div>
          <div><Label className="text-xs">Current dose (mg/day)</Label><Input type="number" min={0} step="0.25" value={dose} onChange={(event) => setDose(event.target.value)} /></div>
          <div><Label className="text-xs">Duration (weeks)</Label><Input type="number" min={0} step="0.5" value={durationWeeks} onChange={(event) => setDurationWeeks(event.target.value)} /></div>
          <div><Label className="text-xs">Target (mg prednisone-equivalent)</Label><Input type="number" min={0} step="0.5" value={target} onChange={(event) => setTarget(event.target.value)} /></div>
          <div><Label className="text-xs">Example taper pace</Label><select value={pace} onChange={(event) => setPace(event.target.value as TaperPace)} className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm">{Object.entries(PACE).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}</select><p className="mt-1 text-[11px] text-muted-foreground">{PACE[pace].note}</p></div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <Choice id="disease-controlled" checked={diseaseControlled} onChange={setDiseaseControlled} title="Underlying disease is adequately controlled" detail="Required before a taper pathway is displayed." />
          <Choice id="dose-not-required" checked={currentDoseNoLongerRequired} onChange={setCurrentDoseNoLongerRequired} title="Current glucocorticoid dose is no longer required" detail="Disease control and the original indication take priority." />
          <Choice id="excluded-scenario" checked={excludedScenario} onChange={setExcludedScenario} title="Excluded or specialist scenario is present" detail="Known primary adrenal insufficiency, intentional replacement, acute crisis, or non-systemic therapy without substantial absorption." />
        </div>
        <div className="mt-3"><p className="mb-2 text-xs font-semibold">Additional clinical context</p><div className="grid gap-2 md:grid-cols-2">{CONTEXT_FLAGS.map((flag, index) => <Choice key={flag} id={`context-${index}`} checked={contextFlags.includes(flag)} onChange={() => toggleContext(flag)} title={flag} />)}</div></div>
      </SectionCard>

      <SectionCard id="steroid-taper-decision" title="Eligibility and dose assessment" icon={<TrendingDown className="h-5 w-5" />}>
        {inputError && <Callout tone="warning" title="Check inputs">{inputError}</Callout>}
        <Callout tone={eligibility.status === "blocked" ? "danger" : eligibility.status === "short-course" ? "info" : "success"} title={eligibility.title}>{eligibility.detail}</Callout>
        {!inputError && <div className="mt-3 grid gap-3 md:grid-cols-3"><Stat label="Prednisone equivalent" value={`${formatNumber(predEq)} mg/day`} hint={`${dose} mg ${drug} ÷ ${GLUCOCORTICOID_EQUIVALENTS[drug]} × 5`} /><Stat label="Pathway" value={eligibility.status === "taper" ? "Taper" : eligibility.status === "short-course" ? "Short course" : "Blocked"} hint="Not an automatic prescription" /><Stat label="Physiologic range" value="4–6 mg/day" hint="Prednisone/prednisolone equivalent" /></div>}
        {longActing && <Callout tone="warning" title="Long-acting glucocorticoid">When {drug} is no longer specifically required, consider conversion to prednisone, prednisolone, or hydrocortisone before the final taper and HPA-axis assessment.</Callout>}
      </SectionCard>

      {eligibility.status === "taper" && !inputError && (
        <SectionCard id="steroid-taper-schedule" title="Example phase-based taper" subtitle="Clinician review is required at every step" icon={<TrendingDown className="h-5 w-5" />}>
          <Callout tone="info" title="Physiologic-dose bottleneck">An ultra-slow taper is generally not useful while well above physiologic replacement. Reduce relatively rapidly toward 10 mg/day, more slowly from 10 to 5 mg/day, and most gradually near 4–6 mg/day as HPA-axis recovery becomes limiting.</Callout>
          <div className="mt-3 overflow-x-auto rounded-md border border-border"><table className="w-full text-xs"><thead className="bg-muted/50 text-left"><tr><th className="p-2">Step</th><th className="p-2">Phase</th><th className="p-2">{drug}</th><th className="p-2">Pred-eq</th><th className="p-2">Hold</th></tr></thead><tbody>{schedule.map((step, index) => <tr key={`${step.prednisoneEquivalentMg}-${index}`} className="border-t border-border"><td className="p-2 font-medium">{index + 1}</td><td className="p-2 text-muted-foreground">{step.phase}</td><td className="p-2">{formatNumber(step.selectedDrugMg)} mg/day</td><td className="p-2">{formatNumber(step.prednisoneEquivalentMg)} mg/day</td><td className="p-2">{step.holdWeeks} wk</td></tr>)}</tbody></table></div>
          <p className="mt-2 text-xs text-muted-foreground">Estimated example duration: {totalWeeks} weeks. Adjust to disease activity, prior exposure, adverse effects, and symptoms.</p>
        </SectionCard>
      )}

      <SectionCard id="steroid-taper-symptoms" title="Response during taper" subtitle="Distinguish disease flare, withdrawal, and adrenal insufficiency" icon={<Activity className="h-5 w-5" />}>
        <div className="grid gap-2 md:grid-cols-2">{SYMPTOM_GROUPS.map((group) => <Choice key={group.id} id={`symptom-${group.id}`} checked={symptoms.includes(group.id)} onChange={() => toggleSymptom(group.id)} title={group.title} detail={group.detail} />)}</div>
        <Callout tone={response.level} title={response.title}>{response.action}</Callout>
      </SectionCard>

      <SectionCard id="steroid-taper-hpa" title="HPA-axis recovery assessment" subtitle="Use near physiologic dose when discontinuation is clinically possible" icon={<Activity className="h-5 w-5" />}>
        {!nearPhysiologic && <Callout tone="info" title="Testing is usually premature">Routine HPA-axis testing is not useful while the patient remains on a clearly supraphysiologic dose or still requires glucocorticoids for disease control.</Callout>}
        <div className="mt-3 grid gap-3 md:grid-cols-2"><div><Label className="text-xs">08:00–09:00 serum cortisol</Label><div className="mt-1 flex gap-2"><Input type="number" min={0} value={cortisol} onChange={(event) => setCortisol(event.target.value)} placeholder={cortisolUnit === "nmol/L" ? "e.g. 220" : "e.g. 8"} /><select value={cortisolUnit} onChange={(event) => setCortisolUnit(event.target.value as "nmol/L" | "µg/dL")} className="h-9 rounded-md border border-border bg-background px-2 text-sm"><option>nmol/L</option><option>µg/dL</option></select></div><p className="mt-1 text-[11px] text-muted-foreground">Withholding depends on the agent, formulation, half-life, assay, and local endocrine protocol. Dexamethasone needs specific guidance.</p></div><div className="space-y-1"><KeyRow k="Below 3 µg/dL" v="Adrenal insufficiency likely" /><KeyRow k="3–15 µg/dL" v="Indeterminate; consider ACTH stimulation" /><KeyRow k="Above 15 µg/dL" v="Adrenal insufficiency unlikely" /></div></div>
        {cortisolResult && <Callout tone={cortisolResult.level === "low" ? "danger" : cortisolResult.level === "indeterminate" ? "warning" : "success"} title={cortisolResult.summary}>{cortisolResult.action}</Callout>}
        <p className="mt-2 text-[11px] text-muted-foreground">Thresholds are guides, not absolute binary cut-offs. Interpret with collection timing, assay methodology, medicines, and clinical context.</p>
      </SectionCard>

      <SectionCard id="steroid-taper-safety" title="Stress dosing, emergency safety, and documentation" icon={<ShieldAlert className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-2"><Callout tone="warning" title="Stress-dose precautions">For suspected or confirmed suppression, provide local sick-day rules for fever, significant illness, trauma, surgery, invasive procedures, and inability to take oral medication. Consider a steroid card or medical-alert identification.</Callout><Callout tone="danger" title="Adrenal crisis — emergency"><span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Treat suspected crisis immediately with emergency glucocorticoid and supportive care; do not wait for confirmatory laboratory testing.</span></Callout></div>
        <div className="mt-3 flex flex-wrap gap-1.5">{["Original indication", "Agent, route, dates and exposure", "Disease activity", "Symptoms at each step", "Conversion calculation", "Cortisol timing, units and withholding", "Sick-day and emergency advice"].map((item) => <Pill key={item} tone="info">{item}</Pill>)}</div>
        {escalationFlags.length > 0 && <Callout tone="warning" title="Specialist review flags"><ul className="ml-4 list-disc">{escalationFlags.map((flag) => <li key={flag}>{flag}</li>)}</ul></Callout>}
        <p className="mt-3 text-[11px] text-muted-foreground">Educational framework for adults receiving systemic glucocorticoids. Excludes known primary adrenal insufficiency, intentional replacement therapy, and acute adrenal crisis. Based on the 2024 ESE/Endocrine Society joint guideline; verify local protocols.</p>
      </SectionCard>
    </div>
  );
}

export default SteroidTaper;