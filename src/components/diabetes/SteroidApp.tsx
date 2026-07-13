import { useMemo, useState } from "react";
import { Pill, Calculator, AlertTriangle, Copy, FileText, FileDown, Printer, Search, ClipboardList } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SectionCard, KeyRow, Pill as Chip, Callout, Stat } from "./shared";

interface Steroid {
  name: string;
  klass: string;
  halfLife: string;
  antiInflam: number | string;
  gc: number | string;
  mc: string;
  eqDose: number | null;
  po: string;
  iv: string;
  extra?: string;
  cautions: string[];
  preg: string;
  uses: string[];
}

const STEROIDS: Steroid[] = [
  { name: "Hydrocortisone", klass: "Short (8–12 h)", halfLife: "1.5–2 h", antiInflam: 1, gc: 1, mc: "High", eqDose: 20,
    po: "15–30 mg/d in 2–3 doses", iv: "100 mg bolus, then 50–100 mg q6–8h",
    cautions: ["Adrenal insufficiency", "Shock", "Severe infection risk"], preg: "C",
    uses: ["Adrenal insufficiency", "Septic shock", "Acute asthma", "Anaphylaxis (adjunct)", "Addison's crisis"] },
  { name: "Cortisone", klass: "Short (8–12 h)", halfLife: "0.5–1 h", antiInflam: 0.8, gc: 0.8, mc: "High", eqDose: 25,
    po: "50–200 mg/d in divided doses", iv: "N/A",
    cautions: ["Rarely used; mainly adrenal insufficiency"], preg: "C", uses: ["Adrenal insufficiency"] },
  { name: "Prednisolone", klass: "Intermediate (12–36 h)", halfLife: "2–3.5 h", antiInflam: 4, gc: 4, mc: "Moderate", eqDose: 5,
    po: "5–60 mg/d once daily (1 mg/kg/d severe)", iv: "Prednisolone Na phosphate IV (some formulations)",
    cautions: ["Adrenal suppression", "Hyperglycemia", "Infection risk"], preg: "C",
    uses: ["Asthma", "COPD", "RA", "IBD", "Nephrotic syndrome", "Allergic/autoimmune"] },
  { name: "Prednisone", klass: "Intermediate (12–36 h)", halfLife: "2–3.5 h", antiInflam: 4, gc: 4, mc: "Moderate", eqDose: 5,
    po: "5–60 mg/d once daily", iv: "N/A",
    cautions: ["Hepatic conversion → avoid in severe liver failure", "Adrenal suppression", "Hyperglycemia"],
    preg: "C", uses: ["Asthma", "COPD", "RA", "IBD", "Nephrotic syndrome", "Allergic/autoimmune"] },
  { name: "Methylprednisolone", klass: "Intermediate (12–36 h)", halfLife: "2–3 h", antiInflam: 5, gc: 5, mc: "Moderate", eqDose: 4,
    po: "4–48 mg/d", iv: "40–125 mg q6–8h",
    cautions: ["Pulse: monitor BP/glucose/K+", "Adrenal suppression", "Infection risk"], preg: "C",
    uses: ["Acute severe asthma", "COPD exacerbation", "MS relapse", "Severe allergies", "Autoimmune"] },
  { name: "Triamcinolone", klass: "Intermediate (12–36 h)", halfLife: "3–4 h", antiInflam: 5, gc: 5, mc: "Minimal", eqDose: 4,
    po: "4–32 mg/d", iv: "N/A", extra: "Joint injection: 2–50 mg (joint size)",
    cautions: ["Avoid in infected joints", "Adrenal suppression", "Infection risk"], preg: "C",
    uses: ["Allergic disorders", "IBD", "Arthritis", "Dermatologic", "Nephrotic syndrome"] },
  { name: "Dexamethasone", klass: "Long (36–72 h)", halfLife: "3–4.5 h", antiInflam: 25, gc: 25, mc: "Minimal", eqDose: 0.75,
    po: "0.5–9 mg/d", iv: "4–10 mg q6–8h",
    cautions: ["Strong HPA suppression", "Hyperglycemia", "Minimal MC → less fluid retention"], preg: "C",
    uses: ["Cerebral edema", "Croup", "Severe asthma", "Severe COVID-19", "PONV prophylaxis", "Allergic"] },
  { name: "Betamethasone", klass: "Long (36–72 h)", halfLife: "3–4 h", antiInflam: 25, gc: 30, mc: "Minimal", eqDose: 0.6,
    po: "0.5–8 mg/d", iv: "4–8 mg q6–8h",
    extra: "Fetal lung maturation: 12 mg IM q24h × 2 doses",
    cautions: ["Strong HPA suppression", "Hyperglycemia"], preg: "C",
    uses: ["Cerebral edema", "Fetal lung maturation", "Severe allergies", "Dermatologic"] },
  { name: "Fludrocortisone", klass: "Mineralocorticoid", halfLife: "1.5–2 h", antiInflam: "Very low", gc: "Low", mc: "Very High", eqDose: null,
    po: "0.05–0.2 mg/d", iv: "N/A",
    cautions: ["Hypernatremia", "Hypertension", "Fluid overload", "Hypokalemia"], preg: "C",
    uses: ["Primary adrenal insufficiency (Addison's)", "MC replacement"] },
  { name: "Desoxycorticosterone", klass: "Mineralocorticoid", halfLife: "variable", antiInflam: "Very low", gc: "Low", mc: "Very High", eqDose: null,
    po: "1–4 mg/d", iv: "N/A",
    cautions: ["Hypernatremia", "Hypertension", "Fluid overload", "Hypokalemia"], preg: "C",
    uses: ["Primary adrenal insufficiency", "MC replacement"] },
];

