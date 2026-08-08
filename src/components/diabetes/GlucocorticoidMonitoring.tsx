import { useMemo, useState } from "react";
import { Activity, ClipboardCheck, ShieldAlert, Syringe, Stethoscope, Printer, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SectionCard, KeyRow, Pill as Chip, Callout } from "./shared";

const BASELINE = [
  "Indication, disease activity, duration and cumulative exposure documented",
  "Weight / BMI",
  "Blood pressure / edema",
  "Cushingoid features / skin fragility / bruising",
  "Proximal muscle strength",
  "Fasting glucose and/or HbA1c",
  "Lipid profile / cardiovascular risk",
  "Fragility fracture / falls risk",
  "Menopause / hypogonadism / smoking / alcohol / low BMI",
  "Eye history and examination if indicated",
  "Mood / sleep / psychiatric history",
  "Infection risk and immunization review",
  "TB risk assessment where clinically relevant",
  "GI risk: NSAID / ulcer / anticoagulant / antiplatelet use",
];

const FOLLOWUP = [
  "Reassess indication and steroid-sparing options",
  "Dose, adherence and taper progress",
  "Weight / BMI / BP / edema",
  "Infection / fever / poor wound healing",
  "Bruising / acne / striae / skin tears",
  "Hyperglycemic symptoms / home glucose where relevant",
  "Mood / anxiety / insomnia / agitation / depression / psychosis",
  "Proximal weakness / falls",
  "Back pain / height loss / fracture symptoms",
  "Hip or groin pain suggesting osteonecrosis",
  "Withdrawal or adrenal-insufficiency symptoms during taper",
];

const TB_CHECKS = [
  "TB symptoms and exposure history reviewed",
  "IGRA or TST considered/performed",
  "Chest radiograph if indicated",
  "Active TB excluded before LTBI monotherapy",
  "Planned biologic/additional immunosuppression reviewed",
];

const VAX = [
  "Influenza",
  "COVID-19",
  "Pneumococcal",
  "Recombinant zoster where eligible",
  "Hepatitis B when indicated",
  "Tdap/Td",
  "HPV when age/risk appropriate",
  "Routine childhood/adolescent vaccines",
];

const ADRENAL = [
  "Patient received taper/steroid safety instructions",
  "Sick-day/stress-dose advice provided where appropriate",
  "Medical alert / steroid card considered",
  "Adrenal insufficiency symptoms discussed",
];

const LAB_ROWS: Array<[string, string]> = [
  ["Glucose / HbA1c", "Baseline and after initiation/dose escalation; more frequent if diabetes or high risk."],
  ["Lipids", "Baseline and periodically, often every 6–12 months during ongoing therapy."],
  ["Electrolytes", "As clinically indicated, especially with high dose, edema, hypertension, renal disease or interacting drugs."],
  ["CBC / renal / liver tests", "Driven mainly by underlying disease, comorbidity and concomitant immunosuppressants."],
  ["Adrenal testing", "Consider during taper toward physiologic doses or when adrenal insufficiency is suspected, rather than routinely at clearly supraphysiologic doses."],
  ["Bone health", "Assess fracture risk for adults expected to receive ≈≥5 mg/day prednisolone-equivalent for >3 months. Consider DXA according to risk."],
  ["DXA follow-up", "Higher-risk patients may be reassessed around 12 months; subsequent interval depends on BMD trend and ongoing risk."],
];

function ageBand(age: number) {
  if (age < 2)
    return { group: "Infant / young child", priorities: "Weight, length/height, head growth where appropriate, BP, glucose, electrolytes, Cushingoid features, infection and developmental progress." };
  if (age < 13)
    return { group: "School-age child", priorities: "Height velocity every 3–6 months, weight/BMI, puberty, BP, glucose, bone health, cataract/glaucoma, infection, mood/sleep and behavioural or school change." };
  if (age < 18)
    return { group: "Adolescent", priorities: "Final-height and pubertal development, weight/BMI, BP, glucose, bone health, eyes, infection, mental health, sleep and adherence." };
  if (age < 65)
    return { group: "Adult", priorities: "Metabolic risk, BP, glucose/HbA1c, lipids, fracture risk/BMD, eye disease, mood/sleep, infection, myopathy and adrenal suppression." };
  return { group: "Older adult", priorities: "Falls, frailty, sarcopenia, vertebral/hip fracture, diabetes, infection, delirium/depression, cataract/glaucoma, orthostatic hypotension and adrenal insufficiency." };
}

