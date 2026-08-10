import { useMemo, useState } from "react";
import { ShieldCheck, Copy, Printer, Eye, ClipboardList } from "lucide-react";
import { SectionCard, Callout, Pill, KeyRow } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import OpticNerveNaionApp from "./OpticNerveNaionApp";

const AGENTS = ["Semaglutide", "Tirzepatide", "Liraglutide", "Dulaglutide"] as const;
const INDICATIONS = [
  "Type 2 diabetes",
  "Chronic weight management",
  "Cardiometabolic risk reduction",
  "Other approved local indication",
] as const;
const COMORBID = [
  "Type 2 diabetes", "Hypertension", "Dyslipidaemia", "Obstructive sleep apnoea",
  "Established cardiovascular disease",
  "Metabolic dysfunction-associated steatotic liver disease",
  "Osteoarthritis / mobility-limiting obesity complication",
] as const;
const YNU = ["No", "Yes", "Unknown"] as const;
const YN = ["No", "Yes"] as const;
const DM_TYPE = ["Type 1", "Type 2", "Other / uncertain"] as const;
const GI = [
  "Known gastroparesis", "Severe GI motility disorder", "Persistent vomiting / dehydration",
  "Inflammatory bowel disease flare", "None known",
] as const;
const RENAL = [
  "eGFR below 30 mL/min/1.73m²", "Recent acute kidney injury", "Loop diuretic use",
  "Recurrent vomiting or poor oral intake", "None known",
] as const;
const RETINOPATHY = [
  "No known retinopathy", "Mild/moderate NPDR", "Severe NPDR", "Proliferative DR",
  "Diabetic macular oedema", "Unknown / not assessed",
] as const;
const RETINA_RX = [
  "Anti-VEGF treatment", "Retinal laser treatment", "Vitrectomy",
  "Under active retinal follow-up", "None",
] as const;
const VISUAL_FLAGS = [
  "Sudden painless visual loss", "New visual-field defect", "Acute unilateral colour desaturation",
  "New flashes or floaters", "Distortion / metamorphopsia", "None",
] as const;
const EYE_HX = [
  "Glaucoma or glaucoma suspect", "Macular degeneration", "Optic neuropathy / disc disease",
  "No relevant history",
] as const;
const NUTRITION = [
  "Vitamin B12", "25-OH vitamin D", "Ferritin / iron studies", "Folate",
  "Albumin / nutrition assessment",
] as const;

type Outcome =
  | "NOT_ELIGIBLE" | "DO_NOT_START" | "DEFER_AND_REVIEW"
  | "START_WITH_PRECAUTIONS" | "ELIGIBLE_PENDING_CLINICIAN_REVIEW";

const OUTCOME_META: Record<Outcome, { label: string; tone: "danger" | "warning" | "info" | "success" }> = {
  DO_NOT_START: { label: "Do not start", tone: "danger" },
  NOT_ELIGIBLE: { label: "Not eligible (indication threshold)", tone: "warning" },
  DEFER_AND_REVIEW: { label: "Defer & review", tone: "warning" },
  START_WITH_PRECAUTIONS: { label: "Start with precautions", tone: "info" },
  ELIGIBLE_PENDING_CLINICIAN_REVIEW: { label: "Eligible — pending clinician review", tone: "success" },
};

const RANK: Outcome[] = [
  "DO_NOT_START", "NOT_ELIGIBLE", "DEFER_AND_REVIEW",
  "START_WITH_PRECAUTIONS", "ELIGIBLE_PENDING_CLINICIAN_REVIEW",
];

