import { useMemo, useState } from "react";
import { Brain, Calculator, BookOpen, AlertTriangle, Dna, ShieldAlert } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PituitaryApoplexyRedFlags from "./PituitaryApoplexyRedFlags";


/* ------------------------------------------------------------------ logic */

type SizeClass = "unknown" | "microadenoma" | "macroadenoma" | "giant";

type Functional =
  | "nonfunctioning"
  | "prolactinoma"
  | "acromegaly"
  | "cushing_disease"
  | "tsh_oma"
  | "unknown";

type Flags = {
  visual_field_defect: boolean;
  chiasm_contact: boolean;
  apoplexy: boolean;
  cavernous_invasion: boolean;
  pregnancy_planned: boolean;
  hypopituitarism_symptoms: boolean;
  stalk_effect_suspected: boolean;
};

type Inputs = {
  size: number; // mm, max diameter
  prl: number; // ng/mL
  igf1Ratio: number; // × ULN for age/sex
  flags: Flags;
};

type Result = {
  sizeClass: SizeClass;
  functional: Functional;
  urgency: "routine" | "expedited" | "emergency";
  rules: string[];
  workup: string[];
  management: string[];
  followUp: string[];
};

function classifySize(mm: number): SizeClass {
  if (!isFinite(mm) || mm <= 0) return "unknown";
  if (mm < 10) return "microadenoma";
  if (mm >= 40) return "giant";
  return "macroadenoma";
}

function evaluate(i: Inputs): Result {
  const sizeClass = classifySize(i.size);
  const rules: string[] = [];
  const workup: string[] = [];
  const management: string[] = [];
  const followUp: string[] = [];

  const prl = i.prl;
  const igf = i.igf1Ratio;

  /* -- functional classification -- */
  let functional: Functional = "unknown";
  if (isFinite(prl) && prl > 0) {
    if (prl >= 250) {
      functional = "prolactinoma";
      rules.push(`Prolactin ${prl} ng/mL (≥250) — virtually diagnostic of a prolactinoma.`);
    } else if (prl > 100 && sizeClass === "microadenoma") {
      functional = "prolactinoma";
      rules.push(`Prolactin ${prl} ng/mL with a microadenoma — consistent with a prolactinoma.`);
    } else if (prl > 20 && prl < 100 && (sizeClass === "macroadenoma" || sizeClass === "giant")) {
      functional = "nonfunctioning";
      rules.push(
        `Mildly raised prolactin (${prl} ng/mL) with a macroadenoma — favours stalk-effect ` +
          "disconnection hyperprolactinaemia, not a prolactinoma.",
      );
      rules.push("Request a 1:100 serial dilution to exclude a hook effect before calling it non-functioning.");
    } else if (prl > 20) {
      rules.push(`Prolactin mildly elevated (${prl} ng/mL) — exclude drugs, hypothyroidism, renal failure, macroprolactin.`);
    }
  }
  if (isFinite(igf) && igf > 1.0) {
    functional = "acromegaly";
    rules.push(`IGF-1 ${igf.toFixed(2)} × ULN — screen positive for GH excess; confirm with 75 g OGTT GH nadir >1 µg/L.`);
  }

  /* -- urgency -- */
  let urgency: Result["urgency"] = "routine";
  if (i.flags.apoplexy) {
    urgency = "emergency";
    rules.push("Suspected pituitary apoplexy — sudden headache ± ophthalmoplegia ± visual loss.");
  } else if (i.flags.visual_field_defect || (sizeClass === "giant")) {
    urgency = "expedited";
    rules.push("Chiasmal compression / giant adenoma — neurosurgical referral without delay.");
  } else if (sizeClass === "macroadenoma" && i.flags.chiasm_contact) {
    urgency = "expedited";
  }

  // Widen back to the full union: the branches below also cover Cushing disease
  // and TSH-omas, which are set by clinician-entered flags rather than PRL/IGF-1.
  const fnl = functional as Functional;

  /* -- workup -- */
  workup.push("Dedicated pituitary MRI (3 mm sella cuts, pre/post gadolinium, coronal + sagittal).");
  workup.push(
    "Anterior pituitary panel: prolactin (with dilution if macroadenoma), IGF-1, 08:00 cortisol ± ACTH, " +
      "TSH + free T4, LH/FSH, testosterone (men) or oestradiol + cycle history (women).",
  );
  if (sizeClass === "macroadenoma" || sizeClass === "giant" || i.flags.chiasm_contact) {
    workup.push("Formal Goldmann/automated perimetry — every lesion touching or abutting the optic chiasm.");
  }
  if (fnl === "acromegaly") {
    workup.push("Confirm acromegaly: 75 g OGTT with GH nadir; colonoscopy, echo, sleep study, HbA1c.");
  }
  if (fnl === "cushing_disease" || i.flags.hypopituitarism_symptoms) {
    workup.push("If Cushing suspected: 1 mg overnight DST + late-night salivary cortisol + 24-h UFC (2 abnormal tests).");
  }
  workup.push("Ask about MEN1 features (hyperparathyroidism, pancreatic NET) and family history — see MEN panel.");

  /* -- management -- */
  if (urgency === "emergency") {
    management.push("Apoplexy: IV hydrocortisone 100 mg stat then 50 mg q6h, fluids, urgent neurosurgery + ophthalmology.");
  }
  if (fnl === "prolactinoma") {
    management.push("Dopamine agonist first line — cabergoline 0.25 mg twice weekly, titrate to 0.5–1 mg twice weekly by prolactin.");
    management.push("Surgery reserved for DA intolerance/resistance, apoplexy, CSF leak or persistent chiasmal compression.");
    if (i.flags.pregnancy_planned) {
      management.push(
        "Pregnancy: cabergoline (or bromocriptine) stopped once pregnancy confirmed in microadenoma; " +
          "macroadenoma near chiasm — discuss continuing DA or pre-pregnancy debulking, perimetry each trimester.",
      );
    }
  } else if (fnl === "acromegaly") {
    management.push("Transsphenoidal surgery is first line; somatostatin receptor ligand (octreotide LAR/lanreotide) if unresectable or residual; pegvisomant for persistent IGF-1 excess.");
  } else if (fnl === "cushing_disease") {
    management.push("Transsphenoidal selective adenomectomy first line; medical therapy (osilodrostat, metyrapone, ketoconazole) as bridge; radiotherapy/bilateral adrenalectomy if refractory.");
  } else if (fnl === "tsh_oma") {
    management.push("TSH-oma: surgery first line; somatostatin ligands normalise thyroid hormones pre-operatively.");
  } else if (sizeClass === "microadenoma") {
    management.push("Non-functioning microadenoma (incidentaloma): no surgery — observation with interval MRI.");
  } else if (sizeClass === "macroadenoma" || sizeClass === "giant") {
    management.push("Non-functioning macroadenoma: transsphenoidal surgery if chiasmal compression, visual loss, progressive growth or hypopituitarism; otherwise observe.");
  }
  management.push("Replace deficient axes — glucocorticoid FIRST, then levothyroxine (thyroxine before steroid can precipitate adrenal crisis).");

  /* -- follow-up -- */
  if (sizeClass === "microadenoma") {
    followUp.push("MRI at 12 months, then every 1–2 years if stable; hormones annually.");
  } else if (sizeClass === "macroadenoma" || sizeClass === "giant") {
    followUp.push("MRI at 6 months, then annually × 3 years, then every 2 years if stable.");
    followUp.push("Perimetry 6-monthly while the lesion abuts the chiasm.");
  }
  followUp.push("Re-check pituitary function at 6 weeks and 6 months post-op and after radiotherapy (annually, lifelong).");

  return { sizeClass, functional, urgency, rules, workup, management, followUp };
}

