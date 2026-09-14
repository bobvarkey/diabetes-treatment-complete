import { Callout, KeyRow, Pill } from "./shared";

type Band = {
  band: string;
  tone: "success" | "warning" | "danger" | "info" | "primary";
  when: string;
  options: string[];
  schedule: string[];
  monitoring: string[];
};

const TREATMENT_BANDS: Band[] = [
  {
    band: "Low / moderate risk",
    tone: "success",
    when: "No confirmed fragility fracture, T-score better than −2.5, and below local treatment thresholds.",
    options: [
      "Usually no osteoporosis drug; optimise calcium, vitamin D, exercise, balance and fall prevention.",
      "If treatment is still chosen after clinical review: alendronate 70 mg weekly or risedronate 35 mg weekly.",
    ],
    schedule: [
      "Oral bisphosphonate once weekly on a fixed day, fasting with plain water; remain upright for 30 minutes.",
      "Reassess fracture risk after 3–5 years or sooner after fracture, steroid exposure or major clinical change.",
    ],
    monitoring: [
      "Calcium intake 1000–1200 mg/day and 25-OH vitamin D ≥ 30 ng/mL.",
      "DXA every 3–5 years if untreated; every 2 years if treatment is started.",
      "Annual fall-risk, medication, vision and adherence review.",
    ],
  },
  {
    band: "High risk",
    tone: "warning",
    when: "Confirmed hip/vertebral fragility fracture, T-score ≤ −2.5, or above the applicable FRAX threshold.",
    options: [
      "First-line oral: alendronate 70 mg weekly or risedronate 35 mg weekly / 150 mg monthly.",
      "IV: zoledronate 5 mg over at least 15 minutes once yearly when oral therapy is unsuitable.",
      "SC: denosumab 60 mg every 6 months when CrCl < 35 mL/min, adherence is difficult, or oral/IV bisphosphonate is unsuitable.",
    ],
    schedule: [
      "Zoledronate: day 0, then every 12 months for 3 years; extend to 6 years if risk remains high.",
      "Denosumab: day 0 and every 6 months; do not delay beyond 7 months without transition planning.",
      "Oral bisphosphonate: weekly for 5 years, then reassess for continuation or holiday.",
    ],
    monitoring: [
      "Before starting: corrected calcium, phosphate, creatinine/CrCl, 25-OH vitamin D and dental review.",
      "After zoledronate or denosumab: calcium and renal function, especially in CKD or vitamin D deficiency.",
      "DXA at 1–2 years; adherence review at 3 and 12 months; ask about thigh/groin pain and new dental symptoms.",
    ],
  },
  {
    band: "Very high risk",
    tone: "danger",
    when: "Recent vertebral fracture, ≥2 vertebral fractures, multiple fractures, very low BMD, high-dose steroids, or major FRAX ≥30% where local criteria apply.",
    options: [
      "Anabolic-first: romosozumab 210 mg monthly for 12 months, or teriparatide 20 µg daily / abaloparatide 80 µg daily for 18–24 months.",
      "Then immediate antiresorptive: denosumab 60 mg every 6 months or zoledronate 5 mg yearly.",
      "Specialist combination therapy with teriparatide plus denosumab may be considered for maximal rapid BMD gain.",
    ],
    schedule: [
      "Romosozumab: two 105 mg SC injections at separate sites each month for 12 months; start antiresorptive at month 12.",
      "Teriparatide/abaloparatide: daily SC injection for 18–24 months; start antiresorptive within 1 month of the final dose.",
      "Antiresorptive maintenance: denosumab every 6 months indefinitely or zoledronate yearly, with reassessment at 3 years.",
    ],
    monitoring: [
      "Screen romosozumab candidates for recent myocardial infarction or stroke; avoid after either event within 12 months.",
      "Check calcium, vitamin D, renal function and dental status before each phase; monitor calcium in CKD.",
      "DXA at 12 and 24 months; CTX/P1NP at 3–6 months if used locally; immediate imaging for new back, hip or groin pain.",
    ],
  },
];