function SteroidApp() {
  const [query, setQuery] = useState("");
  const [srcIdx, setSrcIdx] = useState(2); // Prednisolone
  const [tgtIdx, setTgtIdx] = useState(6); // Dexamethasone
  const [srcDose, setSrcDose] = useState("20");
  const [selected, setSelected] = useState<string | null>(null);

  const convertible = STEROIDS.filter((s) => s.eqDose !== null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return STEROIDS;
    return STEROIDS.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.klass.toLowerCase().includes(q) ||
      s.uses.some((u) => u.toLowerCase().includes(q)),
    );
  }, [query]);

  const src = convertible[srcIdx] ?? convertible[0];
  const tgt = convertible[tgtIdx] ?? convertible[0];
  const dose = parseFloat(srcDose);
  const converted = !isNaN(dose) && src.eqDose && tgt.eqDose
    ? ((dose / (src.eqDose as number)) * (tgt.eqDose as number))
    : null;

  const active = STEROIDS.find((s) => s.name === selected);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Steroid potency converter"
        subtitle="Equipotent conversion · glucocorticoid & mineralocorticoid profile"
        icon={<Calculator className="h-5 w-5" />}
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label className="text-xs">Source steroid</Label>
            <select
              value={srcIdx}
              onChange={(e) => setSrcIdx(parseInt(e.target.value))}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {convertible.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Source dose (mg)</Label>
            <Input type="number" value={srcDose} onChange={(e) => setSrcDose(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Target steroid</Label>
            <select
              value={tgtIdx}
              onChange={(e) => setTgtIdx(parseInt(e.target.value))}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {convertible.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
            </select>
          </div>
          <Stat
            label={`${tgt.name} equivalent`}
            value={converted !== null ? `${converted.toFixed(2)} mg` : "—"}
            hint={`(${srcDose || "?"} / ${src.eqDose}) × ${tgt.eqDose}`}
          />
        </div>
        <Callout tone="info" title="Formula">
          Target Dose = (Source Dose / Source Eq. Dose) × Target Eq. Dose. Approximate — titrate to clinical response. Consider MC activity for fluid/electrolyte balance.
        </Callout>
      </SectionCard>

      <SectionCard
        title="Steroid reference"
        subtitle="Potency, half-life, dosing, cautions"
        icon={<Pill className="h-5 w-5" />}
      >
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by drug, class, or clinical use…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Drug</th>
                <th className="p-2">Class</th>
                <th className="p-2">t½</th>
                <th className="p-2">GC</th>
                <th className="p-2">MC</th>
                <th className="p-2">Eq. dose</th>
                <th className="p-2">PO</th>
                <th className="p-2">IV</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.name}
                  onClick={() => setSelected(s.name)}
                  className={`cursor-pointer border-t border-border hover:bg-accent/40 ${selected === s.name ? "bg-primary/5" : ""}`}
                >
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2 text-muted-foreground">{s.klass}</td>
                  <td className="p-2">{s.halfLife}</td>
                  <td className="p-2">{s.gc}</td>
                  <td className="p-2">{s.mc}</td>
                  <td className="p-2">{s.eqDose ?? "—"}</td>
                  <td className="p-2">{s.po}</td>
                  <td className="p-2">{s.iv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {active && (
          <div className="mt-3 space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{active.name} · {active.klass}</div>
              <div className="flex gap-1.5">
                <Chip>Preg {active.preg}</Chip>
                <Chip tone="info">MC: {active.mc}</Chip>
              </div>
            </div>
            <KeyRow k="Anti-inflammatory potency" v={String(active.antiInflam)} />
            <KeyRow k="Equivalent dose" v={active.eqDose ? `${active.eqDose} mg` : "—"} />
            <KeyRow k="Oral" v={active.po} />
            <KeyRow k="IV" v={active.iv} />
            {active.extra && <KeyRow k="Special" v={active.extra} />}
            <div>
              <div className="mt-1 text-xs font-semibold">Clinical uses</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {active.uses.map((u) => <Chip key={u} tone="info">{u}</Chip>)}
              </div>
            </div>
            <Callout tone="warning" title="Cautions">
              <ul className="ml-4 list-disc">{active.cautions.map((c) => <li key={c}>{c}</li>)}</ul>
            </Callout>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                const t = [
                  `${active.name} (${active.klass})`,
                  `Half-life: ${active.halfLife}`,
                  `Equivalent dose: ${active.eqDose ?? "—"} mg  |  GC: ${active.gc}  |  MC: ${active.mc}`,
                  `Oral: ${active.po}`,
                  `IV: ${active.iv}`,
                  active.extra ? `Special: ${active.extra}` : "",
                  `Uses: ${active.uses.join(", ")}`,
                  `Cautions: ${active.cautions.join("; ")}`,
                  `Pregnancy: ${active.preg}`,
                ].filter(Boolean).join("\n");
                navigator.clipboard.writeText(t); toast.success("Copied");
              }}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1 h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Adverse effects, tapering & monitoring" icon={<ClipboardList className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <Callout tone="warning" title="Major adverse effects">
            <KeyRow k="Metabolic" v="Hyperglycemia, weight gain, dyslipidemia, ↑Na, ↓K" />
            <KeyRow k="GI" v="Gastritis, PUD, bleed, pancreatitis" />
            <KeyRow k="Endocrine" v="Adrenal suppression, Cushingoid, HPA suppression" />
            <KeyRow k="Immune" v="Infection risk, masked signs, ↓vaccine response" />
            <KeyRow k="MSK" v="Osteoporosis, myopathy, AVN hip" />
            <KeyRow k="Neuropsych" v="Mood, insomnia, psychosis, depression" />
            <KeyRow k="Eye" v="Cataract, glaucoma" />
            <KeyRow k="CV" v="HTN, fluid overload, edema" />
          </Callout>
          <Callout tone="info" title="Tapering">
            <div><b>Rule:</b> taper if &gt; 2–3 wk course or high dose.</div>
            <div><b>Rapid taper:</b> acute exacerbations &lt; 1 wk; short bursts.</div>
            <div><b>Slow taper:</b> chronic inflammatory/autoimmune; long-term high-dose.</div>
            <div className="mt-1"><b>Withdrawal syndrome:</b> fatigue, myalgia, arthralgia, nausea, ↓BP, headache.</div>
          </Callout>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-semibold">Monitoring parameters</div>
            <div className="flex flex-wrap gap-1">
              {["BP", "Blood glucose", "Weight/fluid", "Na, K", "Lipids", "Bone density", "Growth (kids)", "Mood"].map((m) => <Chip key={m}>{m}</Chip>)}
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold">Special populations</div>
            <KeyRow k="Children" v="Growth/HPA suppression; 0.5–2 mg/kg/d pred-eq" />
            <KeyRow k="Elderly" v="Osteoporosis, fracture, HTN, cognition" />
            <KeyRow k="Pregnancy" v="Pred/prednisolone preferred; budesonide/fluticasone inhaled" />
            <KeyRow k="Renal" v="Monitor BP, Na, K" />
            <KeyRow k="Hepatic" v="Avoid prednisone in severe; use methylpred" />
          </div>
        </div>
        <Callout tone="danger" title="Pearls">
          <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Right Drug · Right Dose · Right Duration · Right Route. Taper prolonged courses. Add Ca/Vit D + PPI + bone protection. Consider steroid-sparing agents in chronic disease.
          </div>
        </Callout>
      </SectionCard>
    </div>
  );
}

export default SteroidApp;
