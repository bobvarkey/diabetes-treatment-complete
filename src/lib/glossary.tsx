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