function CheckList({
  items,
  checked,
  onToggle,
}: {
  items: string[];
  checked: Record<string, boolean>;
  onToggle: (item: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <label
          key={item}
          className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/30 p-2 text-xs"
        >
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
            checked={!!checked[item]}
            onChange={() => onToggle(item)}
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function GlucocorticoidMonitoring() {
  const [age, setAge] = useState("50");
  const [steroid, setSteroid] = useState("Prednisolone");
  const [dose, setDose] = useState("10");
  const [duration, setDuration] = useState("6");
  const [indication, setIndication] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (item: string) => setChecked((c) => ({ ...c, [item]: !c[item] }));

  const a = parseFloat(age) || 0;
  const d = parseFloat(dose) || 0;
  const m = parseFloat(duration) || 0;

  const band = useMemo(() => ageBand(a), [a]);
  const tbPrompt = d >= 10 && m >= 1;
  const liveVaxCaution = d >= 20 && m >= 0.5;

  const recs = useMemo(() => {
    const r: string[] = [];
    if (d >= 5 && m >= 3) r.push("Assess glucocorticoid-induced osteoporosis/fracture risk and consider DXA.");
    if (tbPrompt) r.push("Perform TB risk assessment, especially with endemic exposure or planned additional immunosuppression.");
    if (liveVaxCaution) r.push("Review live-vaccine contraindication/caution and infection risk.");
    if (a < 18) r.push("Plot growth and assess height velocity; review puberty/development.");
    if (a >= 65) r.push("Prioritize falls, frailty, fracture, infection, diabetes and orthostatic risk.");
    if (!r.length) r.push("Continue individualized monitoring based on dose, duration, comorbidities and indication.");
    return r;
  }, [a, d, m, tbPrompt, liveVaxCaution]);

  const summaryText = () =>
    [
      "Systemic glucocorticoid monitoring",
      `Age ${a} y · ${steroid} · ${d} mg/day prednisolone-equivalent · ${m} month(s)`,
      indication ? `Indication: ${indication}` : "",
      `Age band: ${band.group} — ${band.priorities}`,
      "",
      "Recommendations:",
      ...recs.map((r) => `• ${r}`),
    ]
      .filter(Boolean)
      .join("\n");

  return (
    <div className="space-y-4">
      <SectionCard
        id="gc-monitor-profile"
        title="Systemic glucocorticoid monitoring"
        subtitle="Risk-based monitoring by dose, duration and age"
        icon={<Activity className="h-5 w-5" />}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="text-xs">Age (years)</Label>
            <Input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Steroid</Label>
            <select
              value={steroid}
              onChange={(e) => setSteroid(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {["Prednisolone", "Prednisone", "Dexamethasone", "Methylprednisolone", "Hydrocortisone", "Other systemic glucocorticoid"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Daily dose (mg pred-equivalent)</Label>
            <Input type="number" min="0" step="0.5" value={dose} onChange={(e) => setDose(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Duration (months)</Label>
            <Input type="number" min="0" step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Indication</Label>
            <Input placeholder="e.g. GCA, vasculitis, asthma" value={indication} onChange={(e) => setIndication(e.target.value)} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {d >= 20 ? (
            <Chip tone="danger">High-dose trigger ≥20 mg/day</Chip>
          ) : d >= 10 ? (
            <Chip tone="warning">Moderate-dose TB risk review</Chip>
          ) : null}
          {m >= 3 && <Chip tone="warning">Long-term exposure ≥3 months</Chip>}
          {d >= 5 && m >= 3 && <Chip tone="warning">Fracture-risk assessment</Chip>}
          {a >= 65 && <Chip>Older-adult intensive monitoring</Chip>}
          {a < 18 && <Chip>Growth/development priority</Chip>}
        </div>

        <Callout tone="info" title={`Age-specific priorities · ${band.group}`}>
          {band.priorities}
        </Callout>
      </SectionCard>

      <SectionCard
        id="gc-monitor-baseline"
        title="Baseline assessment"
        subtitle="Complete before or at initiation"
        icon={<ClipboardCheck className="h-5 w-5" />}
        defaultOpen={false}
      >
        <CheckList items={BASELINE} checked={checked} onToggle={toggle} />
      </SectionCard>

      <SectionCard
        id="gc-monitor-followup"
        title="Follow-up: every 1–3 months"
        icon={<Stethoscope className="h-5 w-5" />}
        defaultOpen={false}
      >
        <CheckList items={FOLLOWUP} checked={checked} onToggle={toggle} />
      </SectionCard>

      <SectionCard
        id="gc-monitor-labs"
        title="Laboratory & bone monitoring"
        icon={<Activity className="h-5 w-5" />}
        defaultOpen={false}
      >
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Domain</th>
                <th className="p-2">Suggested approach</th>
              </tr>
            </thead>
            <tbody>
              {LAB_ROWS.map(([k, v]) => (
                <tr key={k} className="border-t border-border">
                  <td className="p-2 font-medium">{k}</td>
                  <td className="p-2 text-muted-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        id="gc-monitor-tb"
        title="TB screening & immunosuppression"
        icon={<ShieldAlert className="h-5 w-5" />}
        defaultOpen={false}
      >
        {tbPrompt ? (
          <Callout tone="warning" title="TB screening prompt">
            This dose/duration combination warrants a TB risk assessment, particularly in an endemic setting or before
            additional immunosuppression. Consider IGRA/TST and further evaluation according to risk.
          </Callout>
        ) : (
          <Callout tone="info" title="TB">
            Use exposure, epidemiology, symptoms and planned immunosuppression to determine whether screening is needed.
            Routine serial testing is not required for every low-risk patient.
          </Callout>
        )}
        <div className="mt-3">
          <CheckList items={TB_CHECKS} checked={checked} onToggle={toggle} />
        </div>
        <div className="mt-3">
          <KeyRow k="LTBI regimens" v="3HP, 4R, 3HR commonly; 6H/9H alternatives — choose by interactions, liver function, pregnancy, HIV therapy and local guidance." />
        </div>
        <Callout tone="danger" title="Safety rule">
          Do not label a patient as LTBI or give LTBI monotherapy until active TB has been excluded.
        </Callout>
      </SectionCard>

      <SectionCard
        id="gc-monitor-vax"
        title="Vaccination review"
        icon={<Syringe className="h-5 w-5" />}
        defaultOpen={false}
      >
        {liveVaxCaution ? (
          <Callout tone="danger" title="Live-vaccine caution">
            Prednisone-equivalent ≥20 mg/day for ≥14 days is a common threshold for avoiding live-attenuated vaccines. Use
            current vaccine-specific and local guidance.
          </Callout>
        ) : (
          <Callout tone="info" title="Inactivated / recombinant vaccines">
            Generally given during steroid therapy, although immune response may be reduced. Update vaccines before
            high-dose therapy when feasible.
          </Callout>
        )}
        <div className="mt-3">
          <CheckList items={VAX} checked={checked} onToggle={toggle} />
        </div>
      </SectionCard>

      <SectionCard
        id="gc-monitor-adrenal"
        title="Adrenal & emergency safety"
        icon={<ShieldAlert className="h-5 w-5" />}
        defaultOpen={false}
      >
        <Callout tone="danger" title="Do not abruptly stop chronic systemic glucocorticoids">
          Patients at risk of HPA-axis suppression may need stress-dose glucocorticoids during significant illness,
          surgery, trauma or prolonged vomiting.
        </Callout>
        <div className="mt-3">
          <CheckList items={ADRENAL} checked={checked} onToggle={toggle} />
        </div>
        <Callout tone="warning" title="Urgent red flags">
          Collapse, severe hypotension, confusion, persistent vomiting, inability to retain oral steroid, hypoglycemia or
          profound weakness.
        </Callout>
      </SectionCard>

      <SectionCard id="gc-monitor-summary" title="Clinical summary" icon={<ClipboardCheck className="h-5 w-5" />}>
        <ul className="ml-4 list-disc space-y-1 text-sm">
          {recs.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(summaryText());
              toast.success("Summary copied");
            }}
          >
            <Copy className="mr-1 h-3.5 w-3.5" /> Copy
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 h-3.5 w-3.5" /> Print / Save PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setChecked({}); toast.success("Checkboxes cleared"); }}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Clear checkboxes
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Clinical decision-support only. Thresholds are practical triggers and should be interpreted with the underlying
          disease, steroid formulation, cumulative exposure, comorbidities, concomitant immunosuppressants, local TB
          guidance and current immunization guidance.
        </p>
      </SectionCard>
    </div>
  );
}

export default GlucocorticoidMonitoring;
