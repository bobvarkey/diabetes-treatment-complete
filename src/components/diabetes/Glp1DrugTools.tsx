import { useMemo, useState } from "react";
import { Copy, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Callout, KeyRow, Pill } from "./shared";

/* ---------------- Drug library ---------------- */

type Step = { dose: string; weeks: number; note?: string };
type Drug = {
  key: string;
  name: string;
  klass: string;
  route: "Subcutaneous weekly" | "Subcutaneous daily" | "Oral daily";
  steps: Step[];
  maintenance: string;
  sites: string[];
  effects: string[];
};

export const GLP1_DRUGS: Drug[] = [
  {
    key: "semaglutide-sc",
    name: "Semaglutide (weekly injection)",
    klass: "GLP-1 receptor agonist",
    route: "Subcutaneous weekly",
    steps: [
      { dose: "0.25 mg once weekly", weeks: 4, note: "Tolerability step — not a therapeutic dose" },
      { dose: "0.5 mg once weekly", weeks: 4 },
      { dose: "1 mg once weekly", weeks: 4 },
      { dose: "1.7 mg once weekly", weeks: 4, note: "Weight-management titration" },
      { dose: "2.4 mg once weekly", weeks: 4, note: "Weight-management maintenance" },
    ],
    maintenance: "1–2 mg weekly (diabetes) or 2.4 mg weekly (weight management)",
    sites: ["Abdomen (≥5 cm from umbilicus)", "Front of thigh", "Upper outer arm"],
    effects: [
      "Nausea, vomiting, diarrhoea, constipation — usually early and dose-related",
      "Reduced appetite, early satiety, reflux",
      "Gallstones / cholecystitis with rapid weight loss",
      "Pancreatitis (rare) — stop for severe persistent abdominal pain",
      "Hypoglycaemia when combined with insulin or a sulfonylurea",
      "Injection-site reactions; transient heart-rate rise",
    ],
  },
  {
    key: "tirzepatide",
    name: "Tirzepatide (weekly injection)",
    klass: "Dual GIP / GLP-1 receptor agonist",
    route: "Subcutaneous weekly",
    steps: [
      { dose: "2.5 mg once weekly", weeks: 4, note: "Starting dose — not therapeutic" },
      { dose: "5 mg once weekly", weeks: 4 },
      { dose: "7.5 mg once weekly", weeks: 4 },
      { dose: "10 mg once weekly", weeks: 4 },
      { dose: "12.5 mg once weekly", weeks: 4 },
      { dose: "15 mg once weekly", weeks: 4, note: "Maximum dose" },
    ],
    maintenance: "5, 10 or 15 mg weekly — lowest dose meeting the treatment goal",
    sites: ["Abdomen", "Front of thigh", "Upper outer arm"],
    effects: [
      "Nausea, vomiting, diarrhoea, constipation, dyspepsia",
      "Reduced appetite; dehydration if vomiting persists",
      "Gallbladder disease; pancreatitis (rare)",
      "Hypoglycaemia with insulin or sulfonylurea",
      "Injection-site reactions, fatigue, hair thinning with rapid loss",
    ],
  },
  {
    key: "liraglutide",
    name: "Liraglutide (daily injection)",
    klass: "GLP-1 receptor agonist",
    route: "Subcutaneous daily",
    steps: [
      { dose: "0.6 mg once daily", weeks: 1 },
      { dose: "1.2 mg once daily", weeks: 1 },
      { dose: "1.8 mg once daily", weeks: 1, note: "Usual diabetes maintenance" },
      { dose: "2.4 mg once daily", weeks: 1 },
      { dose: "3.0 mg once daily", weeks: 1, note: "Weight-management maintenance" },
    ],
    maintenance: "1.8 mg daily (diabetes) or 3.0 mg daily (weight management)",
    sites: ["Abdomen", "Front of thigh", "Upper outer arm"],
    effects: [
      "Nausea and vomiting — often settles in 2–4 weeks",
      "Diarrhoea or constipation, headache",
      "Gallstones, pancreatitis (rare)",
      "Hypoglycaemia with insulin or sulfonylurea",
    ],
  },
  {
    key: "dulaglutide",
    name: "Dulaglutide (weekly injection)",
    klass: "GLP-1 receptor agonist",
    route: "Subcutaneous weekly",
    steps: [
      { dose: "0.75 mg once weekly", weeks: 4 },
      { dose: "1.5 mg once weekly", weeks: 4 },
      { dose: "3 mg once weekly", weeks: 4 },
      { dose: "4.5 mg once weekly", weeks: 4, note: "Maximum dose" },
    ],
    maintenance: "1.5–4.5 mg weekly",
    sites: ["Abdomen", "Front of thigh", "Upper outer arm (carer-administered)"],
    effects: [
      "Nausea, diarrhoea, vomiting, abdominal pain",
      "Reduced appetite, dyspepsia",
      "Pancreatitis (rare); gallbladder disease",
      "Hypoglycaemia with insulin or sulfonylurea",
    ],
  },
  {
    key: "semaglutide-oral",
    name: "Semaglutide (oral tablet)",
    klass: "GLP-1 receptor agonist",
    route: "Oral daily",
    steps: [
      { dose: "3 mg once daily", weeks: 4, note: "Tolerability step only" },
      { dose: "7 mg once daily", weeks: 4 },
      { dose: "14 mg once daily", weeks: 4 },
    ],
    maintenance: "7–14 mg once daily",
    sites: ["Not injected — take on waking, with ≤120 mL plain water, then no food, drink or other tablets for 30 minutes"],
    effects: [
      "Nausea, vomiting, diarrhoea, abdominal pain",
      "Reduced absorption if dosing rules are not followed",
      "Gallstones, pancreatitis (rare)",
      "Hypoglycaemia with insulin or sulfonylurea",
    ],
  },
];