function useSet<T extends string>(initial: T[] = []) {
  const [set, setSet] = useState<T[]>(initial);
  const toggle = (v: T) => setSet((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  return { set, toggle, has: (v: T) => set.includes(v) };
}

function CheckGroup<T extends string>({
  label, options, state,
}: { label: string; options: readonly T[]; state: ReturnType<typeof useSet<T>> }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o} className="flex items-start gap-2 text-sm">
            <Checkbox checked={state.has(o)} onCheckedChange={() => state.toggle(o)} className="mt-0.5" />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Choice({
  label, value, onChange, options, hint,
}: { label: string; value: string; onChange: (v: string) => void; options: readonly string[]; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Num({
  label, value, onChange, unit, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; unit?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}{unit ? <span className="text-muted-foreground"> ({unit})</span> : null}</Label>
      <Input inputMode="decimal" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PreScreen() {
  const [agent, setAgent] = useState<string>("Semaglutide");
  const indication = useSet<string>([]);
  const comorbid = useSet<string>([]);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [lifestyle, setLifestyle] = useState<string>("Yes");

  const [personalMtc, setPersonalMtc] = useState<string>("No");
  const [familyMtc, setFamilyMtc] = useState<string>("No");
  const [men2, setMen2] = useState<string>("No");
  const [allergy, setAllergy] = useState<string>("No");
  const [pregnant, setPregnant] = useState<string>("No");
  const [breastfeeding, setBreastfeeding] = useState<string>("No");
  const [pregPlanned, setPregPlanned] = useState<string>("No");

  const [diabetes, setDiabetes] = useState<string>("No");
  const [dmType, setDmType] = useState<string>("Type 2");
  const [insulinSu, setInsulinSu] = useState<string>("No");
  const [pancreatitis, setPancreatitis] = useState<string>("No");
  const [biliary, setBiliary] = useState<string>("No");
  const gi = useSet<string>([]);
  const renal = useSet<string>([]);
  const [psych, setPsych] = useState<string>("No");
  const [currentGlp1, setCurrentGlp1] = useState<string>("No");
  const [dpp4, setDpp4] = useState<string>("No");

  const [lastExam, setLastExam] = useState("");
  const [retinopathy, setRetinopathy] = useState<string>("No known retinopathy");
  const retinaRx = useSet<string>([]);
  const visualFlags = useSet<string>([]);
  const eyeHx = useSet<string>([]);

  const [bp, setBp] = useState("");
  const [hba1c, setHba1c] = useState("");
  const [fpg, setFpg] = useState("");
  const [creat, setCreat] = useState("");
  const [egfr, setEgfr] = useState("");
  const [alt, setAlt] = useState("");
  const [ast, setAst] = useState("");
  const [bili, setBili] = useState("");
  const [tsh, setTsh] = useState("");
  const [lipase, setLipase] = useState("");
  const [amylase, setAmylase] = useState("");
  const nutrition = useSet<string>([]);

  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100, w = parseFloat(weight);
    if (!h || !w || h <= 0) return null;
    return Math.round((w / (h * h)) * 10) / 10;
  }, [height, weight]);

  const result = useMemo(() => {
    const a1c = parseFloat(hba1c);
    const weightIndication = bmi !== null && (bmi >= 30 || (bmi >= 27 && comorbid.set.length > 0));
    const rapidFall =
      diabetes === "Yes" &&
      ((!Number.isNaN(a1c) && a1c >= 9) || insulinSu === "Yes" || retinopathy !== "No known retinopathy");

    const fired: { outcome: Outcome; message: string; id: string }[] = [];
    const push = (outcome: Outcome, id: string, message: string) => fired.push({ outcome, id, message });

    if (personalMtc === "Yes" || familyMtc === "Yes" || men2 === "Yes")
      push("DO_NOT_START", "MTC / MEN2", "Do not initiate the selected GLP-1RA / dual incretin agent. Confirm history and select an alternative strategy.");
    if (allergy === "Yes")
      push("DO_NOT_START", "Hypersensitivity", "Do not initiate the implicated product. Document the reaction and choose an alternative treatment.");
    const hasFlag = visualFlags.set.some((v) => v !== "None");
    if (hasFlag)
      push("DEFER_AND_REVIEW", "Urgent ophthalmology", "Urgent same-day ophthalmology or emergency assessment before treatment decision. Do not attribute acute visual symptoms to GLP-1 therapy without evaluation.");
    if (["Severe NPDR", "Proliferative DR", "Diabetic macular oedema"].includes(retinopathy) ||
        retinaRx.set.some((v) => v !== "None"))
      push("DEFER_AND_REVIEW", "Retinal specialist review", "Obtain retinal specialist input and a plan for close follow-up before or contemporaneous with initiation; avoid unnecessarily rapid glycaemic correction.");
    if (diabetes === "Yes" && dmType === "Type 1")
      push("DEFER_AND_REVIEW", "Type 1 diabetes", "Not a substitute for insulin. Require endocrinology-led assessment and a ketone/sick-day safety plan.");
    if (pancreatitis === "Yes" || biliary === "Yes")
      push("DEFER_AND_REVIEW", "Pancreatobiliary", "Clarify aetiology, current activity, and competing risk before prescribing; investigate active abdominal symptoms before initiation.");
    if (gi.set.some((v) => ["Known gastroparesis", "Severe GI motility disorder", "Persistent vomiting / dehydration"].includes(v)))
      push("DEFER_AND_REVIEW", "GI motility", "Assess severity and risks of worsening nausea, vomiting, dehydration, and medication intolerance; consider specialist review or alternative therapy.");
    if (rapidFall || retinopathy === "Unknown / not assessed")
      push("START_WITH_PRECAUTIONS", "Retinopathy risk", "Arrange baseline dilated retinal assessment or retinal photography/OCT according to access and risk; plan follow-up in the first 3–6 months.");
    if (insulinSu === "Yes")
      push("START_WITH_PRECAUTIONS", "Hypoglycaemia plan", "Create an insulin/sulfonylurea dose-reduction and glucose-monitoring plan at initiation and each titration step.");
    if (indication.has("Chronic weight management") && !weightIndication)
      push("NOT_ELIGIBLE", "Weight indication", "Does not meet this app's default weight-management threshold (BMI ≥30, or ≥27 with a weight-related comorbidity). Check approved local indication and payer policy.");
    if (currentGlp1 === "Yes")
      push("DEFER_AND_REVIEW", "Duplicate incretin therapy", "Do not co-prescribe two incretin-based agents. Stop the current agent and plan a washout/switch before initiation.");
    if (pregnant === "Yes" || breastfeeding === "Yes")
      push("DO_NOT_START", "Pregnancy / lactation", "Avoid in pregnancy and breastfeeding; use an alternative strategy and provide contraception advice.");
    if (pregPlanned === "Yes")
      push("DEFER_AND_REVIEW", "Pregnancy planned", "Plan discontinuation before conception (agent-specific washout, e.g. ~2 months for weekly agents) and discuss alternatives.");
    if (psych === "Yes")
      push("DEFER_AND_REVIEW", "Eating disorder / psychiatric risk", "Involve mental-health or eating-disorder services before initiation; agree monitoring and adherence safeguards.");
    if (renal.set.some((v) => v !== "None known"))
      push("START_WITH_PRECAUTIONS", "Renal / volume risk", "Counsel on hydration and sick-day rules; recheck renal function after initiation and during titration; review diuretics.");
    if (lifestyle === "No")
      push("START_WITH_PRECAUTIONS", "Lifestyle programme", "Pair pharmacotherapy with a documented diet, activity and behavioural plan.");

    if (!fired.length)
      push("ELIGIBLE_PENDING_CLINICIAN_REVIEW", "Default", "No hard-stop risk identified. Confirm indication, product-specific label requirements, baseline data, education, and follow-up plan.");

    const overall = RANK.find((r) => fired.some((f) => f.outcome === r)) ?? "ELIGIBLE_PENDING_CLINICIAN_REVIEW";

    const missing: string[] = [];
    if (!creat) missing.push("Serum creatinine");
    if (!egfr) missing.push("eGFR");
    if (!alt) missing.push("ALT");
    if ((diabetes === "Yes" || indication.has("Type 2 diabetes")) && !hba1c) missing.push("HbA1c");
    if (!bp) missing.push("Blood pressure");
    if (!lastExam && (diabetes === "Yes" || retinopathy !== "No known retinopathy")) missing.push("Dilated retinal examination date");

    const ophthTier = hasFlag
      ? "Red flag — urgent same-day assessment"
      : ["Severe NPDR", "Proliferative DR", "Diabetic macular oedema"].includes(retinopathy)
        ? "High — retinal specialist before/with initiation"
        : rapidFall || retinopathy === "Unknown / not assessed"
          ? "Intermediate — baseline imaging and 3–6 month review"
          : "Low — routine screening interval";

    return { overall, fired, weightIndication, rapidFall, missing, ophthTier };
  }, [bmi, comorbid.set, diabetes, dmType, hba1c, insulinSu, retinopathy, personalMtc, familyMtc, men2,
      allergy, visualFlags.set, retinaRx.set, pancreatitis, biliary, gi.set, renal.set, indication,
      currentGlp1, pregnant, breastfeeding, pregPlanned, psych, lifestyle, creat, egfr, alt, bp, lastExam]);

  const report = useMemo(() => {
    const lines = [
      "GLP-1RA / Dual GIP–GLP-1 Pre-Screen",
      `Proposed agent: ${agent}`,
      `Indication: ${indication.set.join(", ") || "—"}`,
      `BMI: ${bmi ?? "—"} kg/m² · weight-management indication met: ${result.weightIndication ? "yes" : "no"}`,
      `Weight-related comorbidities: ${comorbid.set.join(", ") || "none recorded"}`,
      "",
      `OUTCOME: ${OUTCOME_META[result.overall as Outcome].label}`,
      ...result.fired.map((f) => `• [${f.id}] ${f.message}`),
      "",
      `Ophthalmic risk tier: ${result.ophthTier}`,
      `Known retinopathy: ${retinopathy}; treatment history: ${retinaRx.set.join(", ") || "none"}`,
      `Visual red flags: ${visualFlags.set.filter((v) => v !== "None").join(", ") || "none"}`,
      `Other ophthalmic history: ${eyeHx.set.join(", ") || "none"}`,
      "",
      `Insulin/sulfonylurea in use: ${insulinSu}`,
      `Baseline: BP ${bp || "—"}, HbA1c ${hba1c || "—"}%, FPG ${fpg || "—"} mg/dL, creatinine ${creat || "—"} mg/dL, eGFR ${egfr || "—"}, ALT ${alt || "—"}, AST ${ast || "—"}, bilirubin ${bili || "—"}, TSH ${tsh || "—"}, lipase ${lipase || "—"}, amylase ${amylase || "—"}`,
      `Nutrition tests requested: ${nutrition.set.join(", ") || "none"}`,
      `Missing / pending baseline data: ${result.missing.join(", ") || "none"}`,
      "",
      "Counselling checklist: GI side-effects & titration, hydration and sick-day rules, hypoglycaemia if on insulin/SU, gallbladder and pancreatitis warning symptoms, visual symptom red flags, pregnancy/contraception, injection technique, nutrition and protein intake, follow-up interval.",
      "Clinician approval: ____________________  Date: __________  Next review: __________",
      "",
      "Decision support only — does not replace product labelling, local policy, or clinical judgement.",
    ];
    return lines.join("\n");
  }, [agent, indication.set, bmi, result, comorbid.set, retinopathy, retinaRx.set, visualFlags.set,
      eyeHx.set, insulinSu, bp, hba1c, fpg, creat, egfr, alt, ast, bili, tsh, lipase, amylase, nutrition.set]);

  const meta = OUTCOME_META[result.overall as Outcome];

  return (
    <div className="space-y-5">
      <Callout tone="info" title="Clinician use only">
        Decision support only. Does not replace product-specific prescribing information, local policy, clinical
        judgement, or specialist referral.
      </Callout>

      <SectionCard id="glp1-goal" title="Indication and treatment goal" icon={<ClipboardList className="h-5 w-5" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice label="Proposed agent" value={agent} onChange={setAgent} options={AGENTS} />
          <Choice label="Diet/activity/behavioural intervention reviewed or planned" value={lifestyle} onChange={setLifestyle} options={YN} />
          <Num label="Height" value={height} onChange={setHeight} unit="cm" placeholder="170" />
          <Num label="Weight" value={weight} onChange={setWeight} unit="kg" placeholder="82" />
        </div>
        <div className="mt-4 grid gap-4">
          <CheckGroup label="Intended indication" options={INDICATIONS} state={indication} />
          <CheckGroup label="Weight-related comorbidities" options={COMORBID} state={comorbid} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill tone={bmi === null ? "default" : bmi >= 30 ? "warning" : "info"}>BMI {bmi ?? "—"} kg/m²</Pill>
          <Pill tone={result.weightIndication ? "success" : "default"}>
            Weight-management threshold {result.weightIndication ? "met" : "not met"}
          </Pill>
        </div>
      </SectionCard>

      <SectionCard id="glp1-hardstop" title="Hard-stop safety screen" tone="warning">
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice label="Personal history of medullary thyroid carcinoma" value={personalMtc} onChange={setPersonalMtc} options={YNU} />
          <Choice label="Family history of MTC" value={familyMtc} onChange={setFamilyMtc} options={YNU} />
          <Choice label="Multiple endocrine neoplasia type 2 (MEN2)" value={men2} onChange={setMen2} options={YNU} />
          <Choice label="Prior serious hypersensitivity to agent/excipients" value={allergy} onChange={setAllergy} options={YNU} />
          <Choice label="Currently pregnant" value={pregnant} onChange={setPregnant} options={YNU} />
          <Choice label="Currently breastfeeding" value={breastfeeding} onChange={setBreastfeeding} options={YNU} />
          <Choice label="Pregnancy planned during treatment period" value={pregPlanned} onChange={setPregPlanned} options={YNU} />
        </div>
      </SectionCard>

      <SectionCard id="glp1-risk" title="Clinical risk review">
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice label="Diabetes mellitus" value={diabetes} onChange={setDiabetes} options={YN} />
          {diabetes === "Yes" && <Choice label="Diabetes type" value={dmType} onChange={setDmType} options={DM_TYPE} />}
          <Choice label="Current insulin or sulfonylurea treatment" value={insulinSu} onChange={setInsulinSu} options={YN}
            hint="Triggers hypoglycaemia-medication review and glucose-monitoring plan." />
          <Choice label="Previous acute or chronic pancreatitis" value={pancreatitis} onChange={setPancreatitis} options={YNU} />
          <Choice label="Active biliary disease / cholestatic symptoms" value={biliary} onChange={setBiliary} options={YNU} />
          <Choice label="Active eating disorder or major psychiatric risk" value={psych} onChange={setPsych} options={YNU} />
          <Choice label="Currently using another GLP-1 RA or dual incretin" value={currentGlp1} onChange={setCurrentGlp1} options={YN} />
        </div>
        <div className="mt-4 grid gap-4">
          <CheckGroup label="GI disorders" options={GI} state={gi} />
          <CheckGroup label="Renal / volume-depletion risk" options={RENAL} state={renal} />
        </div>
      </SectionCard>

      <SectionCard id="glp1-eye" title="Ophthalmology screening" icon={<Eye className="h-5 w-5" />} tone="info">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Most recent dilated retinal examination</Label>
            <Input type="date" value={lastExam} onChange={(e) => setLastExam(e.target.value)} />
          </div>
          <Choice label="Known diabetic retinopathy" value={retinopathy} onChange={setRetinopathy} options={RETINOPATHY} />
        </div>
        <div className="mt-4 grid gap-4">
          <CheckGroup label="Retinopathy treatment/history" options={RETINA_RX} state={retinaRx} />
          <CheckGroup label="Current visual symptoms" options={VISUAL_FLAGS} state={visualFlags} />
          <CheckGroup label="Other ophthalmic history" options={EYE_HX} state={eyeHx} />
        </div>
        <Callout tone="warning" title="Ophthalmic risk tier">{result.ophthTier}</Callout>
        <p className="text-xs text-muted-foreground">
          For disc-at-risk anatomy, IOP, OCT and NAION-specific grading, use the <b>Optic nerve / NAION</b> tab.
        </p>
      </SectionCard>

      <SectionCard id="glp1-baseline" title="Baseline observations and investigations">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Blood pressure</Label>
            <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="e.g., 132/82" />
          </div>
          <Num label="HbA1c" value={hba1c} onChange={setHba1c} unit="%" />
          <Num label="Fasting plasma glucose" value={fpg} onChange={setFpg} unit="mg/dL" />
          <Num label="Serum creatinine" value={creat} onChange={setCreat} unit="mg/dL" />
          <Num label="eGFR" value={egfr} onChange={setEgfr} unit="mL/min/1.73m²" />
          <Num label="ALT" value={alt} onChange={setAlt} unit="U/L" />
          <Num label="AST" value={ast} onChange={setAst} unit="U/L" />
          <Num label="Total bilirubin" value={bili} onChange={setBili} unit="mg/dL" />
          <Num label="TSH" value={tsh} onChange={setTsh} unit="mIU/L" />
          <Num label="Lipase" value={lipase} onChange={setLipase} unit="U/L" />
          <Num label="Amylase" value={amylase} onChange={setAmylase} unit="U/L" />
        </div>
        <div className="mt-4">
          <CheckGroup label="Nutrition testing, if risk or dietary restriction anticipated" options={NUTRITION} state={nutrition} />
        </div>
        <Callout tone="info" title="Test-ordering caveats">
          TSH only for unexplained weight change or thyroid symptoms — it is not a GLP-1RA-specific requirement.
          Order lipase for symptoms or history suggesting pancreatic disease; an isolated asymptomatic elevation does
          not diagnose pancreatitis.
        </Callout>
      </SectionCard>

      <SectionCard id="glp1-result" title="Pre-screen result" icon={<ShieldCheck className="h-5 w-5" />} tone={meta.tone === "danger" ? "danger" : meta.tone === "warning" ? "warning" : "info"}>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={meta.tone === "danger" ? "danger" : meta.tone === "warning" ? "warning" : meta.tone === "success" ? "success" : "info"}>
            {meta.label}
          </Pill>
          <Pill tone="default">{agent}</Pill>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {result.fired.map((f) => (
            <li key={f.id} className="rounded-md border border-border bg-muted/30 p-2">
              <span className="font-medium">{f.id}: </span>{f.message}
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1">
          <KeyRow k="Ophthalmic tier" v={result.ophthTier} />
          <KeyRow k="Missing baseline data" v={result.missing.join(", ") || "none"} />
          <KeyRow k="Insulin/SU adjustment" v={insulinSu === "Yes" ? "Required at initiation and each titration step" : "Not applicable"} />
          <KeyRow k="Rapid HbA1c fall risk" v={result.rapidFall ? "Yes — titrate gradually, plan retinal review" : "No"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(report)}>
            <Copy className="mr-1.5 h-4 w-4" /> Copy report
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </div>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-xs">{report}</pre>
      </SectionCard>
    </div>
  );
}

export default function Glp1ScreeningApp() {
  return (
    <Tabs defaultValue="prescreen" className="w-full">
      <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
        <TabsTrigger value="prescreen">Pre-screen</TabsTrigger>
        <TabsTrigger value="optic">Optic nerve / NAION</TabsTrigger>
      </TabsList>
      <TabsContent value="prescreen" className="mt-4"><PreScreen /></TabsContent>
      <TabsContent value="optic" className="mt-4"><OpticNerveNaionApp /></TabsContent>
    </Tabs>
  );
}
