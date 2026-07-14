import { useMemo, useState } from "react";
import { Activity, Bone, ClipboardCopy, Download, FileText, FlaskConical, Stethoscope, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";

const SYMPTOMS = [
  "Diffuse bone pain",
  "Proximal muscle weakness",
  "Difficulty rising from chair",
  "Waddling gait",
  "Low-trauma fractures",
  "Rib or pelvic tenderness",
  "Global fatigue",
] as const;

const RISK_FACTORS = [
  { id: "sun", label: "Very limited sun exposure" },
  { id: "covered", label: "Covered clothing / cultural dress" },
  { id: "darkskin", label: "Dark skin at high latitude" },
  { id: "vegan", label: "Vegan or low-calcium diet" },
  { id: "malabs", label: "Malabsorption (celiac, IBD, bariatric)" },
  { id: "ckd", label: "CKD (eGFR < 60)" },
  { id: "liver", label: "Chronic liver disease" },
  { id: "aeds", label: "Enzyme-inducing antiepileptics" },
  { id: "steroids", label: "Glucocorticoid therapy" },
  { id: "fatmalabs", label: "Cholestyramine / orlistat / fat-malabsorptive drug" },
  { id: "ppi", label: "Long-term proton pump inhibitor" },
  { id: "obese", label: "Obesity (BMI ≥ 30)" },
  { id: "preg", label: "Recent pregnancy or lactation" },
  { id: "elderly", label: "Older age (>65 y)" },
] as const;

const RED_FLAGS = [
  "Inability to walk or stand",
  "Multiple recent low-trauma fractures",
  "Severe bone pain unresponsive to analgesia",
  "Suspected pathologic fracture",
  "Hypercalcemia symptoms (confusion, polyuria)",
  "Very low calcium with tetany or seizures",
] as const;

const XRAY_FINDINGS = [
  "Looser zones / pseudofractures",
  "Generalized osteopenia",
  "Biconcave vertebrae",
  "Codfish vertebrae",
  "No specific abnormality",
] as const;

type Unit25OH = "ng/mL" | "nmol/L";
type UnitCa = "mg/dL" | "mmol/L";

export default function OsteomalaciaApp() {
  // intake
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"female" | "male" | "other" | "">("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [redFlags, setRedFlags] = useState<string[]>([]);

  // labs
  const [ca, setCa] = useState("");
  const [caUnit, setCaUnit] = useState<UnitCa>("mg/dL");
  const [phos, setPhos] = useState("");
  const [alp, setAlp] = useState("");
  const [alpUpper, setAlpUpper] = useState("130");
  const [vitD, setVitD] = useState("");
  const [vitDUnit, setVitDUnit] = useState<Unit25OH>("ng/mL");
  const [pth, setPth] = useState("");
  const [egfr, setEgfr] = useState("");
  const [mg, setMg] = useState("");

  // imaging
  const [xrayFindings, setXrayFindings] = useState<string[]>([]);

  const toggle = (arr: string[], setter: (v: string[]) => void, v: string) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const assessment = useMemo(() => {
    const vitDnum = parseFloat(vitD);
    const vitD_nmol = isNaN(vitDnum) ? NaN : vitDUnit === "ng/mL" ? vitDnum * 2.5 : vitDnum;
    const alpNum = parseFloat(alp);
    const alpUp = parseFloat(alpUpper) || 130;
    const alpElevated = !isNaN(alpNum) && alpNum > alpUp;
    const phosNum = parseFloat(phos);
    const egfrNum = parseFloat(egfr);
    const caNum = parseFloat(ca);
    const phosLow = !isNaN(phosNum) && phosNum < (2.5); // mg/dL approx
    const vitDNormalHigh = !isNaN(vitD_nmol) && vitD_nmol >= 50;
    const hasMalabs = risks.includes("malabs") || risks.includes("fatmalabs");
    const ckd = risks.includes("ckd") || (!isNaN(egfrNum) && egfrNum < 60);
    const drugInduced = risks.includes("aeds") || risks.includes("fatmalabs");

    let vitDStatus: "severe" | "moderate" | "insufficient" | "sufficient" | "unknown" = "unknown";
    if (!isNaN(vitD_nmol)) {
      if (vitD_nmol < 25) vitDStatus = "severe";
      else if (vitD_nmol < 50) vitDStatus = "moderate";
      else if (vitD_nmol < 75) vitDStatus = "insufficient";
      else vitDStatus = "sufficient";
    }

    let likelihood: "likely" | "possible" | "unlikely" | "indeterminate" = "indeterminate";
    const coreSx = symptoms.includes("Diffuse bone pain") && symptoms.includes("Proximal muscle weakness");
    if (coreSx && alpElevated && (vitDStatus === "severe" || (vitDStatus === "unknown" && risks.length > 0))) {
      likelihood = "likely";
    } else if (symptoms.length > 0 && risks.length > 0 && (alpElevated || vitDStatus === "severe")) {
      likelihood = "possible";
    } else if (vitDStatus === "sufficient" && !alpElevated && symptoms.length === 0) {
      likelihood = "unlikely";
    }
    if (xrayFindings.includes("Looser zones / pseudofractures")) likelihood = "likely";

    const etiologies: { id: string; label: string }[] = [];
    if (vitDStatus === "severe" && !hasMalabs && !ckd) etiologies.push({ id: "nutritional", label: "Nutritional vitamin D deficiency" });
    if ((vitDStatus === "severe" || vitDStatus === "moderate") && hasMalabs) etiologies.push({ id: "malabsorption", label: "Malabsorption-related osteomalacia" });
    if (ckd) etiologies.push({ id: "ckd", label: "CKD-related mineral bone disorder" });
    if (phosLow && vitDNormalHigh) etiologies.push({ id: "phosphate", label: "Phosphate-wasting osteomalacia (consider FGF23-mediated)" });
    if (drugInduced) etiologies.push({ id: "drug", label: "Drug-related osteomalacia" });
    if (etiologies.length === 0 && likelihood !== "unlikely") etiologies.push({ id: "unclear", label: "Etiology unclear — complete workup" });

    return { vitD_nmol, vitDStatus, alpElevated, phosLow, vitDNormalHigh, hasMalabs, ckd, drugInduced, likelihood, etiologies, caNum };
  }, [vitD, vitDUnit, alp, alpUpper, phos, egfr, ca, risks, symptoms, xrayFindings]);

  const plan = useMemo(() => {
    const items: { title: string; body: string; tone?: "info" | "warning" | "danger" | "success" }[] = [];
    const et = assessment.etiologies.map((e) => e.id);
    if (redFlags.length > 0) {
      items.push({ tone: "danger", title: "Urgent referral", body: "Red flags present — refer for hospital/specialist evaluation. Consider imaging for occult fractures and exclude malignancy." });
    }
    if (et.includes("nutritional") && assessment.likelihood !== "unlikely") {
      items.push({ tone: "info", title: "Vitamin D loading — nutritional", body: "Oral cholecalciferol 50,000 IU weekly × 6–8 wk (or 20,000–40,000 IU weekly × 8–12 wk), then 800–2,000 IU daily maintenance. Adjust to local formulary." });
    }
    if (et.includes("malabsorption")) {
      items.push({ tone: "warning", title: "Vitamin D — malabsorption", body: "Use higher oral doses or specialist-supervised IM cholecalciferol/ergocalciferol. Treat underlying gut disease. Recheck Ca/P at 4 weeks." });
    }
    if (et.includes("ckd")) {
      items.push({ tone: "warning", title: "CKD-MBD pathway", body: "Do NOT give high-dose native vitamin D without nephrology input. Consider activated analogs (calcitriol / alfacalcidol) and manage Ca/P/PTH per KDIGO CKD-MBD." });
    }
    if (et.includes("phosphate")) {
      items.push({ tone: "warning", title: "Phosphate wasting", body: "Refer to endocrinology. Evaluate FGF23, TmP/GFR. Consider oral phosphate + active vitamin D under specialist care." });
    }
    if (et.includes("drug")) {
      items.push({ tone: "info", title: "Drug-related", body: "Review offending agents (AEDs, orlistat, cholestyramine). Escalate vitamin D dose and reassess drug necessity with prescriber." });
    }
    if (assessment.likelihood === "likely" || assessment.likelihood === "possible") {
      items.push({ tone: "info", title: "Calcium intake", body: "Total daily elemental calcium ~1000–1500 mg from diet ± supplements if intake low." });
      items.push({ tone: "info", title: "Monitoring", body: "Recheck serum calcium 4 wk after last loading dose; repeat 25-OH vitamin D at 3–6 months. Clinical improvement in pain/weakness may lag biochemical correction by months." });
    }
    if (parseFloat(mg) && parseFloat(mg) < 1.6) {
      items.push({ tone: "warning", title: "Correct hypomagnesemia", body: "Low Mg impairs PTH secretion and vitamin D action — replace before/alongside vitamin D." });
    }
    return items;
  }, [assessment, redFlags, mg]);

  const workupSuggestions = useMemo(() => {
    const list: string[] = [];
    if (!vitD) list.push("25-OH vitamin D");
    if (!ca) list.push("Serum calcium (corrected for albumin)");
    if (!phos) list.push("Serum phosphate");
    if (!alp) list.push("Alkaline phosphatase (± bone-specific ALP)");
    if (!pth) list.push("Intact PTH");
    if (!egfr) list.push("Creatinine / eGFR");
    if (!mg) list.push("Serum magnesium");
    if (assessment.etiologies.some((e) => e.id === "phosphate")) list.push("24-h urine phosphate, TmP/GFR, FGF23");
    if (assessment.ckd) list.push("Ca × P product, 1,25-(OH)₂ vitamin D");
    if (assessment.hasMalabs) list.push("Tissue transglutaminase (celiac), fecal fat, B12, folate, iron");
    if (!xrayFindings.length) list.push("Plain radiographs of symptomatic sites (look for Looser zones)");
    list.push("DEXA (baseline BMD)");
    return list;
  }, [vitD, ca, phos, alp, pth, egfr, mg, xrayFindings, assessment]);

  const buildReport = () => {
    const L = [
      "OSTEOMALACIA WORKUP & TREATMENT",
      "================================",
      `Age: ${age || "—"}   Sex: ${sex || "—"}`,
      "",
      "Symptoms: " + (symptoms.join(", ") || "none"),
      "Risk factors: " + (risks.map((r) => RISK_FACTORS.find((x) => x.id === r)?.label).join(", ") || "none"),
      "Red flags: " + (redFlags.join(", ") || "none"),
      "",
      "LABS",
      `  Calcium: ${ca || "—"} ${caUnit}`,
      `  Phosphate: ${phos || "—"}`,
      `  ALP: ${alp || "—"} (upper ref ${alpUpper})  ${assessment.alpElevated ? "[ELEVATED]" : ""}`,
      `  25-OH vitamin D: ${vitD || "—"} ${vitDUnit}  (${assessment.vitDStatus})`,
      `  PTH: ${pth || "—"}   eGFR: ${egfr || "—"}   Mg: ${mg || "—"}`,
      "",
      "IMAGING",
      "  X-ray: " + (xrayFindings.join(", ") || "not done / no findings entered"),
      "",
      `ASSESSMENT: Osteomalacia — ${assessment.likelihood.toUpperCase()}`,
      "Etiology cluster: " + assessment.etiologies.map((e) => e.label).join("; "),
      "",
      "SUGGESTED WORKUP",
      ...workupSuggestions.map((w) => `  • ${w}`),
      "",
      "PLAN",
      ...plan.map((p) => `  • ${p.title}: ${p.body}`),
      "",
      "Disclaimer: Illustrative CDS — verify against local guidelines.",
    ];
    return L.join("\n");
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(buildReport());
    toast.success("Report copied");
  };
  const downloadTxt = () => {
    const blob = new Blob([buildReport()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "osteomalacia-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const lines = doc.splitTextToSize(buildReport(), 515);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(lines, 40, 50);
    doc.save("osteomalacia-report.pdf");
  };

  const likelihoodTone = assessment.likelihood === "likely" ? "danger" : assessment.likelihood === "possible" ? "warning" : assessment.likelihood === "unlikely" ? "success" : "info";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="Clinical intake" icon={<Stethoscope className="h-5 w-5" />}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Age (y)</Label>
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <Label>Sex</Label>
            <select className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm" value={sex} onChange={(e) => setSex(e.target.value as typeof sex)}>
              <option value="">—</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <div className="mb-1 mt-3 text-xs font-semibold uppercase text-muted-foreground">Symptoms</div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {SYMPTOMS.map((s) => (
              <label key={s} className="flex items-start gap-2 text-sm">
                <Checkbox checked={symptoms.includes(s)} onCheckedChange={() => toggle(symptoms, setSymptoms, s)} />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 mt-3 text-xs font-semibold uppercase text-muted-foreground">Risk factors</div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {RISK_FACTORS.map((r) => (
              <label key={r.id} className="flex items-start gap-2 text-sm">
                <Checkbox checked={risks.includes(r.id)} onCheckedChange={() => toggle(risks, setRisks, r.id)} />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 mt-3 text-xs font-semibold uppercase text-muted-foreground">Red flags</div>
          <div className="grid grid-cols-1 gap-1.5">
            {RED_FLAGS.map((r) => (
              <label key={r} className="flex items-start gap-2 text-sm">
                <Checkbox checked={redFlags.includes(r)} onCheckedChange={() => toggle(redFlags, setRedFlags, r)} />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Laboratory & imaging" icon={<FlaskConical className="h-5 w-5" />}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Calcium</Label>
            <div className="flex gap-1">
              <Input type="number" value={ca} onChange={(e) => setCa(e.target.value)} />
              <select className="h-9 rounded-md border border-border bg-background px-1 text-xs" value={caUnit} onChange={(e) => setCaUnit(e.target.value as UnitCa)}>
                <option>mg/dL</option>
                <option>mmol/L</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Phosphate</Label>
            <Input type="number" value={phos} onChange={(e) => setPhos(e.target.value)} />
          </div>
          <div>
            <Label>ALP</Label>
            <Input type="number" value={alp} onChange={(e) => setAlp(e.target.value)} />
          </div>
          <div>
            <Label>ALP upper limit</Label>
            <Input type="number" value={alpUpper} onChange={(e) => setAlpUpper(e.target.value)} />
          </div>
          <div>
            <Label>25-OH vitamin D</Label>
            <div className="flex gap-1">
              <Input type="number" value={vitD} onChange={(e) => setVitD(e.target.value)} />
              <select className="h-9 rounded-md border border-border bg-background px-1 text-xs" value={vitDUnit} onChange={(e) => setVitDUnit(e.target.value as Unit25OH)}>
                <option>ng/mL</option>
                <option>nmol/L</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Intact PTH</Label>
            <Input type="number" value={pth} onChange={(e) => setPth(e.target.value)} />
          </div>
          <div>
            <Label>eGFR</Label>
            <Input type="number" value={egfr} onChange={(e) => setEgfr(e.target.value)} />
          </div>
          <div>
            <Label>Magnesium (mg/dL)</Label>
            <Input type="number" value={mg} onChange={(e) => setMg(e.target.value)} />
          </div>
        </div>
        <div className="mt-2">
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">X-ray findings</div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {XRAY_FINDINGS.map((f) => (
              <label key={f} className="flex items-start gap-2 text-sm">
                <Checkbox checked={xrayFindings.includes(f)} onCheckedChange={() => toggle(xrayFindings, setXrayFindings, f)} />
                <span>{f}</span>
              </label>
            ))}
          </div>
        </div>
        <Callout tone="info" title="Unit note">
          25-OH D converted internally to nmol/L (×2.5 from ng/mL). Thresholds: &lt;25 severe, 25–49 moderate, 50–74 insufficient, ≥75 sufficient.
        </Callout>
      </SectionCard>

      <SectionCard title="Assessment" icon={<Activity className="h-5 w-5" />} tone={likelihoodTone === "danger" ? "danger" : likelihoodTone === "warning" ? "warning" : likelihoodTone === "success" ? "success" : "info"}>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Osteomalacia likelihood" value={<Pill tone={likelihoodTone as "danger" | "warning" | "success" | "info"}>{assessment.likelihood}</Pill>} />
          <Stat label="25-OH D status" value={assessment.vitDStatus} hint={isNaN(assessment.vitD_nmol) ? "—" : `${assessment.vitD_nmol.toFixed(0)} nmol/L`} />
        </div>
        <div>
          <div className="mb-1 mt-2 text-xs font-semibold uppercase text-muted-foreground">Etiology cluster</div>
          <div className="flex flex-wrap gap-1.5">
            {assessment.etiologies.map((e) => (
              <Pill key={e.id} tone="primary">{e.label}</Pill>
            ))}
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <KeyRow k="ALP elevated" v={assessment.alpElevated ? "Yes" : "No"} />
          <KeyRow k="Phosphate low" v={assessment.phosLow ? "Yes" : "No"} />
          <KeyRow k="CKD context" v={assessment.ckd ? "Yes" : "No"} />
          <KeyRow k="Malabsorption context" v={assessment.hasMalabs ? "Yes" : "No"} />
        </div>
        <div>
          <div className="mb-1 mt-3 text-xs font-semibold uppercase text-muted-foreground">Suggested workup to complete</div>
          <ul className="ml-4 list-disc space-y-0.5">
            {workupSuggestions.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      </SectionCard>

      <SectionCard title="Plan & export" icon={<Bone className="h-5 w-5" />}>
        {redFlags.length > 0 && (
          <Callout tone="danger" title="Red flags present">
            <span className="inline-flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Escalate — see plan below.</span>
          </Callout>
        )}
        <div className="space-y-2">
          {plan.length === 0 ? (
            <div className="text-sm text-muted-foreground">Enter clinical data to generate plan.</div>
          ) : (
            plan.map((p, i) => (
              <Callout key={i} tone={p.tone ?? "info"} title={p.title}>{p.body}</Callout>
            ))
          )}
        </div>
        <Callout tone="warning" title="Disclaimer">
          Illustrative decision support. Cross-check dosing against local formulary and specialist guidance (CKD-MBD, FGF23 disorders, pregnancy).
        </Callout>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={copyReport}><ClipboardCopy className="mr-1 h-4 w-4" /> Copy</Button>
          <Button size="sm" variant="outline" onClick={downloadTxt}><FileText className="mr-1 h-4 w-4" /> .txt</Button>
          <Button size="sm" onClick={downloadPdf}><Download className="mr-1 h-4 w-4" /> PDF</Button>
        </div>
      </SectionCard>
    </div>
  );
}
