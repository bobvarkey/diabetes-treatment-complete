import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BookText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export type GlossaryEntry = { term: string; full: string; def: string };

export const GLOSSARY: GlossaryEntry[] = [
  { term: "ADA", full: "American Diabetes Association", def: "US diabetes society whose annual Standards of Care set the primary reference for diabetes diagnosis and management used in this app." },
  { term: "HbA1c", full: "Glycated hemoglobin A1c", def: "Average glycaemia over ~3 months. Diabetes ≥6.5%, prediabetes 5.7–6.4%." },
  { term: "eGFR", full: "estimated Glomerular Filtration Rate", def: "Kidney function estimate (mL/min/1.73 m²). Many endocrine drugs need dose adjustment when eGFR <45–60." },
  { term: "CrCl", full: "Creatinine Clearance", def: "Cockcroft-Gault estimate of renal clearance; used for weight-based drug dosing (e.g., bisphosphonate safety at CrCl <35)." },
  { term: "CKD", full: "Chronic Kidney Disease", def: "Persistent reduced kidney function; guides drug selection (GLP-1/SGLT2 preferred; metformin caution)." },
  { term: "DKA", full: "Diabetic Ketoacidosis", def: "Hyperglycaemia + ketosis + anion-gap acidosis. Typically type 1 DM." },
  { term: "HHS", full: "Hyperosmolar Hyperglycaemic State", def: "Severe hyperglycaemia + hyperosmolality without significant ketosis, usually type 2 DM." },
  { term: "GLP-1", full: "Glucagon-Like Peptide-1 receptor agonist", def: "Injectable/oral incretin therapies (semaglutide, liraglutide, tirzepatide) — weight loss + cardiorenal benefit." },
  { term: "SGLT2", full: "Sodium-Glucose Co-transporter 2 inhibitor", def: "Empagliflozin/dapagliflozin/canagliflozin — HF and CKD benefit; watch euglycaemic DKA." },
  { term: "BMD", full: "Bone Mineral Density", def: "DXA-derived T-score defines osteoporosis (≤ −2.5) or osteopenia (−1 to −2.5)." },
  { term: "FRAX", full: "Fracture Risk Assessment Tool", def: "10-year probability of major osteoporotic and hip fracture; drives treatment thresholds." },
  { term: "GIOP", full: "Glucocorticoid-Induced Osteoporosis", def: "Bone loss from ≥2.5–7.5 mg prednisone-equivalent daily for ≥3 months; risk-stratify and treat early." },
  { term: "TFT", full: "Thyroid Function Tests", def: "TSH ± free T4/T3; primary hypothyroidism = ↑TSH + ↓fT4." },
  { term: "TED", full: "Thyroid Eye Disease", def: "Graves' orbitopathy; teprotumumab is the first approved disease-modifying therapy." },
  { term: "BMI", full: "Body Mass Index", def: "kg / m². WHO: overweight ≥25, obese ≥30. ICMR (Asian Indian): overweight ≥23, obese ≥25." },
  { term: "ICMR", full: "Indian Council of Medical Research", def: "National authority whose obesity/BMI cut-offs are lower than WHO to reflect Asian Indian phenotype." },
  { term: "L1 HU", full: "L1 Hounsfield Units (CT)", def: "Trabecular attenuation at L1 vertebra on routine CT: <110 HU suggests osteoporosis, >160 HU normal." },
  { term: "BTM", full: "Bone Turnover Marker", def: "Serum CTX (resorption) and P1NP (formation) to monitor antiresorptive and anabolic therapy." },
  // ---- Pituitary / prolactin / adrenal axis ----
  { term: "Agalactorrhea", full: "Failure of lactation", def: "Inability to breastfeed after delivery. As an early postpartum clue with obstetric haemorrhage, it suggests Sheehan syndrome (postpartum pituitary necrosis)." },
  { term: "Sheehan syndrome", full: "Postpartum pituitary necrosis", def: "Pituitary infarction after severe postpartum haemorrhage/hypotension. Classic early clue: failure to lactate (agalactorrhea) from low prolactin, followed by failure to resume menses. Order of hormone loss: GH → PRL → gonadotropins → TSH → ACTH." },
  { term: "Hypoprolactinemia", full: "Low prolactin", def: "Prolactin below the lab reference range. Confirm on repeat fasting morning sample; exclude assay variation and dopaminergic drugs. In the postpartum setting with haemorrhage, consider Sheehan syndrome." },
  { term: "PRL", full: "Prolactin", def: "Anterior pituitary lactotroph hormone for milk production. High in prolactinoma/stalk effect/drugs; low (hypoprolactinemia) suggests pituitary failure such as Sheehan syndrome." },
  { term: "Prolactin", full: "Prolactin (PRL)", def: "Anterior pituitary lactotroph hormone for milk production. High in prolactinoma/stalk effect/drugs; low (hypoprolactinemia) suggests pituitary failure such as Sheehan syndrome." },
  { term: "Hyperprolactinemia", full: "High prolactin", def: "Causes galactorrhea, hypogonadism, amenorrhea. Evaluate macroprolactin, hook effect, medications (antipsychotics, metoclopramide), and sellar MRI." },
  { term: "Prolactinoma", full: "Prolactin-secreting pituitary adenoma", def: "Most common functioning pituitary tumour. First-line therapy is a dopamine agonist (cabergoline); surgery for intolerance/resistance or apoplexy." },
  { term: "Hook effect", full: "Prolactin assay hook effect", def: "Very high prolactin saturates the sandwich assay and is falsely reported as normal — request 1:100 sample dilution in macroadenomas with modest prolactin." },
  { term: "Hypopituitarism", full: "Pituitary hormone deficiency", def: "Loss of one or more anterior pituitary axes. Replace glucocorticoids before levothyroxine to avoid precipitating adrenal crisis." },
  { term: "Pituitary apoplexy", full: "Pituitary apoplexy", def: "Acute haemorrhage/infarction of a pituitary adenoma: thunderclap headache, visual loss, ophthalmoplegia, hypopituitarism. Give stress-dose hydrocortisone; urgent MRI and neurosurgical review." },
  { term: "ACTH stimulation test", full: "Cosyntropin (Synacthen) stimulation test", def: "High-dose: 250 µg cosyntropin IM/IV, cortisol at 0/30/60 min; peak ≥500 nmol/L (≈18 µg/dL) usually excludes adrenal insufficiency. Low-dose 1 µg test is more sensitive for central AI. Recent pituitary injury (<6 weeks, e.g. early Sheehan) may give a false normal." },
  { term: "Cosyntropin", full: "Synthetic ACTH (Synacthen)", def: "ACTH(1–24) analogue used in the ACTH stimulation test to assess adrenal reserve." },
  { term: "Central AI", full: "Central (secondary) adrenal insufficiency", def: "ACTH deficiency (pituitary/hypothalamic). Preserved aldosterone; hyponatremia and hypoglycemia without hyperkalemia. Treat with glucocorticoid replacement first, before levothyroxine." },
  { term: "MEN 1", full: "Multiple Endocrine Neoplasia type 1", def: "Parathyroid hyperplasia, pituitary adenoma (often prolactinoma), pancreatic NETs. Screen with calcium/PTH, prolactin, and fasting gut hormones." },
  { term: "MEN 2A", full: "Multiple Endocrine Neoplasia type 2A", def: "Medullary thyroid carcinoma + phaeochromocytoma ± primary hyperparathyroidism. RET mutation; check calcitonin/CEA and metanephrines before surgery." },
  { term: "MEN 2B", full: "Multiple Endocrine Neoplasia type 2B", def: "Medullary thyroid carcinoma + phaeochromocytoma + mucosal neuromas and marfanoid habitus (no parathyroid disease). RET codon M918T." },
  { term: "APS", full: "Autoimmune Polyglandular Syndrome", def: "APS-1: chronic mucocutaneous candidiasis + hypoparathyroidism + Addison's (AIRE gene). APS-2: Addison's + autoimmune thyroid disease ± type 1 diabetes." },
  { term: "DST", full: "Dexamethasone Suppression Test", def: "1 mg overnight DST for Cushing's screening: 8–9 AM cortisol >50 nmol/L (1.8 µg/dL) is a positive screen needing confirmatory testing." },
];