const SITE_ROTATION = [
  "Week 1 — left abdomen",
  "Week 2 — right abdomen",
  "Week 3 — left thigh",
  "Week 4 — right thigh",
  "Week 5 — left upper arm",
  "Week 6 — right upper arm",
];

function addDays(d: Date, n: number) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}
function fmt(d: Date) {
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

/* ---------------- Drug schedule ---------------- */

export function Glp1DrugSchedule() {
  const [drugKey, setDrugKey] = useState(GLP1_DRUGS[0].key);
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [stepWeeks, setStepWeeks] = useState("4");
  const [target, setTarget] = useState("max");

  const drug = GLP1_DRUGS.find((d) => d.key === drugKey)!;
  const daily = drug.route !== "Subcutaneous weekly";

  const rows = useMemo(() => {
    const base = new Date(`${start}T00:00:00`);
    if (Number.isNaN(base.getTime())) return [];
    const perStep = daily ? Math.max(1, parseInt(stepWeeks || "1", 10) || 1) : Math.max(1, parseInt(stepWeeks || "4", 10) || 4);
    const limit = target === "max" ? drug.steps.length : Math.min(drug.steps.length, parseInt(target, 10));
    let cursor = base;
    return drug.steps.slice(0, limit).map((s, i) => {
      const from = cursor;
      const weeks = daily ? s.weeks : perStep;
      const to = addDays(from, weeks * 7 - 1);
      cursor = addDays(to, 1);
      const doseDays = daily
        ? "Every day"
        : `${from.toLocaleDateString(undefined, { weekday: "long" })}s`;
      return {
        idx: i + 1,
        dose: s.dose,
        note: s.note,
        from,
        to,
        weeks,
        doseDays,
        site: drug.route === "Oral daily" ? drug.sites[0] : SITE_ROTATION[i % SITE_ROTATION.length],
      };
    });
  }, [drug, start, stepWeeks, target, daily]);

  const text = useMemo(
    () =>
      [
        `${drug.name} — ${drug.klass}`,
        `Route: ${drug.route}`,
        "",
        ...rows.map(
          (r) =>
            `Step ${r.idx}: ${r.dose} — ${fmt(r.from)} to ${fmt(r.to)} (${r.weeks} week${r.weeks > 1 ? "s" : ""}), ${r.doseDays}. Site: ${r.site}${r.note ? ` [${r.note}]` : ""}`,
        ),
        "",
        `Maintenance: ${drug.maintenance}`,
        "",
        "Side effects to warn about:",
        ...drug.effects.map((e) => `- ${e}`),
      ].join("\n"),
    [drug, rows],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm">Medicine</Label>
          <Select value={drugKey} onValueChange={setDrugKey}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GLP1_DRUGS.map((d) => <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Start date</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Weeks at each step</Label>
          <Select value={stepWeeks} onValueChange={setStepWeeks}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["1", "2", "4", "6", "8"].map((w) => <SelectItem key={w} value={w}>{w} week{w === "1" ? "" : "s"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Titrate up to</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="max">Maximum licensed dose</SelectItem>
              {drug.steps.map((s, i) => <SelectItem key={s.dose} value={String(i + 1)}>{s.dose}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Step</th>
              <th className="px-3 py-2">Dose</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">{drug.route === "Oral daily" ? "How to take" : "Injection site"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.idx} className="border-t border-border align-top">
                <td className="px-3 py-2">{r.idx}</td>
                <td className="px-3 py-2 font-medium">
                  {r.dose}
                  {r.note && <div className="text-xs font-normal text-muted-foreground">{r.note}</div>}
                </td>
                <td className="px-3 py-2">{fmt(r.from)} → {fmt(r.to)}</td>
                <td className="px-3 py-2">{r.doseDays}</td>
                <td className="px-3 py-2">{r.site}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1">
        <KeyRow k="Class" v={drug.klass} />
        <KeyRow k="Route" v={drug.route} />
        <KeyRow k="Maintenance" v={drug.maintenance} />
        <KeyRow k="Sites to rotate" v={drug.sites.join(" · ")} />
      </div>

      <Callout tone="warning" title="Side effects to counsel on">
        <ul className="ml-4 list-disc space-y-1">
          {drug.effects.map((e) => <li key={e}>{e}</li>)}
        </ul>
      </Callout>

      <Callout tone="info" title="Missed dose">
        Weekly agents: give as soon as remembered if the next dose is more than 48 hours away, otherwise skip. If more
        than 2 consecutive weekly doses are missed, restart at a lower step and re-titrate.
      </Callout>

      <div className="flex flex-wrap gap-2 no-print">
        <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(text)}>
          <Copy className="mr-1.5 h-4 w-4" aria-hidden /> Copy schedule
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" aria-hidden /> Print
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Dose calculator ---------------- */

const SAFETY = [
  {
    key: "pancreatitis-active",
    label: "Active pancreatitis or unexplained severe persistent upper abdominal pain",
    tone: "danger" as const,
    advice:
      "Do not start while pancreatitis is suspected or active. Investigate (lipase/amylase, imaging) and treat first.",
  },
  {
    key: "pancreas-risk",
    label: "History of pancreatitis, gallstones/gallbladder disease, severe hypertriglyceridaemia, or substantial alcohol intake",
    tone: "warning" as const,
    advice:
      "Clarify aetiology and current activity, treat triglycerides and alcohol intake, and counsel on pancreatitis and gallbladder symptoms before starting. Titrate slowly.",
  },
  {
    key: "gi",
    label: "Significant nausea/vomiting, gastroparesis, bowel obstruction, severe reflux or other serious GI motility disorder",
    tone: "warning" as const,
    advice:
      "These medicines slow gastric emptying and may worsen symptoms. Consider an alternative agent, or start at the lowest dose with extended intervals and a dehydration safety plan.",
  },
  {
    key: "retinopathy",
    label: "Diabetic retinopathy — especially active/proliferative disease or recent eye treatment",
    tone: "warning" as const,
    advice:
      "Rapid HbA1c improvement can temporarily worsen retinopathy. Document retinal status and optic cup-to-disc ratio, arrange retinal follow-up at 3–6 months, and avoid unnecessarily rapid glycaemic correction.",
  },
  {
    key: "insulin-su",
    label: "On insulin or a sulfonylurea",
    tone: "warning" as const,
    advice:
      "Reduce the sulfonylurea or insulin dose at initiation and at each titration step, and set up glucose monitoring with hypoglycaemia advice.",
  },
  {
    key: "renal",
    label: "Renal impairment, diuretics or dehydration risk",
    tone: "warning" as const,
    advice: "Vomiting and poor intake can precipitate acute kidney injury — give sick-day rules and recheck renal function.",
  },
  {
    key: "surgery",
    label: "Planned surgery, anaesthesia or endoscopy",
    tone: "warning" as const,
    advice: "Delayed gastric emptying raises aspiration risk — agree a pre-procedure withholding plan with the anaesthetist.",
  },
  {
    key: "absolute",
    label: "Medullary thyroid carcinoma / MEN2, previous serious hypersensitivity, pregnancy, breastfeeding or trying to conceive",
    tone: "danger" as const,
    advice: "Do not start. Choose an alternative strategy and document the reason.",
  },
];

export function Glp1DoseCalculator() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [status, setStatus] = useState("Obesity without diabetes");
  const [tolerance, setTolerance] = useState("Average");
  const [flags, setFlags] = useState<string[]>([]);

  const toggle = (k: string) => setFlags((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0) return null;
    return Math.round((w / (h * h)) * 10) / 10;
  }, [height, weight]);

  const ageN = parseFloat(age);
  const blocked = flags.includes("absolute") || flags.includes("pancreatitis-active");
  const cautious = tolerance === "Sensitive" || flags.includes("gi") || (isFinite(ageN) && ageN >= 75);

  const recommended = useMemo(() => {
    if (bmi === null) return null;
    const diabetes = status.includes("diabetes");
    if (status === "Obesity without diabetes" || status === "Obesity with cardiovascular disease") {
      return bmi >= 35 ? GLP1_DRUGS[1] : GLP1_DRUGS[0];
    }
    if (diabetes) return bmi >= 30 ? GLP1_DRUGS[1] : GLP1_DRUGS[0];
    return GLP1_DRUGS[0];
  }, [bmi, status]);

  const targetWeight = useMemo(() => {
    const w = parseFloat(weight);
    if (!w) return null;
    return { five: Math.round(w * 0.95 * 10) / 10, fifteen: Math.round(w * 0.85 * 10) / 10 };
  }, [weight]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-sm">Weight (kg)</Label>
          <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 92" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Height (cm)</Label>
          <Input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 168" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Age (years)</Label>
          <Input inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 48" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Tolerance to GI upset</Label>
          <Select value={tolerance} onValueChange={setTolerance}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Average", "Sensitive"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-sm">Health status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[
                "Obesity without diabetes",
                "Obesity with cardiovascular disease",
                "Type 2 diabetes",
                "Type 2 diabetes with chronic kidney disease",
                "Prediabetes",
              ].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Safety checks</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {SAFETY.map((s) => (
            <label key={s.key} className="flex items-start gap-2 text-sm">
              <Checkbox checked={flags.includes(s.key)} onCheckedChange={() => toggle(s.key)} className="mt-0.5" />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {bmi !== null && (
        <div className="space-y-1">
          <KeyRow k="BMI" v={<span><b>{bmi}</b> kg/m²</span>} />
          {targetWeight && (
            <KeyRow k="Weight targets" v={`5% loss → ${targetWeight.five} kg · 15% loss → ${targetWeight.fifteen} kg`} />
          )}
        </div>
      )}

      {flags.map((k) => {
        const s = SAFETY.find((x) => x.key === k);
        if (!s) return null;
        return (
          <Callout key={k} tone={s.tone} title={s.label}>
            {s.advice}
          </Callout>
        );
      })}

      {blocked ? (
        <Callout tone="danger" title="Do not start now">
          A blocking safety flag is present. Resolve it, then re-run this calculator.
        </Callout>
      ) : bmi === null ? (
        <Callout tone="info" title="Enter weight and height">
          Add weight and height to see a suggested agent, titration steps and injection sites.
        </Callout>
      ) : recommended ? (
        <div className="rounded-md border border-border p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="success">Suggested starting agent</Pill>
            <span className="font-semibold">{recommended.name}</span>
          </div>
          <KeyRow k="Class" v={recommended.klass} />
          <KeyRow
            k="Titration"
            v={
              <span>
                {recommended.steps.map((s) => s.dose).join(" → ")}
                {cautious && " — hold each step for 6–8 weeks rather than 4 given sensitivity to GI effects"}
              </span>
            }
          />
          <KeyRow k="Maintenance" v={recommended.maintenance} />
          <KeyRow k="Injection sites" v={recommended.sites.join(" · ")} />
          <p className="text-sm text-muted-foreground">
            Rotate the site every dose, keep at least 5 cm from the umbilicus, avoid scarred or lipohypertrophic skin,
            and use a fresh needle each time. Review at 3 months: continue only if the agreed benefit (usually ≥5% weight
            loss or the HbA1c goal) is being met.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Pre-start checklist ---------------- */

const CHECKLIST: { group: string; items: string[] }[] = [
  {
    group: "Patient and indication",
    items: [
      "Approved indication and local eligibility confirmed",
      "Treatment goals documented: HbA1c / weight / cardiometabolic risk",
      "Baseline weight, BMI, BP and relevant waist measurement recorded",
    ],
  },
  {
    group: "Contraindications",
    items: [
      "No personal or family history of medullary thyroid carcinoma",
      "No MEN2",
      "No previous serious hypersensitivity to proposed medicine",
      "Not pregnant, breastfeeding, or actively trying to conceive",
      "No active/suspected pancreatitis",
    ],
  },
  {
    group: "Risk review",
    items: [
      "Previous pancreatitis, gallstones, alcohol excess, hypertriglyceridaemia reviewed",
      "Gastroparesis, severe GI disease, vomiting risk, bowel obstruction history reviewed",
      "Renal disease, dehydration risk and diuretics reviewed",
      "Retinopathy status checked if diabetes is present",
      "Planned anaesthesia/endoscopy or surgery documented",
      "Current insulin/sulfonylurea dose reviewed and adjustment plan made",
    ],
  },
  {
    group: "Baseline data",
    items: [
      "HbA1c or glucose status",
      "Creatinine/eGFR and electrolytes",
      "Liver tests if clinically indicated",
      "Lipids and cardiovascular-risk assessment as appropriate",
      "Pregnancy test if indicated",
      "Retinal screening status documented",
      "Optic cup-to-disc (CD) ratio",
    ],
  },
  {
    group: "Counselling and follow-up",
    items: [
      "Product-specific starting dose and titration schedule explained",
      "GI, dehydration, pancreatitis, gallbladder and hypoglycaemia safety-netting completed",
      "Nutrition, protein intake and exercise advice discussed",
      "Follow-up date and monitoring goals arranged",
    ],
  },
];

export function Glp1PreStartCheck() {
  const [done, setDone] = useState<string[]>([]);
  const total = CHECKLIST.reduce((n, g) => n + g.items.length, 0);
  const toggle = (k: string) => setDone((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const text = useMemo(
    () =>
      [
        "GLP-1 / GIP-GLP-1 PRE-START CHECK",
        "",
        ...CHECKLIST.flatMap((g) => [g.group, ...g.items.map((i) => `[${done.includes(i) ? "x" : " "}] ${i}`), ""]),
      ].join("\n"),
    [done],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={done.length === total ? "success" : "warning"}>
          {done.length} / {total} complete
        </Pill>
        <Button size="sm" variant="outline" className="no-print" onClick={() => navigator.clipboard?.writeText(text)}>
          <Copy className="mr-1.5 h-4 w-4" aria-hidden /> Copy checklist
        </Button>
        <Button size="sm" variant="ghost" className="no-print" onClick={() => setDone([])}>Reset</Button>
      </div>

      {CHECKLIST.map((g) => (
        <div key={g.group} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.group}</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.items.map((i) => (
              <label key={i} className="flex items-start gap-2 text-sm">
                <Checkbox checked={done.includes(i)} onCheckedChange={() => toggle(i)} className="mt-0.5" />
                <span>{i}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <Callout tone="info" title="Before signing off">
        Every unticked box is an open risk. Do not issue the first pen until the contraindication block is fully clear and
        the insulin/sulfonylurea adjustment plan is written down.
      </Callout>
    </div>
  );
}
