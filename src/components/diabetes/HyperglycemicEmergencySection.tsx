import { useMemo, useState } from "react";
import { AlertTriangle, Copy, Printer, Download } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type Sev = "mild" | "moderate" | "severe" | "hhs" | null;

function classify(pH: number, hco3: number, glucose: number, mentation: string, osm: number): Sev {
  if (glucose >= 600 && osm >= 320 && (isNaN(pH) || pH > 7.3) && (isNaN(hco3) || hco3 > 18)) return "hhs";
  if (isFinite(pH)) {
    if (pH < 7.0 || hco3 < 10 || mentation === "stupor") return "severe";
    if (pH < 7.24 || hco3 < 15) return "moderate";
    if (pH < 7.30 || hco3 < 18) return "mild";
  }
  return null;
}

export default function HyperglycemicEmergencySection() {
  const [glu, setGlu] = useState("");
  const [pH, setPH] = useState("");
  const [hco3, setHco3] = useState("");
  const [na, setNa] = useState("");
  const [k, setK] = useState("");
  const [bun, setBun] = useState("");
  const [gap, setGap] = useState("");
  const [wt, setWt] = useState("70");
  const [mentation, setMentation] = useState("alert");
  const [sglt2, setSglt2] = useState(false);

  const g = parseFloat(glu);
  const pHn = parseFloat(pH);
  const hco3n = parseFloat(hco3);
  const nan = parseFloat(na);
  const kn = parseFloat(k);
  const bunn = parseFloat(bun);
  const wtn = parseFloat(wt);

  const corrNa = isFinite(nan) && isFinite(g) ? nan + 1.6 * ((g - 100) / 100) : NaN;
  const osm = isFinite(nan) && isFinite(g) && isFinite(bunn) ? 2 * nan + g / 18 + bunn / 2.8 : NaN;
  const anionGap = isFinite(parseFloat(gap)) ? parseFloat(gap) : (isFinite(nan) && isFinite(hco3n) ? nan - (100 + hco3n) : NaN);
  const sev = classify(pHn, hco3n, g, mentation, osm);

  const euglycemicDKA = sglt2 && isFinite(pHn) && pHn < 7.3 && isFinite(g) && g < 250;

  const insulinRate = isFinite(wtn) ? (0.1 * wtn).toFixed(1) : "—";
  const insulinBolusOptional = isFinite(wtn) ? (0.1 * wtn).toFixed(1) : "—";
  const kProtocol = useMemo(() => {
    if (!isFinite(kn)) return "Measure K before insulin";
    if (kn < 3.3) return "HOLD insulin. Give 20–40 mEq KCl/hr until K ≥ 3.3";
    if (kn < 5.2) return "Add 20–30 mEq KCl to each L IVF; goal K 4–5";
    return "No K replacement; recheck q2h";
  }, [kn]);

  const sevLabel: Record<string, { l: string; t: "warning" | "danger" | "info" }> = {
    mild: { l: "DKA — mild", t: "warning" },
    moderate: { l: "DKA — moderate", t: "warning" },
    severe: { l: "DKA — severe (ICU)", t: "danger" },
    hhs: { l: "HHS", t: "danger" },
  };

  const summary = `DKA/HHS Assessment
-----------------
Glucose: ${glu || "—"} mg/dL   pH: ${pH || "—"}   HCO3: ${hco3 || "—"}
Na: ${na || "—"}   K: ${k || "—"}   BUN: ${bun || "—"}   Weight: ${wt || "—"} kg
Corrected Na: ${isFinite(corrNa) ? corrNa.toFixed(1) : "—"}
Effective osmolality: ${isFinite(osm) ? osm.toFixed(0) : "—"} mOsm/kg
Anion gap: ${isFinite(anionGap) ? anionGap.toFixed(0) : "—"}
Classification: ${sev ? sevLabel[sev].l : "insufficient data"}
${euglycemicDKA ? "⚠ Euglycemic DKA pattern (SGLT2i)" : ""}

Plan
----
Fluids: 0.9% NaCl 15–20 mL/kg (${wtn ? Math.round(wtn * 15) : "—"}–${wtn ? Math.round(wtn * 20) : "—"} mL) bolus over 1 h,
then 250–500 mL/h; switch to 0.45% NaCl if corrected Na normal/high.
When glucose < 200 (DKA) / 300 (HHS): add D5 to IVF.
Insulin: 0.1 U/kg/h regular insulin infusion = ${insulinRate} U/h (± optional bolus 0.1 U/kg = ${insulinBolusOptional} U).
Potassium: ${kProtocol}
Bicarbonate: only if pH < 6.9 (100 mEq in 400 mL over 2 h).
Recheck glucose q1h, VBG + electrolytes q2–4h.
Resolution: pH > 7.3, HCO3 ≥ 18, anion gap ≤ 12, patient tolerating PO. Overlap SC insulin × 2 h before stopping infusion.`;

  const copy = () => { navigator.clipboard.writeText(summary); toast.success("Summary copied"); };
  const print = () => window.print();
  const download = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dka-hhs-summary.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="DKA / HHS management calculator"
        subtitle="ADA 2024 consensus + Umpierrez protocol"
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div><Label>Glucose (mg/dL)</Label><Input inputMode="decimal" value={glu} onChange={(e)=>setGlu(e.target.value)} placeholder="450" /></div>
          <div><Label>pH (VBG/ABG)</Label><Input inputMode="decimal" value={pH} onChange={(e)=>setPH(e.target.value)} placeholder="7.15" /></div>
          <div><Label>HCO₃ (mEq/L)</Label><Input inputMode="decimal" value={hco3} onChange={(e)=>setHco3(e.target.value)} placeholder="10" /></div>
          <div><Label>Anion gap (optional)</Label><Input inputMode="decimal" value={gap} onChange={(e)=>setGap(e.target.value)} placeholder="calc" /></div>
          <div><Label>Na (mEq/L)</Label><Input inputMode="decimal" value={na} onChange={(e)=>setNa(e.target.value)} placeholder="135" /></div>
          <div><Label>K (mEq/L)</Label><Input inputMode="decimal" value={k} onChange={(e)=>setK(e.target.value)} placeholder="4.5" /></div>
          <div><Label>BUN (mg/dL)</Label><Input inputMode="decimal" value={bun} onChange={(e)=>setBun(e.target.value)} placeholder="28" /></div>
          <div><Label>Weight (kg)</Label><Input inputMode="decimal" value={wt} onChange={(e)=>setWt(e.target.value)} /></div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Mentation</Label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={mentation} onChange={(e)=>setMentation(e.target.value)}>
              <option value="alert">Alert</option>
              <option value="drowsy">Drowsy</option>
              <option value="stupor">Stupor / coma</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Checkbox id="sglt2" checked={sglt2} onCheckedChange={(v) => setSglt2(!!v)} />
            <Label htmlFor="sglt2" className="cursor-pointer">On SGLT2 inhibitor</Label>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Stat label="Corrected Na" value={isFinite(corrNa) ? corrNa.toFixed(1) : "—"} hint="mEq/L (+1.6 per 100 mg/dL >100)" />
          <Stat label="Anion gap" value={isFinite(anionGap) ? anionGap.toFixed(0) : "—"} hint="Na − (Cl + HCO₃)" />
          <Stat label="Effective osm" value={isFinite(osm) ? osm.toFixed(0) : "—"} hint="mOsm/kg — HHS ≥ 320" />
          <div className="rounded-md border border-border bg-card p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Classification</div>
            <div className="mt-2">{sev ? <Pill tone={sevLabel[sev].t}>{sevLabel[sev].l}</Pill> : <span className="text-muted-foreground text-sm">— enter labs —</span>}</div>
          </div>
        </div>

        {euglycemicDKA && (
          <Callout tone="danger" title="Euglycemic DKA">
            SGLT2i-associated euglycemic DKA suspected: acidosis with glucose &lt; 250 mg/dL. Hold SGLT2i, check ketones,
            start IV fluids AND dextrose-containing fluids with insulin infusion (target BG 150–200) to clear ketones.
          </Callout>
        )}
      </SectionCard>

      <SectionCard title="Diagnostic criteria — DKA vs HHS" tone="info">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2"></th><th className="p-2">Mild DKA</th><th className="p-2">Moderate</th><th className="p-2">Severe</th><th className="p-2">HHS</th></tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr className="border-t border-border"><td className="p-2 font-sans font-medium">Glucose</td><td className="p-2">&gt;250</td><td className="p-2">&gt;250</td><td className="p-2">&gt;250</td><td className="p-2">&gt;600</td></tr>
              <tr className="border-t border-border"><td className="p-2 font-sans font-medium">pH</td><td className="p-2">7.25–7.30</td><td className="p-2">7.00–7.24</td><td className="p-2">&lt;7.00</td><td className="p-2">&gt;7.30</td></tr>
              <tr className="border-t border-border"><td className="p-2 font-sans font-medium">HCO₃</td><td className="p-2">15–18</td><td className="p-2">10–15</td><td className="p-2">&lt;10</td><td className="p-2">&gt;18</td></tr>
              <tr className="border-t border-border"><td className="p-2 font-sans font-medium">Ketones</td><td className="p-2">+</td><td className="p-2">+</td><td className="p-2">+</td><td className="p-2">small</td></tr>
              <tr className="border-t border-border"><td className="p-2 font-sans font-medium">Osm</td><td className="p-2">variable</td><td className="p-2">variable</td><td className="p-2">variable</td><td className="p-2">≥320</td></tr>
              <tr className="border-t border-border"><td className="p-2 font-sans font-medium">Mental status</td><td className="p-2">alert</td><td className="p-2">alert/drowsy</td><td className="p-2">stupor/coma</td><td className="p-2">stupor/coma</td></tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Management protocol">
        <ol className="list-decimal space-y-2 pl-5">
          <li><b>Fluids:</b> 0.9 % NaCl 15–20 mL/kg over 1 h, then 250–500 mL/h. Switch to 0.45 % NaCl if corrected Na normal/high. Add D5 when glucose &lt; 200 (DKA) or &lt; 300 (HHS).</li>
          <li><b>Insulin:</b> regular insulin infusion 0.1 U/kg/h (optional 0.1 U/kg bolus). Target glucose fall 50–75 mg/dL/h. If &lt;50 mg/dL fall in 1st hour, double rate.</li>
          <li><b>Potassium:</b> {kProtocol}. Always confirm urine output before K replacement.</li>
          <li><b>Bicarbonate:</b> only if pH &lt; 6.9 → 100 mEq NaHCO₃ + 20 mEq KCl in 400 mL water over 2 h; repeat until pH &gt; 7.0.</li>
          <li><b>Phosphate:</b> replace only if &lt; 1.0 mg/dL with cardiac/resp dysfunction.</li>
          <li><b>Transition:</b> when pH &gt; 7.3, HCO₃ ≥ 18, gap ≤ 12, patient eating — start SC basal + prandial and overlap IV insulin × 2 h.</li>
        </ol>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          <Stat label="Initial fluid bolus" value={isFinite(wtn) ? `${Math.round(wtn*15)}–${Math.round(wtn*20)} mL` : "—"} hint="15–20 mL/kg × 1 h" />
          <Stat label="Insulin infusion" value={`${insulinRate} U/h`} hint="0.1 U/kg/h regular" />
          <Stat label="Optional bolus" value={`${insulinBolusOptional} U`} hint="0.1 U/kg IV" />
        </div>
      </SectionCard>

      <SectionCard title="Trigger workup" tone="warning">
        <ul className="grid gap-1 pl-5 md:grid-cols-2 md:list-disc">
          <li>Infection (pneumonia, UTI, sepsis) — CBC, cultures, CXR, urinalysis</li>
          <li>Non-adherence / insulin pump failure</li>
          <li>New-onset T1DM</li>
          <li>MI / stroke — ECG, troponin</li>
          <li>Pancreatitis — lipase (may be spuriously ↑ in DKA)</li>
          <li>Drugs — steroids, atypical antipsychotics, cocaine, SGLT2i</li>
          <li>Pregnancy — always check β-hCG in reproductive-age women</li>
          <li>Endocrine — thyroid storm, Cushing's</li>
        </ul>
      </SectionCard>

      <SectionCard title="Red flags — escalate to ICU" tone="danger">
        <ul className="list-disc space-y-1 pl-5">
          <li>pH &lt; 7.0, HCO₃ &lt; 5, or K &lt; 3.3 or &gt; 6.5</li>
          <li>Altered mentation, GCS &lt; 12</li>
          <li>Hemodynamic instability, oliguria &lt; 0.5 mL/kg/h</li>
          <li>Cerebral edema signs (headache, bradycardia, HTN, focal deficits) — especially pediatric HHS</li>
          <li>Rhabdomyolysis, AKI, acute pancreatitis</li>
        </ul>
      </SectionCard>

      <SectionCard title="Assessment summary">
        <Textarea readOnly value={summary} className="min-h-64 font-mono text-xs" />
        <div className="mt-3 flex flex-wrap gap-2 no-print">
          <Button variant="outline" size="sm" onClick={copy}><Copy className="mr-1 h-4 w-4" />Copy</Button>
          <Button variant="outline" size="sm" onClick={print}><Printer className="mr-1 h-4 w-4" />Print</Button>
          <Button variant="outline" size="sm" onClick={download}><Download className="mr-1 h-4 w-4" />Download</Button>
        </div>
      </SectionCard>
    </div>
  );
}