const map = new Map(GLOSSARY.map((g) => [g.term.toUpperCase(), g]));
export const lookupTerm = (t: string): GlossaryEntry | undefined => map.get(t.trim().toUpperCase());

type Ctx = { openPanel: () => void; openTerm: (t: string) => void };
const GlossaryCtx = createContext<Ctx>({ openPanel: () => {}, openTerm: () => {} });
export const useGlossary = () => useContext(GlossaryCtx);

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState<string | null>(null);

  const openPanel = useCallback(() => { setFocus(null); setOpen(true); }, []);
  const openTerm = useCallback((t: string) => { setFocus(t.toUpperCase()); setOpen(true); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return GLOSSARY;
    return GLOSSARY.filter((g) =>
      g.term.toLowerCase().includes(needle) ||
      g.full.toLowerCase().includes(needle) ||
      g.def.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <GlossaryCtx.Provider value={{ openPanel, openTerm }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookText className="h-4 w-4 text-primary" aria-hidden /> Glossary
            </DialogTitle>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search terms, abbreviations…"
                className="pl-8"
              />
            </div>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No entries match “{q}”.</div>
            )}
            <ul className="divide-y">
              {filtered.map((g) => {
                const focused = focus === g.term.toUpperCase();
                return (
                  <li
                    key={g.term}
                    id={`gloss-${g.term}`}
                    ref={focused ? (el) => el?.scrollIntoView({ block: "center" }) : undefined}
                    className={focused ? "rounded-md bg-primary/5 p-3" : "p-3"}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-display text-sm font-semibold">{g.term}</span>
                      <span className="text-xs text-muted-foreground">{g.full}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">{g.def}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </GlossaryCtx.Provider>
  );
}

/** Inline term with hover-tooltip; click opens full glossary panel. */
export function Term({ children, term }: { children?: ReactNode; term?: string }) {
  const label = String(term ?? (typeof children === "string" ? children : "")).trim();
  const entry = lookupTerm(label);
  const { openTerm } = useGlossary();
  if (!entry) return <>{children ?? label}</>;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); openTerm(entry.term); }}
          className="cursor-help border-b border-dotted border-primary/50 font-medium text-foreground decoration-primary underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${entry.full} — open glossary`}
        >
          {children ?? entry.term}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 text-sm">
        <div className="mb-1 font-display text-sm font-semibold">{entry.term} <span className="ml-1 text-xs font-normal text-muted-foreground">{entry.full}</span></div>
        <p className="text-xs leading-relaxed text-foreground/90">{entry.def}</p>
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => openTerm(entry.term)}>Open glossary →</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Small floating button that opens the glossary panel. */
export function GlossaryButton() {
  const { openPanel } = useGlossary();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="min-h-9 min-w-9"
      onClick={openPanel}
      aria-label="Open glossary"
      title="Glossary (abbreviations & terms)"
    >
      <BookText className="h-4 w-4" aria-hidden />
    </Button>
  );
}