const PREVENTION_BANDS: Band[] = [
  {
    band: "Low risk",
    tone: "success",
    when: "No fragility fracture and below local treatment thresholds.",
    options: [
      "Lifestyle plan only: calcium-rich diet, vitamin D sufficiency, weight-bearing and resistance exercise, balance training, smoking and alcohol reduction.",
      "Address steroid dose, diabetes-related hypoglycaemia, neuropathy, vision and other fall risks.",
    ],
    schedule: ["Repeat risk assessment in 3–5 years, or sooner after fracture, height loss, steroids or major illness."],
    monitoring: ["Vitamin D/calcium when deficient; falls and medication review annually in older adults."],
  },
  {
    band: "Moderate risk",
    tone: "primary",
    when: "Osteopenia or borderline FRAX without a confirmed fragility fracture.",
    options: [
      "Lifestyle plan plus correction of secondary causes; recalculate FRAX with femoral-neck BMD if needed.",
      "Consider alendronate or risedronate when local thresholds are crossed or risk is rising.",
    ],
    schedule: [
      "Oral bisphosphonate weekly if started; reassess at 2–3 years.",
      "Repeat DXA in 2–3 years or sooner with a new clinical risk factor.",
    ],
    monitoring: ["Adherence and GI tolerance at 3–12 months; calcium, vitamin D, renal function and fall risk yearly."],
  },
  {
    band: "High risk",
    tone: "warning",
    when: "Above treatment threshold before a major fracture, or strong clinical risk factors requiring preventive treatment.",
    options: [
      "Alendronate 70 mg weekly, risedronate 35 mg weekly/150 mg monthly, zoledronate 5 mg IV yearly, or denosumab 60 mg SC every 6 months.",
      "Use denosumab when renal function or adherence makes bisphosphonates less suitable.",
    ],
    schedule: [
      "Oral bisphosphonate weekly for 5 years; zoledronate yearly for 3 years; denosumab every 6 months without gaps.",
      "Reassess at the end of the planned course; do not stop denosumab without a bisphosphonate bridge.",
    ],
    monitoring: [
      "Baseline calcium, vitamin D, creatinine/CrCl and dental review; DXA at 1–2 years.",
      "Adherence at 3 and 12 months; review for fracture, height loss, thigh/groin pain and dental symptoms.",
    ],
  },
  {
    band: "Very high risk",
    tone: "danger",
    when: "Imminent fracture risk, severe steroid exposure, very low BMD or other specialist-level risk before a first/next fracture.",
    options: [
      "Specialist-led anabolic-first prevention: romosozumab for 12 months or teriparatide/abaloparatide for up to 24 months.",
      "Mandatory antiresorptive follow-on with denosumab or zoledronate to preserve gains.",
    ],
    schedule: [
      "Romosozumab monthly for 12 doses, then antiresorptive; teriparatide/abaloparatide daily for 18–24 months, then antiresorptive within 1 month.",
      "Maintain denosumab every 6 months or zoledronate yearly with scheduled recall.",
    ],
    monitoring: [
      "Specialist review, cardiovascular screen before romosozumab, calcium/vitamin D/renal checks, and dental review.",
      "DXA at 12 months and 24 months; urgent assessment for any interim fracture or new severe back pain.",
    ],
  },
];

function BandCard({ band }: { band: Band }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={band.tone}>{band.band}</Pill>
        <span className="text-xs text-muted-foreground">{band.when}</span>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Drug options</div>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {band.options.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dosing / injection schedule</div>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {band.schedule.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monitoring</div>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {band.monitoring.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}

function PlanReference({ prevention = false }: { prevention?: boolean }) {
  return (
    <div className="space-y-4">
      <Callout tone="warning" title="Universal plan before any drug">
        Correct calcium intake to 1000–1200 mg/day, target 25-OH vitamin D ≥30 ng/mL, assess CrCl, review dental health,
        reduce falls and treat secondary causes. Individual drug selection requires clinician review of renal function,
        pregnancy status, cardiovascular risk, oesophageal disease and prior therapy.
      </Callout>

      <div className="grid gap-3 lg:grid-cols-2">
        {(prevention ? PREVENTION_BANDS : TREATMENT_BANDS).map((band) => <BandCard key={band.band} band={band} />)}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="mb-2 text-sm font-semibold">Injection and infusion quick reference</div>
        <KeyRow k="Denosumab" v="60 mg SC every 6 months; recall before month 7; never stop without a bisphosphonate bridge." />
        <KeyRow k="Teriparatide" v="20 µg SC once daily for up to 24 months; antiresorptive follow-on within 1 month." />
        <KeyRow k="Abaloparatide" v="80 µg SC once daily for up to 24 months; antiresorptive follow-on within 1 month." />
        <KeyRow k="Romosozumab" v="210 mg monthly as two 105 mg SC injections for 12 months; antiresorptive at completion." />
        <KeyRow k="Zoledronate" v="5 mg IV over at least 15 minutes once yearly for 3 years; extend only after reassessment." />
      </div>

      <Callout tone="info" title={prevention ? "Prevention checkpoints" : "Post-fracture checkpoints"}>
        {prevention
          ? "Recheck risk after new steroid exposure, menopause-related change, diabetes complications, falls, height loss or any suspected vertebral fracture. Prevention fails when reassessment is missed."
          : "After a fragility fracture, treatment should not wait for FRAX. Confirm the fracture, treat pain, prevent falls, start appropriate osteoporosis therapy and schedule monitoring before discharge from the episode of care."}
      </Callout>
    </div>
  );
}

export function FractureTreatmentPlan() {
  return <PlanReference />;
}

export function FracturePreventionPlan() {
  return <PlanReference prevention />;
}
