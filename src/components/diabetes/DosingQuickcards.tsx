import { Callout, KeyRow, Pill } from "./shared";
import { useImageViewer } from "@/components/ImageViewer";
import bisphosphonateCriteriaImg from "@/assets/bisphosphonate-criteria.png.asset.json";

interface Card {
  drug: string;
  klass: string;
  tone: "primary" | "warning" | "danger" | "info" | "success";
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  before: string[];
  warnings: string[];
}

const CARDS: Card[] = [
  {
    drug: "Alendronate",
    klass: "Oral bisphosphonate",
    tone: "primary",
    dose: "70 mg (treatment) · 35 mg (prevention)",
    route: "Oral tablet — plain water only",
    frequency: "Once weekly, same day each week",
    duration: "5 years oral, then reassess for a drug holiday",
    before: [
      "CrCl ≥ 35 mL/min",
      "Correct hypocalcaemia and 25-OH-D < 20 ng/mL first",
      "Dental review if invasive dental work is planned",
    ],
    warnings: [
      "Take on waking, fasting, with 180–240 mL plain water; stay upright and nil by mouth for 30 minutes.",
      "Contraindicated in achalasia, oesophageal stricture, or inability to sit/stand upright 30 minutes.",
      "Oesophagitis/ulceration, musculoskeletal pain; rare osteonecrosis of the jaw and atypical femoral fracture.",
      "New thigh or groin pain on therapy — image for atypical femoral fracture.",
    ],
  },
  {
    drug: "Risedronate",
    klass: "Oral bisphosphonate",
    tone: "primary",
    dose: "35 mg weekly · or 150 mg monthly · or 5 mg daily",
    route: "Oral tablet (delayed-release 35 mg may be taken after breakfast)",
    frequency: "Weekly / monthly / daily depending on formulation",
    duration: "5 years, then reassess",
    before: ["CrCl ≥ 30 mL/min", "Calcium 1000–1200 mg/day + vitamin D"],
    warnings: [
      "Same 30-minute upright, fasting rule as alendronate for immediate-release tablets.",
      "Separate from calcium, antacids, iron and magnesium by at least 30–60 minutes.",
      "Acute-phase reaction is uncommon with oral agents but GI intolerance is the main reason for switching to IV.",
    ],
  },
  {
    drug: "Ibandronate",
    klass: "Oral / IV bisphosphonate",
    tone: "primary",
    dose: "150 mg oral · or 3 mg IV",
    route: "Oral tablet, or IV bolus over 15–30 seconds",
    frequency: "Oral monthly · IV every 3 months",
    duration: "3–5 years, then reassess",
    before: ["CrCl ≥ 30 mL/min", "Vitamin D repletion"],
    warnings: [
      "Oral: 60 minutes fasting and upright — longer than alendronate/risedronate.",
      "No proven hip-fracture reduction — prefer alendronate, risedronate or zoledronate when hip risk dominates.",
    ],
  },
  {
    drug: "Zoledronate (zoledronic acid)",
    klass: "IV bisphosphonate",
    tone: "primary",
    dose: "5 mg in 100 mL over ≥ 15 minutes",
    route: "Intravenous infusion",
    frequency: "Once yearly (every 18–24 months acceptable in some low-risk regimens)",
    duration: "3 years, then reassess; up to 6 years if high risk",
    before: [
      "CrCl ≥ 35 mL/min — absolute requirement",
      "Serum calcium and 25-OH-D corrected before infusion",
      "Pre-hydrate with 500 mL oral or IV fluid; dental review",
    ],
    warnings: [
      "Acute-phase reaction (fever, myalgia, headache) in up to 30% of first infusions — pre/post paracetamol.",
      "Hypocalcaemia risk, especially with vitamin D deficiency, CKD or malabsorption.",
      "Avoid in pregnancy; caution with concurrent nephrotoxics or dehydration.",
      "Rare osteonecrosis of the jaw and atypical femoral fracture.",
    ],
  },
  {
    drug: "Denosumab (Prolia)",
    klass: "RANKL monoclonal antibody",
    tone: "warning",
    dose: "60 mg",
    route: "Subcutaneous — upper arm, thigh or abdomen",
    frequency: "Every 6 months, ±4 weeks maximum drift",
    duration: "No fixed stop; long-term use with planned transition if stopped",
    before: [
      "Any CrCl — no renal dose adjustment, but hypocalcaemia risk rises sharply below CrCl 30 mL/min",
      "Correct calcium and vitamin D before every dose",
      "Dental review before starting",
    ],
    warnings: [
      "NEVER stop without a transition — rebound bone loss and multiple vertebral fractures occur 6–18 months after a missed dose.",
      "Transition: zoledronate 5 mg IV (or oral bisphosphonate) at 6–9 months after the last denosumab dose; recheck BTMs/DXA.",
      "Delays beyond 7 months from the last dose are the key safety failure — build in recall.",
      "Severe hypocalcaemia in advanced CKD/dialysis; osteonecrosis of the jaw and atypical femoral fracture with long use.",
    ],
  },
  {
    drug: "Teriparatide",
    klass: "Anabolic — PTH(1-34) analogue",
    tone: "success",
    dose: "20 µg",
    route: "Subcutaneous pen — thigh or abdomen; refrigerate",
    frequency: "Once daily",
    duration: "18–24 months lifetime (single course usual)",
    before: [
      "Baseline calcium, PTH, 25-OH-D, ALP; exclude primary hyperparathyroidism and Paget disease",
      "Exclude unexplained ALP elevation, prior skeletal radiotherapy, bone metastases, hypercalcaemia",
    ],
    warnings: [
      "MUST be followed by an antiresorptive (bisphosphonate or denosumab) immediately at completion — gains are lost within months otherwise.",
      "Transient hypercalcaemia, orthostatic hypotension with the first doses (take seated), nausea, leg cramps, headache.",
      "Avoid in severe renal impairment, active urolithiasis and pregnancy.",
      "Do not start before finishing an anabolic-first plan or while awaiting antiresorptive washout decisions.",
    ],
  },
  {
    drug: "Abaloparatide",
    klass: "Anabolic — PTHrP analogue",
    tone: "success",
    dose: "80 µg",
    route: "Subcutaneous — periumbilical abdomen",
    frequency: "Once daily",
    duration: "18–24 months lifetime",
    before: ["Same exclusions as teriparatide", "Vitamin D and calcium repletion"],
    warnings: [
      "Antiresorptive follow-on is mandatory at completion.",
      "Orthostatic hypotension, palpitations, hypercalciuria — inject seated/lying for the first doses.",
    ],
  },
  {
    drug: "Romosozumab (Evenity)",
    klass: "Anabolic/antiresorptive — sclerostin antibody",
    tone: "danger",
    dose: "210 mg total = two 105 mg SC injections at one sitting",
    route: "Subcutaneous — two separate injection sites, same visit",
    frequency: "Once monthly",
    duration: "12 months only (effect plateaus); follow with an antiresorptive",
    before: [
      "Screen cardiovascular history — MI or stroke within the previous 12 months is a contraindication",
      "Correct hypocalcaemia and vitamin D; monitor calcium in CKD",
      "Dental review",
    ],
    warnings: [
      "Boxed warning: increased risk of myocardial infarction, stroke and cardiovascular death — avoid in established high CV risk.",
      "Stop permanently if MI or stroke occurs during treatment.",
      "Injection-site reactions, arthralgia, headache; rare osteonecrosis of the jaw and atypical femoral fracture.",
      "Bone gains are lost without an antiresorptive follow-on at month 12.",
    ],
  },
];