const SIZE_TONE: Record<SizeClass, "default" | "info" | "warning" | "danger"> = {
  unknown: "default",
  microadenoma: "info",
  macroadenoma: "warning",
  giant: "danger",
};

const FUNC_LABEL: Record<Functional, string> = {
  unknown: "Not yet classified",
  nonfunctioning: "Non-functioning (± stalk effect)",
  prolactinoma: "Prolactinoma",
  acromegaly: "GH excess / acromegaly",
  cushing_disease: "ACTH-secreting (Cushing disease)",
  tsh_oma: "TSH-secreting adenoma",
};

/* ------------------------------------------------------------------ UI */

function Num({
  id, label, unit, value, onChange, placeholder,
}: {
  id: string; label: string; unit: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label} <span className="text-muted-foreground">({unit})</span>
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

const FLAG_LABELS: Array<{ k: keyof Flags; label: string }> = [
  { k: "visual_field_defect", label: "Visual field defect (bitemporal)" },
  { k: "chiasm_contact", label: "Lesion touches / elevates chiasm on MRI" },
  { k: "apoplexy", label: "Sudden headache ± ophthalmoplegia (apoplexy)" },
  { k: "cavernous_invasion", label: "Cavernous sinus invasion (Knosp 3–4)" },
  { k: "pregnancy_planned", label: "Pregnant or planning pregnancy" },
  { k: "hypopituitarism_symptoms", label: "Symptoms of hypopituitarism" },
  { k: "stalk_effect_suspected", label: "Stalk deviation / compression" },
];

function Evaluator() {
  const [f, setF] = useState({ size: "", prl: "", igf: "" });
  const [flags, setFlags] = useState<Flags>({
    visual_field_defect: false,
    chiasm_contact: false,
    apoplexy: false,
    cavernous_invasion: false,
    pregnancy_planned: false,
    hypopituitarism_symptoms: false,
    stalk_effect_suspected: false,
  });

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const n = (v: string) => parseFloat(v);

  const res = useMemo(
    () => evaluate({ size: n(f.size), prl: n(f.prl), igf1Ratio: n(f.igf), flags }),
    [f, flags],
  );

  return (
    <SectionCard
      id="pit-evaluator"
      title="Pituitary adenoma evaluator"
      subtitle="Size (micro vs macro) × hormone profile × mass effect drives the whole plan"
      icon={<Calculator className="h-5 w-5" />}
      tone="info"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Num id="pit-size" label="Max lesion diameter" unit="mm" value={f.size} onChange={set("size")} placeholder="e.g. 7 or 18" />
          <Num id="pit-prl" label="Prolactin" unit="ng/mL" value={f.prl} onChange={set("prl")} placeholder="4–25" />
          <Num id="pit-igf" label="IGF-1" unit="× ULN" value={f.igf} onChange={set("igf")} placeholder="e.g. 1.6" />
        </div>

        <fieldset className="rounded-md border border-border p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clinical / imaging features
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {FLAG_LABELS.map(({ k, label }) => (
              <label key={k} className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={flags[k]}
                  onCheckedChange={(v) => setFlags((p) => ({ ...p, [k]: Boolean(v) }))}
                  aria-label={label}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Size class"
            value={res.sizeClass === "unknown" ? "—" : res.sizeClass === "giant" ? "Giant (≥40 mm)" : res.sizeClass}
            hint="<10 mm micro · ≥10 mm macro"
          />
          <Stat label="Functional class" value={FUNC_LABEL[res.functional]} />
          <Stat
            label="Urgency"
            value={res.urgency === "emergency" ? "Emergency" : res.urgency === "expedited" ? "Expedited" : "Routine"}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill tone={SIZE_TONE[res.sizeClass]}>{res.sizeClass}</Pill>
          {res.urgency !== "routine" && (
            <Pill tone={res.urgency === "emergency" ? "danger" : "warning"}>{res.urgency}</Pill>
          )}
          {flags.cavernous_invasion && <Pill tone="warning">Knosp 3–4 — low surgical cure rate</Pill>}
        </div>

        {res.urgency === "emergency" && (
          <Callout tone="danger" title="Pituitary apoplexy pathway">
            Stress-dose hydrocortisone before imaging results, urgent non-contrast CT then MRI, urgent
            neurosurgical and ophthalmological review. Do not wait for the cortisol result.
          </Callout>
        )}

        {res.rules.length > 0 && (
          <Callout tone="info" title="Interpretation">
            <ul className="list-disc space-y-1 pl-5">{res.rules.map((r) => <li key={r}>{r}</li>)}</ul>
          </Callout>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border p-3">
            <h4 className="mb-2 text-sm font-semibold">Workup</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">{res.workup.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
          <div className="rounded-md border border-border p-3">
            <h4 className="mb-2 text-sm font-semibold">Management</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">{res.management.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        </div>

        <div className="rounded-md border border-border p-3">
          <h4 className="mb-2 text-sm font-semibold">Surveillance</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm">{res.followUp.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>

        <Callout tone="warning" title="Hook effect">
          A giant prolactinoma can report a falsely low or normal prolactin because assay antibodies are
          saturated. Always request a 1:100 dilution when a macroadenoma has a prolactin that looks "too normal".
        </Callout>
      </div>
    </SectionCard>
  );
}

const microMacro = [
  ["Definition", "Microadenoma <10 mm", "Macroadenoma ≥10 mm (giant ≥40 mm)"],
  ["Typical presentation", "Hormone excess (prolactin, GH, ACTH) or incidental", "Mass effect: bitemporal hemianopia, headache, hypopituitarism"],
  ["Visual fields", "Not routinely required", "Formal perimetry at baseline and on follow-up"],
  ["Hypopituitarism risk", "Uncommon", "Common — screen all anterior axes ± diabetes insipidus"],
  ["Growth risk (non-functioning)", "~10% over 5 yr", "~25–50% over 5 yr"],
  ["MRI interval (stable, non-functioning)", "12 mo, then 1–2 yearly", "6 mo, then annually × 3 yr, then 2 yearly"],
  ["Surgery", "Rarely, unless functioning (Cushing, acromegaly)", "If chiasmal compression, visual loss, growth, apoplexy"],
];

const hormoneScreen = [
  ["Prolactin", "Prolactinoma", "> 250 ng/mL diagnostic; dilute if macroadenoma (hook effect)"],
  ["IGF-1 (age/sex-matched)", "Acromegaly", "Confirm with 75 g OGTT GH nadir > 1 µg/L (>0.4 with ultrasensitive assay)"],
  ["1 mg DST / LNSC / 24-h UFC", "Cushing disease", "Two concordant abnormal tests; then ACTH, HDDST, IPSS"],
  ["08:00 cortisol ± ACTH stim", "ACTH deficiency", "<3 µg/dL deficient · >15–18 µg/dL sufficient"],
  ["Free T4 with TSH", "Central hypothyroidism / TSH-oma", "Low fT4 with low-normal TSH = central; high fT4 with non-suppressed TSH = TSH-oma"],
  ["LH, FSH, testosterone / oestradiol", "Gonadotroph deficiency", "Low sex steroid with inappropriately normal/low gonadotropins"],
  ["Paired serum + urine osmolality, Na", "Arginine-vasopressin deficiency", "Dilute urine with high-normal Na; confirm with copeptin/water deprivation"],
];

function MicroMacro() {
  return (
    <SectionCard
      id="pit-micromacro"
      title="Microadenoma vs macroadenoma"
      subtitle="The 10 mm threshold changes imaging, perimetry and surgical thresholds"
      icon={<Brain className="h-5 w-5" />}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-2">Feature</th><th className="p-2">Microadenoma</th><th className="p-2">Macroadenoma</th></tr>
          </thead>
          <tbody>
            {microMacro.map(([a, b, c]) => (
              <tr key={a} className="border-t border-border">
                <td className="p-2 font-medium">{a}</td>
                <td className="p-2 text-muted-foreground">{b}</td>
                <td className="p-2 text-muted-foreground">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="mb-2 mt-4 font-semibold">Baseline hormonal screen for every sellar mass</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-2">Test</th><th className="p-2">Targets</th><th className="p-2">Interpretation</th></tr>
          </thead>
          <tbody>
            {hormoneScreen.map(([a, b, c]) => (
              <tr key={a} className="border-t border-border">
                <td className="p-2 font-medium">{a}</td>
                <td className="p-2">{b}</td>
                <td className="p-2 text-muted-foreground">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout tone="warning" title="Replace steroid before thyroxine">
        In panhypopituitarism, starting levothyroxine before hydrocortisone accelerates cortisol clearance
        and can precipitate an adrenal crisis.
      </Callout>

      <Callout tone="info" title="Mimics of a pituitary adenoma">
        Rathke cleft cyst, craniopharyngioma, meningioma, hypophysitis (including immune checkpoint
        inhibitor hypophysitis), germinoma, metastasis, carotid aneurysm and pituitary hyperplasia of
        primary hypothyroidism (shrinks with levothyroxine — do not operate).
      </Callout>
    </SectionCard>
  );
}

const hormoneLossPatterns = [
  ["Progressive compressive lesion", "GH → LH/FSH → TSH → ACTH", "Cortisol reserve is often relatively preserved until late disease."],
  ["Autoimmune hypophysitis", "ACTH → TSH → LH/FSH → GH; PRL may be high early", "Actively exclude central adrenal insufficiency, even with a modest sellar mass."],
  ["PD-1 / PD-L1 inhibitor hypophysitis", "Often isolated ACTH deficiency", "May present with hyponatraemia, fatigue, nausea, hypotension, or hypoglycaemia with little enlargement."],
  ["CTLA-4 inhibitor hypophysitis", "ACTH commonly affected, often with TSH and/or LH/FSH", "Multiple anterior pituitary deficits are more common than with PD-1 / PD-L1 therapy."],
  ["Infundibulo-neurohypophysitis / panhypophysitis", "AVP deficiency may be prominent", "Diabetes insipidus suggests inflammatory, infiltrative, metastatic, or stalk/posterior disease rather than a routine adenoma."],
];

function HormoneLossPatterns() {
  return (
    <SectionCard
      id="pit-hormone-loss"
      title="Pattern of pituitary hormone loss"
      subtitle="Compressive lesions usually lose GH first; hypophysitis often affects ACTH early"
      icon={<Brain className="h-5 w-5" />}
      tone="warning"
    >
      <div className="space-y-4 text-sm">
        <Callout tone="info" title="Classic distinction">
          Slowly progressive pituitary compression classically follows <b>GH → LH/FSH → TSH → ACTH</b>.
          Autoimmune hypophysitis has relative corticotroph predilection, so ACTH deficiency can be abrupt,
          early, and life-threatening despite a relatively modest sellar mass.
        </Callout>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">Condition</th><th className="p-2">Typical pattern</th><th className="p-2">Clinical implication</th></tr>
            </thead>
            <tbody>
              {hormoneLossPatterns.map(([condition, pattern, implication]) => (
                <tr key={condition} className="border-t border-border align-top">
                  <td className="p-2 font-medium">{condition}</td>
                  <td className="p-2">{pattern}</td>
                  <td className="p-2 text-muted-foreground">{implication}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-1 md:grid-cols-2">
          <KeyRow k="Compressive adenoma first clue" v="GH deficiency is often earliest biochemically; hypogonadism is often the first clinically evident deficit in adults." />
          <KeyRow k="Central hypothyroidism" v="Low free T4 with low, normal, or mildly elevated TSH; do not use TSH alone for diagnosis or monitoring." />
          <KeyRow k="Early hypophysitis clues" v="Fatigue, anorexia, nausea, weight loss, postural symptoms, hyponatraemia, hypoglycaemia, or headache." />
          <KeyRow k="Prolactin in hypophysitis" v="May rise early from inflammatory stalk effect and fall later with fibrosis or gland atrophy." />
          <KeyRow k="Diabetes insipidus" v="Atypical for a routine adenoma; consider stalk, posterior-pituitary, inflammatory, infiltrative, metastatic, or granulomatous disease." />
          <KeyRow k="Chronic hypophysitis" v="ACTH deficiency commonly persists; other axes may recover, but GH and PRL deficiency can emerge with fibrosis or atrophy." />
        </div>

        <Callout tone="danger" title="Cortisol before thyroid hormone">
          When central hypothyroidism coexists with possible ACTH deficiency, evaluate and treat adrenal
          insufficiency first. In an unstable patient, do not delay stress-dose glucocorticoids for testing;
          levothyroxine can precipitate adrenal crisis by increasing cortisol clearance.
        </Callout>

        <Callout tone="warning" title="Initial assessment when stable">
          Obtain 08:00 cortisol with ACTH, free T4 with TSH, prolactin, LH/FSH with sex steroids, IGF-1,
          serum sodium, and assessment for diabetes insipidus when clinically indicated, ideally before
          glucocorticoid treatment.
        </Callout>
      </div>
    </SectionCard>
  );
}

const menRows = [
  {
    t: "MEN 1 (Wermer)",
    gene: "MEN1 (menin), 11q13 — autosomal dominant",
    triad: "Parathyroid (95%) · Pancreatic NET (30–70%) · Pituitary (30–40%)",
    detail:
      "Primary hyperparathyroidism is usually the first manifestation (multi-gland — subtotal or total parathyroidectomy with autotransplant). " +
      "Gastrinoma (Zollinger-Ellison) and insulinoma dominate the pancreatic lesions; prolactinoma is the commonest pituitary tumour. " +
      "Also: foregut carcinoid, adrenocortical tumours, facial angiofibromas, collagenomas, lipomas.",
    screen:
      "Annual from age 5: calcium + PTH, prolactin, IGF-1, fasting gastrin, glucose/insulin, chromogranin A. MRI pituitary and pancreatic imaging (MRI/EUS) every 1–3 yrs.",
  },
  {
    t: "MEN 2A (Sipple)",
    gene: "RET proto-oncogene, 10q11.2 — autosomal dominant",
    triad: "Medullary thyroid carcinoma (~100%) · Phaeochromocytoma (50%) · Parathyroid hyperplasia (20–30%)",
    detail:
      "Variants: classical, with cutaneous lichen amyloidosis, and with Hirschsprung disease. " +
      "ALWAYS exclude and treat phaeochromocytoma (plasma/urine metanephrines) BEFORE any thyroid or parathyroid surgery.",
    screen:
      "RET testing of all first-degree relatives. Prophylactic thyroidectomy timing by codon risk: ATA HST (M918T) in the first year of life, HIGH (C634, A883F) by age 5, MODERATE risk — from age 5 guided by calcitonin. Annual metanephrines and calcium.",
  },
  {
    t: "MEN 2B",
    gene: "RET M918T (~95%); ~75% de novo mutations",
    triad: "MTC (early, aggressive) · Phaeochromocytoma (50%) · NO hyperparathyroidism",
    detail:
      "Marfanoid habitus, mucosal neuromas of lips/tongue, thickened corneal nerves, intestinal ganglioneuromatosis with constipation/megacolon in infancy. Poorest prognosis of the MEN syndromes.",
    screen: "Thyroidectomy within the first year of life; annual metanephrines from age 11.",
  },
  {
    t: "MEN 4",
    gene: "CDKN1B (p27kip1) — autosomal dominant, rare",
    triad: "Parathyroid + pituitary adenoma, ± NET, ± reproductive-organ tumours",
    detail: "Phenocopy of MEN1 with negative MEN1 sequencing — test CDKN1B when MEN1 is clinically suspected but genetically negative.",
    screen: "Mirror MEN1 surveillance.",
  },
];

function MenSyndromes() {
  return (
    <SectionCard
      id="pit-men"
      title="Multiple endocrine neoplasia (MEN) syndromes"
      subtitle="Suspect in young, multifocal, recurrent or familial endocrine tumours"
      icon={<Dna className="h-5 w-5" />}
      tone="warning"
    >
      <div className="grid gap-3">
        {menRows.map((m) => (
          <div key={m.t} className="rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-foreground">{m.t}</div>
              <Pill tone="primary">{m.gene}</Pill>
            </div>
            <div className="mt-1 text-sm font-medium">{m.triad}</div>
            <p className="mt-1 text-xs text-muted-foreground">{m.detail}</p>
            <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs">
              <span className="font-semibold">Surveillance: </span>{m.screen}
            </div>
          </div>
        ))}
      </div>

      <Callout tone="danger" title="Order of operations in MEN 2">
        Phaeochromocytoma must be excluded (and, if present, alpha-blocked and resected first) before
        thyroidectomy or parathyroid surgery — anaesthesia in an unblocked patient can be fatal.
      </Callout>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <KeyRow k="When to test MEN1 genetically" v="PHPT <40 yr, multi-gland PHPT, ≥2 MEN1-related tumours, gastrinoma at any age, first-degree relative of a carrier" />
        <KeyRow k="When to test RET" v="Any MTC, C-cell hyperplasia, MEN2 phenotype, familial phaeochromocytoma" />
        <KeyRow k="Carney complex (differential)" v="PRKAR1A — cardiac myxoma, lentigines, PPNAD, GH-secreting adenoma" />
        <KeyRow k="McCune-Albright (differential)" v="GNAS mosaic — polyostotic fibrous dysplasia, café-au-lait, precocious puberty, acromegaly" />
      </div>
    </SectionCard>
  );
}

const apsRows = [
  {
    t: "APS type 1 (APECED)",
    gene: "AIRE mutation — autosomal recessive; onset in childhood",
    core: "Chronic mucocutaneous candidiasis + hypoparathyroidism + Addison disease (2 of 3 required)",
    other:
      "Also: ectodermal dystrophy (nail/enamel), autoimmune hepatitis, pernicious anaemia, alopecia, vitiligo, primary ovarian insufficiency, keratoconjunctivitis, asplenia. " +
      "Anti-interferon-ω / anti-interferon-α antibodies are a highly sensitive marker.",
  },
  {
    t: "APS type 2 (Schmidt)",
    gene: "Polygenic, HLA-DR3/DR4 — female predominance, 3rd–4th decade",
    core: "Addison disease + autoimmune thyroid disease and/or type 1 diabetes",
    other: "Addison plus Hashimoto = Schmidt syndrome; Addison plus T1DM = Carpenter syndrome. Also vitiligo, coeliac disease, pernicious anaemia, myasthenia gravis.",
  },
  {
    t: "APS type 3",
    gene: "Polygenic; adult onset",
    core: "Autoimmune thyroid disease + another autoimmunity (T1DM, pernicious anaemia, vitiligo) WITHOUT adrenal involvement",
    other: "The commonest cluster in practice — adrenal function is by definition intact.",
  },
  {
    t: "APS type 4",
    gene: "Polygenic",
    core: "Autoimmune combinations not fitting types 1–3 (e.g. Addison + coeliac disease without thyroid disease)",
    other: "Diagnosis of exclusion.",
  },
  {
    t: "IPEX",
    gene: "FOXP3 — X-linked, infancy",
    core: "Immune dysregulation, polyendocrinopathy (neonatal T1DM, thyroiditis), enteropathy",
    other: "Severe secretory diarrhoea, eczema, high mortality without haematopoietic stem cell transplant.",
  },
];

function Polyglandular() {
  return (
    <SectionCard
      id="pit-aps"
      title="Autoimmune polyglandular syndromes / polyglandular atrophy"
      subtitle="One autoimmune endocrinopathy predicts the next — screen prospectively"
      icon={<ShieldAlert className="h-5 w-5" />}
      tone="info"
    >
      <div className="grid gap-3">
        {apsRows.map((a) => (
          <div key={a.t} className="rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-foreground">{a.t}</div>
              <Pill tone="primary">{a.gene}</Pill>
            </div>
            <div className="mt-1 text-sm font-medium">{a.core}</div>
            <p className="mt-1 text-xs text-muted-foreground">{a.other}</p>
          </div>
        ))}
      </div>

      <h4 className="mb-2 mt-4 font-semibold">Antibody & surveillance panel</h4>
      <div className="grid gap-1 md:grid-cols-2">
        <KeyRow k="Adrenal" v="21-hydroxylase antibodies; 08:00 cortisol + ACTH annually if positive" />
        <KeyRow k="Thyroid" v="TPO ± Tg antibodies; TSH annually" />
        <KeyRow k="Beta cell" v="GAD-65, IA-2, ZnT8, insulin autoantibodies; HbA1c annually" />
        <KeyRow k="Parathyroid" v="Calcium, phosphate, PTH (hypoparathyroidism in APS-1)" />
        <KeyRow k="Gut" v="Anti-tTG IgA with total IgA (coeliac); parietal cell / intrinsic factor antibodies, B12" />
        <KeyRow k="Gonad" v="FSH/LH + oestradiol or testosterone; steroid-cell antibodies for premature ovarian insufficiency" />
      </div>

      <Callout tone="danger" title="Adrenal crisis is the killer">
        In any patient with autoimmune thyroid disease or T1DM who develops fatigue, weight loss,
        hyperpigmentation, hyponatraemia, hyperkalaemia or falling insulin requirements, check for Addison
        disease. Give hydrocortisone before, or alongside, levothyroxine.
      </Callout>

      <Callout tone="warning" title="Family screening">
        First-degree relatives of APS-1 probands warrant AIRE sequencing; relatives in APS-2/3 families are
        screened serologically (TPO, GAD-65, 21-hydroxylase) rather than genetically.
      </Callout>
    </SectionCard>
  );
}

function Abbrev() {
  return (
    <SectionCard id="pit-abbrev" title="Abbreviations & pitfalls" icon={<BookOpen className="h-5 w-5" />} defaultOpen={false}>
      <div className="grid gap-1 md:grid-cols-2">
        <KeyRow k="DST" v="Dexamethasone suppression test" />
        <KeyRow k="LNSC / UFC" v="Late-night salivary cortisol / 24-h urinary free cortisol" />
        <KeyRow k="IPSS" v="Inferior petrosal sinus sampling" />
        <KeyRow k="Knosp grade" v="MRI grading of cavernous sinus invasion (3–4 = low surgical cure)" />
        <KeyRow k="AVP-D" v="Arginine-vasopressin deficiency (formerly central diabetes insipidus)" />
        <KeyRow k="MTC" v="Medullary thyroid carcinoma" />
        <KeyRow k="PPNAD" v="Primary pigmented nodular adrenocortical disease" />
        <KeyRow k="APECED" v="Autoimmune polyendocrinopathy–candidiasis–ectodermal dystrophy" />
      </div>
      <Callout tone="warning" title="Common traps">
        <ul className="list-disc space-y-1 pl-5">
          <li>Macroprolactin and drug-induced hyperprolactinaemia mimic a microprolactinoma.</li>
          <li>Hook effect masking a giant prolactinoma.</li>
          <li>Pituitary hyperplasia from untreated primary hypothyroidism misread as an adenoma.</li>
          <li>Empty sella with normal function needs no intervention.</li>
          <li><AlertTriangle className="inline h-3.5 w-3.5" /> Never start levothyroxine before glucocorticoid in suspected hypopituitarism.</li>
        </ul>
      </Callout>
    </SectionCard>
  );
}

/* ------------- Agalactorrhea / low prolactin / Sheehan syndrome evaluator ---- */

type SheehanFlags = {
  postpartum: boolean;
  postpartum_hemorrhage: boolean;
  severe_postpartum_hypotension: boolean;
  failure_to_lactate: boolean;
  amenorrhea: boolean;
  loss_of_axillary_hair: boolean;
  fatigue: boolean;
  hypotension: boolean;
  hyponatremia: boolean;
  hypoglycemia: boolean;
  headache: boolean;
  visual_field_symptoms: boolean;
  dopamine_agonist: boolean;
  other_axis_abnormal: boolean;
};

const SHEEHAN_FLAG_LABELS: Array<{ k: keyof SheehanFlags; label: string }> = [
  { k: "postpartum", label: "Postpartum" },
  { k: "postpartum_hemorrhage", label: "Postpartum haemorrhage" },
  { k: "severe_postpartum_hypotension", label: "Severe postpartum hypotension" },
  { k: "failure_to_lactate", label: "Agalactorrhea / failure to lactate" },
  { k: "amenorrhea", label: "Persistent amenorrhea" },
  { k: "loss_of_axillary_hair", label: "Loss of axillary / pubic hair" },
  { k: "fatigue", label: "Severe fatigue / unexplained weakness" },
  { k: "hypotension", label: "Hypotension" },
  { k: "hyponatremia", label: "Hyponatraemia" },
  { k: "hypoglycemia", label: "Hypoglycaemia" },
  { k: "headache", label: "Headache" },
  { k: "visual_field_symptoms", label: "Visual-field disturbance" },
  { k: "dopamine_agonist", label: "On dopamine agonist / dopaminergic drug" },
  { k: "other_axis_abnormal", label: "Another pituitary axis already abnormal" },
];

function evaluateLowPrl(
  prl: number,
  labLow: number,
  repeatPrl: number,
  flags: SheehanFlags,
) {
  const out: { pills: React.ReactNode[]; callouts: React.ReactNode[]; tests: string[]; impression: string[] } = {
    pills: [], callouts: [], tests: [], impression: [],
  };
  const belowRef = isFinite(prl) && isFinite(labLow) && prl < labLow;
  const confirmedLow = belowRef && isFinite(repeatPrl) && repeatPrl < labLow;

  out.pills.push(<Pill key="s" tone={belowRef ? "warning" : "default"}>{belowRef ? "Below lab reference" : "Not confirmed below reference"}</Pill>);
  if (belowRef) {
    out.pills.push(<Pill key="c" tone={confirmedLow ? "danger" : "info"}>{confirmedLow ? "Confirmed low on repeat" : "Repeat prolactin advised"}</Pill>);
    out.callouts.push(
      <Callout key="rep" tone="info" title="Step 1 — confirm it is genuinely low">
        Interpret against the laboratory's sex-, age-, pregnancy- and assay-specific reference interval — there
        is no universal hypoprolactinaemia cutoff. If unexpectedly low, repeat with the same/validated assay
        (morning, non-stressed, no recent breast stimulation). No data is stored.
      </Callout>,
    );
  }

  // Medication review
  if (flags.dopamine_agonist) {
    out.callouts.push(
      <Callout key="med" tone="warning" title="Step 3 — medication effect">
        Dopamine agonists and other dopaminergic drugs suppress prolactin — review timing, indication and
        mechanism before attributing a low prolactin to pituitary disease.
      </Callout>,
    );
  }

  // Sheehan screen (step 6)
  const sheehanTrigger = flags.postpartum_hemorrhage || flags.severe_postpartum_hypotension || (flags.postpartum && flags.failure_to_lactate);
  const sheehanSupport = [
    flags.failure_to_lactate, flags.amenorrhea, flags.loss_of_axillary_hair, flags.hypotension,
    flags.hyponatremia, flags.hypoglycemia, flags.fatigue,
  ].filter(Boolean).length;
  const sheehanSuspected = sheehanTrigger && (flags.failure_to_lactate || sheehanSupport >= 2 || flags.other_axis_abnormal);

  if (sheehanSuspected) {
    out.pills.push(<Pill key="sh" tone="danger">Sheehan syndrome suspected</Pill>);
    out.callouts.push(
      <Callout key="sh" tone="danger" title="Sheehan syndrome (postpartum hypopituitarism) — high priority">
        Postpartum haemorrhage / severe hypotension with agalactorrhea ± amenorrhea is Sheehan syndrome until
        proven otherwise. Assess ALL pituitary axes urgently, prioritise the adrenal axis, and arrange a
        pituitary MRI (sellar protocol). Prolactin and GH are typically lost first.
      </Callout>,
    );
  } else if (flags.failure_to_lactate && belowRef) {
    out.callouts.push(
      <Callout key="ag" tone="warning" title="Agalactorrhea with low prolactin">
        Failure to lactate plus a low prolactin warrants evaluation for pituitary dysfunction — check for
        postpartum haemorrhage history and screen the remaining anterior axes.
      </Callout>,
    );
  }

  // Adrenal-safety alert
  if (belowRef && (flags.hypotension || flags.hyponatremia || flags.hypoglycemia)) {
    out.callouts.push(
      <Callout key="adr" tone="danger" title="URGENT — possible central adrenal insufficiency">
        Low prolactin with hypotension, hyponatraemia or hypoglycaemia: evaluate adrenal function before
        starting thyroid hormone — levothyroxine first can precipitate adrenal crisis. Give stress-dose
        hydrocortisone without delay if the patient is unstable.
      </Callout>,
    );
  }

  // Pituitary mass alert
  if (flags.headache || flags.visual_field_symptoms) {
    out.callouts.push(
      <Callout key="mass" tone="warning" title="Possible pituitary mass / hypophysitis">
        Headache or visual-field symptoms with hypopituitarism — arrange MRI pituitary (sellar protocol) and
        formal perimetry.
      </Callout>,
    );
  }

  // Isolated vs multiaxial
  if (belowRef) {
    if (flags.other_axis_abnormal) {
      out.impression.push("Low prolactin WITH other axis abnormality — raises suspicion for hypothalamic–pituitary disease; MRI indicated.");
    } else if (!sheehanSuspected) {
      out.impression.push("Isolated low prolactin — consider assay/physiologic variation and medications before diagnosing pituitary disease.");
    }
  }

  // Step 4/5 core tests
  if (belowRef || sheehanSuspected) {
    out.tests.push(
      "08:00 serum cortisol + ACTH — HIGH priority (screen central adrenal insufficiency)",
      "TSH + free T4 — HIGH priority (TSH alone misses central hypothyroidism)",
      "LH, FSH + oestradiol (premenopausal) or total testosterone (men)",
      "IGF-1 (growth-hormone axis)",
      "Serum sodium, potassium, glucose; CBC, renal and liver function",
      "β-hCG if pregnancy is possible",
    );
    if (sheehanSuspected || flags.other_axis_abnormal || flags.headache || flags.visual_field_symptoms) {
      out.tests.push("MRI pituitary with sellar protocol");
    }
  }

  return out;
}

function SheehanApp() {
  const [prl, setPrl] = useState("");
  const [labLow, setLabLow] = useState("");
  const [repeatPrl, setRepeatPrl] = useState("");
  const [flags, setFlags] = useState<SheehanFlags>({
    postpartum: false, postpartum_hemorrhage: false, severe_postpartum_hypotension: false,
    failure_to_lactate: false, amenorrhea: false, loss_of_axillary_hair: false, fatigue: false,
    hypotension: false, hyponatremia: false, hypoglycemia: false, headache: false,
    visual_field_symptoms: false, dopamine_agonist: false, other_axis_abnormal: false,
  });

  const res = useMemo(
    () => evaluateLowPrl(parseFloat(prl), parseFloat(labLow), parseFloat(repeatPrl), flags),
    [prl, labLow, repeatPrl, flags],
  );

  return (
    <SectionCard
      id="pit-sheehan"
      title="Agalactorrhea & low prolactin — Sheehan syndrome evaluator"
      subtitle="Failure to lactate after delivery + haemorrhage = postpartum hypopituitarism until proven otherwise"
      icon={<AlertTriangle className="h-5 w-5" />}
      tone="warning"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Num id="sh-prl" label="Prolactin" unit="ng/mL" value={prl} onChange={setPrl} placeholder="e.g. 2" />
          <Num id="sh-low" label="Lab lower reference limit" unit="ng/mL" value={labLow} onChange={setLabLow} placeholder="e.g. 4" />
          <Num id="sh-repeat" label="Repeat prolactin (optional)" unit="ng/mL" value={repeatPrl} onChange={setRepeatPrl} placeholder="confirmation" />
        </div>

        <fieldset className="rounded-md border border-border p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clinical context
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SHEEHAN_FLAG_LABELS.map(({ k, label }) => (
              <label key={k} className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={flags[k]}
                  onCheckedChange={(v) => setFlags((p) => ({ ...p, [k]: Boolean(v) }))}
                  aria-label={label}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {res.pills.length > 0 && <div className="flex flex-wrap gap-2">{res.pills}</div>}
        {res.callouts}
        {res.impression.map((t) => (
          <Callout key={t} tone="info" title="Interpretation">{t}</Callout>
        ))}

        {res.tests.length > 0 && (
          <div className="rounded-md border border-border p-3">
            <h4 className="mb-2 text-sm font-semibold">Recommended investigations (pituitary screen)</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">{res.tests.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        )}

        <div className="grid gap-1 md:grid-cols-2">
          <KeyRow k="Sheehan syndrome" v="Ischaemic pituitary necrosis after postpartum haemorrhage/hypotension; agalactorrhea is the classic earliest clue, followed by amenorrhea and loss of axillary/pubic hair." />
          <KeyRow k="Agalactorrhea" v="Failure of lactation after delivery — the earliest sign of prolactin ± GH deficiency; always ask about the delivery and any haemorrhage." />
          <KeyRow k="Order of hormone loss" v="PRL and GH first, then LH/FSH, TSH, ACTH; posterior pituitary (AVP) is usually spared — DI argues against Sheehan." />
          <KeyRow k="Critical safety rule" v="If central adrenal insufficiency is suspected, evaluate/replace glucocorticoid BEFORE levothyroxine whenever clinically feasible." />
        </div>
      </div>
    </SectionCard>
  );
}

export default function PituitaryApp() {
  return (
    <div className="space-y-4">
      <Evaluator />
      <PituitaryApoplexyRedFlags />
      <SheehanApp />
      <MicroMacro />
      <HormoneLossPatterns />
      <MenSyndromes />
      <Polyglandular />
      <Abbrev />
    </div>
  );
}