function QuickCard({ c }: { c: Card }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold">{c.drug}</h4>
        <Pill tone={c.tone}>{c.klass}</Pill>
      </div>
      <div className="space-y-1 text-sm">
        <KeyRow k="Dose" v={c.dose} />
        <KeyRow k="Route" v={c.route} />
        <KeyRow k="Frequency" v={c.frequency} />
        <KeyRow k="Duration" v={c.duration} />
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before starting</div>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
          {c.before.map((b) => <li key={b}>{b}</li>)}
        </ul>
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key warnings</div>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
          {c.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      </div>
    </div>
  );
}

const DURATIONS = [
  {
    drug: "Bisphosphonates (alendronate, risedronate, zoledronate)",
    tone: "primary" as const,
    standard: "3–5 years of continuous therapy",
    maximum: "Up to 10 years oral · up to 6 years IV in patients at high fracture risk",
    stop: "Drug holiday of 1–2 years after 3–5 years for low-to-moderate risk — the drug stays bound in bone and continues to protect. Reassess DXA, BTMs and fracture events before restarting.",
  },
  {
    drug: "Denosumab (Prolia)",
    tone: "warning" as const,
    standard: "60 mg SC every 6 months, no set stop date — long-term/indefinite in high-risk patients",
    maximum: "Continuous safety evaluated in trials to 10 years",
    stop: "Never stop abruptly: rapid BMD loss and rebound vertebral fractures follow. If stopping is unavoidable, transition to a bisphosphonate (or alternative antiresorptive) on schedule.",
  },
  {
    drug: "Teriparatide (Forteo) / abaloparatide",
    tone: "success" as const,
    standard: "Maximum 24 months (2 years) in a lifetime",
    maximum: "Beyond 24 months only in rare patients who remain or return to extreme fracture risk",
    stop: "The 2-year cap comes from rodent osteosarcoma signals. Always follow the course immediately with a bisphosphonate or other antiresorptive to lock in the bone gain.",
  },
];

export default function DosingQuickcards() {
  const { open } = useImageViewer();
  return (
    <div className="space-y-4">
      <Callout tone="warning" title="Universal prerequisites">
        Every agent: correct 25-OH-vitamin D (target ≥ 30 ng/mL) and calcium intake 1000–1200 mg/day, check serum
        calcium and renal function, and complete a dental review before antiresorptives. Recheck adherence at 3 and 12
        months and DXA at 1–2 years.
      </Callout>

      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cheat sheet — exact clinical criteria for initiating bisphosphonates
        </div>
        <button
          type="button"
          onClick={() => open(bisphosphonateCriteriaImg.url, "Exact clinical criteria for initiating bisphosphonates")}
          className="block w-full rounded-lg border border-border bg-muted/30 p-2 text-left transition hover:border-primary/50"
        >
          <img
            src={bisphosphonateCriteriaImg.url}
            alt="Cheat sheet: exact clinical criteria for initiating bisphosphonates — primary osteoporosis, glucocorticoid-induced osteoporosis, oncology indications and mandatory prerequisites"
            className="w-full rounded-md"
            loading="lazy"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            Tap to zoom. ACP / BHOF / ACR thresholds: T ≤ –2.5, any hip or vertebral fragility fracture, or osteopenia
            with FRAX ≥ 3% hip / ≥ 20% major. Confirm CrCl &gt; 30–35 mL/min, normal corrected calcium and vitamin D,
            and oesophageal suitability before prescribing.
          </div>
        </button>
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cheat sheets — assessment &amp; treatment thresholds
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {EXTRA_SHEETS.map((s) => (
            <button
              key={s.url}
              type="button"
              onClick={() => open(s.url, s.title)}
              className="block w-full rounded-lg border border-border bg-muted/30 p-2 text-left transition hover:border-primary/50"
            >
              <img src={s.url} alt={s.alt} className="w-full rounded-md" loading="lazy" />
              <div className="mt-1 text-xs font-semibold">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.caption}</div>
            </button>
          ))}
        </div>
      </div>


      <div className="grid gap-3 lg:grid-cols-2">
        {CARDS.map((c) => <QuickCard key={c.drug} c={c} />)}
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Duration of therapy
        </div>
        <p className="mb-2 text-sm text-muted-foreground">
          Treatment duration differs by class because of how each drug affects bone remodelling and its long-term
          safety profile: bisphosphonates 3–10 years with possible drug holidays, denosumab long-term/indefinite every
          6 months, teriparatide a strict 24-month lifetime maximum.
        </p>
        <div className="space-y-3">
          {DURATIONS.map((d) => (
            <div key={d.drug} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold">{d.drug}</h4>
                <Pill tone={d.tone}>Duration</Pill>
              </div>
              <div className="space-y-1 text-sm">
                <KeyRow k="Standard" v={d.standard} />
                <KeyRow k="Extended / maximum" v={d.maximum} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{d.stop}</p>
            </div>
          ))}
        </div>
      </div>

      <Callout tone="danger" title="Two non-negotiable sequencing rules">
        Denosumab is never simply stopped — plan a bisphosphonate transition at 6–9 months after the last dose.
        Anabolic courses (teriparatide, abaloparatide, romosozumab) are always followed immediately by an
        antiresorptive.
      </Callout>
    </div>
  );
}
