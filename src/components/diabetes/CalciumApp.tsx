import { useMemo, useState } from "react";
import { FlaskConical, Calculator, AlertTriangle, BookOpen, Activity } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ---------------- Position statement ---------------- */

function PositionStatement() {
  return (
    <SectionCard
      id="ca-position"
      title="Position: stop routine albumin-adjusted calcium"
      subtitle="Joint IOF WG · IFCC Committee on Bone Metabolism · EFLM CKD Committee"
      icon={<BookOpen className="h-5 w-5" />}
      tone="warning"
    >
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Total serum calcium comprises a protein-bound fraction (mainly albumin), a small anion-complexed
          fraction, and the biologically active <b>ionized calcium</b>. Ionized calcium is the preferred
          measurand but is not measured systematically, so laboratories rely mainly on total calcium.
        </p>
        <p>
          Because a substantial fraction is albumin-bound, total calcium shifts with albumin. Payne’s 1973
          equation and later formulas (e.g. Barth) tried to correct for this, but were derived from small
          non-renal cohorts and were never validated against ionized calcium.
        </p>
        <Callout tone="danger" title="Key finding — Alberta cohort (paired iCa/total Ca)">
          Unadjusted total calcium had the highest agreement with ionized calcium (<b>74.5%</b>). Agreement
          fell to <b>63.0%</b> with the original Payne formula and <b>58.7%</b> with the simplified Payne
          formula. Adjustment <i>increases</i> misclassification, especially in hypoalbuminemia.
        </Callout>
        <div className="grid gap-1">
          <KeyRow k="Default reported result" v="Total calcium (uncorrected)" />
          <KeyRow k="Preferred when decisions hinge on Ca" v="Ionized calcium (blood-gas analyser)" />
          <KeyRow k="Interpret iCa at" v="Patient’s actual pH — do NOT normalise to pH 7.40" />
          <KeyRow k="Analytical variation with albumin-adjustment" v="~3.6–4.7% (worse than total Ca alone)" mono />
        </div>
        <Callout tone="info" title="Why correction fails when you need it most">
          Correction assumes albumin is the dominant, stable determinant of the total↔ionized relationship.
          That assumption breaks precisely when albumin, pH, renal function, paraproteins or inflammation
          are altered — the exact settings where clinicians reach for a “corrected” value.
        </Callout>
      </div>
    </SectionCard>
  );
}

/* ---------------- Calculator ---------------- */

function CalciumCalculator() {
  const [totalCa, setTotalCa] = useState("");
  const [unit, setUnit] = useState<"mgdl" | "mmol">("mgdl");
  const [alb, setAlb] = useState("");
  const [albUnit, setAlbUnit] = useState<"gdl" | "gl">("gdl");
  const [iCa, setICa] = useState("");
  const [pH, setPH] = useState("");

  const tCa_mgdl = useMemo(() => {
    const v = parseFloat(totalCa);
    if (!isFinite(v)) return NaN;
    return unit === "mgdl" ? v : v * 4.008; // mmol/L → mg/dL
  }, [totalCa, unit]);

  const alb_gdl = useMemo(() => {
    const v = parseFloat(alb);
    if (!isFinite(v)) return NaN;
    return albUnit === "gdl" ? v : v / 10; // g/L → g/dL
  }, [alb, albUnit]);

  const payne = isFinite(tCa_mgdl) && isFinite(alb_gdl) ? tCa_mgdl + 0.8 * (4 - alb_gdl) : NaN;

  const iCaVal = parseFloat(iCa); // mmol/L
  const pHVal = parseFloat(pH);

  const totalStatus = useMemo(() => {
    if (!isFinite(tCa_mgdl)) return null;
    if (tCa_mgdl < 8.5) return { l: "Low total Ca", t: "danger" as const };
    if (tCa_mgdl > 10.5) return { l: "High total Ca", t: "danger" as const };
    return { l: "Total Ca within reference", t: "success" as const };
  }, [tCa_mgdl]);

  const iCaStatus = useMemo(() => {
    if (!isFinite(iCaVal)) return null;
    if (iCaVal < 1.15) return { l: "Ionized hypocalcemia", t: "danger" as const };
    if (iCaVal > 1.33) return { l: "Ionized hypercalcemia", t: "danger" as const };
    return { l: "Ionized Ca within reference", t: "success" as const };
  }, [iCaVal]);

  const discordant =
    totalStatus && iCaStatus &&
    ((totalStatus.t === "success" && iCaStatus.t === "danger") ||
      (totalStatus.t === "danger" && iCaStatus.t === "success"));

  return (
    <SectionCard
      id="ca-calc"
      title="Calcium interpreter"
      subtitle="Total vs Payne-adjusted vs ionized — see how they diverge"
      icon={<Calculator className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="tca">Total calcium</Label>
            <div className="flex gap-2">
              <Input id="tca" inputMode="decimal" value={totalCa} onChange={(e) => setTotalCa(e.target.value)} placeholder="9.2" />
              <Select value={unit} onValueChange={(v) => setUnit(v as "mgdl" | "mmol")}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mgdl">mg/dL</SelectItem>
                  <SelectItem value="mmol">mmol/L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="alb">Albumin</Label>
            <div className="flex gap-2">
              <Input id="alb" inputMode="decimal" value={alb} onChange={(e) => setAlb(e.target.value)} placeholder="4.0" />
              <Select value={albUnit} onValueChange={(v) => setAlbUnit(v as "gdl" | "gl")}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gdl">g/dL</SelectItem>
                  <SelectItem value="gl">g/L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="ica">Ionized Ca (mmol/L, optional)</Label>
            <Input id="ica" inputMode="decimal" value={iCa} onChange={(e) => setICa(e.target.value)} placeholder="1.20" />
          </div>
          <div>
            <Label htmlFor="pH">Sample pH (optional)</Label>
            <Input id="pH" inputMode="decimal" value={pH} onChange={(e) => setPH(e.target.value)} placeholder="7.38" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Total Ca" value={isFinite(tCa_mgdl) ? tCa_mgdl.toFixed(2) : "—"} hint="mg/dL (ref 8.5–10.5)" />
          <Stat label="Payne-adjusted" value={isFinite(payne) ? payne.toFixed(2) : "—"} hint="mg/dL — informational only" />
          <Stat label="Ionized Ca" value={isFinite(iCaVal) ? iCaVal.toFixed(2) : "—"} hint="mmol/L (ref 1.15–1.33)" />
        </div>

        <div className="flex flex-wrap gap-2">
          {totalStatus && <Pill tone={totalStatus.t}>{totalStatus.l}</Pill>}
          {iCaStatus && <Pill tone={iCaStatus.t}>{iCaStatus.l}</Pill>}
          {isFinite(pHVal) && (pHVal < 7.30 || pHVal > 7.45) && (
            <Pill tone="warning">pH {pHVal.toFixed(2)} — binding shifted; iCa preferred</Pill>
          )}
          {isFinite(alb_gdl) && alb_gdl < 3.0 && (
            <Pill tone="warning">Severe hypoalbuminemia — adjustment unreliable</Pill>
          )}
        </div>

        {discordant && (
          <Callout tone="danger" title="Total vs ionized are discordant">
            Trust the ionized value at the patient’s actual pH. Do not use Payne-adjusted calcium to
            override an ionized measurement. Consider paraproteins, citrate, acid–base disturbance, or
            pre-analytical error.
          </Callout>
        )}

        {isFinite(payne) && isFinite(tCa_mgdl) && Math.abs(payne - tCa_mgdl) >= 0.3 && (
          <Callout tone="warning" title="Payne shifts the result meaningfully">
            Payne = <b>{payne.toFixed(2)}</b> vs total = <b>{tCa_mgdl.toFixed(2)}</b> mg/dL. Correction can
            normalise true hypocalcemia and generate spurious hypercalcemia. Order ionized Ca before
            acting on the adjusted value.
          </Callout>
        )}

        <Callout tone="info" title="Reference intervals used">
          Total Ca 8.5–10.5 mg/dL (2.12–2.62 mmol/L). Ionized Ca 1.15–1.33 mmol/L (4.6–5.3 mg/dL).
          Local method-specific ranges may differ.
        </Callout>
      </div>
    </SectionCard>
  );
}

/* ---------------- When to order ionized Ca ---------------- */

function IonizedIndications() {
  const rows: [string, string][] = [
    ["Advanced CKD / haemodialysis", "Small Ca changes drive dialysate, vitamin D, calcimimetic and binder decisions. Payne’s original cohort excluded renal patients."],
    ["Severe hypo- or hyperalbuminemia", "Albumin adjustment is least reliable at the extremes of albumin."],
    ["Acid–base disturbance (ICU, DKA, sepsis)", "pH shifts Ca–protein binding; a formula that adjusts only for albumin cannot restore the total↔ionized relationship."],
    ["Multiple myeloma / paraproteinemia", "Paraproteins bind calcium; albumin-only correction misses ionized hypercalcemia and can be falsely reassuring."],
    ["Chronic hypoparathyroidism", "Total Ca cut-offs predict iCa status well (Épi-Hypo cohort); reserve iCa for borderline or discordant results."],
    ["Massive transfusion / citrate load", "Citrate chelates ionized Ca while total may look normal."],
    ["Peri-operative parathyroid / thyroid surgery", "Post-op hypocalcemia decisions depend on the active fraction."],
    ["Neonatal / pregnancy calcium disorders", "Albumin and binding dynamics differ; iCa is more reliable."],
  ];
  return (
    <SectionCard
      id="ca-ionized"
      title="When to order ionized calcium first"
      subtitle="Situations where total (and adjusted) calcium is unreliable"
      icon={<Activity className="h-5 w-5" />}
      tone="info"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-2">Setting</th><th className="p-2">Why</th></tr>
          </thead>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-border align-top">
                <td className="p-2 font-medium">{k}</td>
                <td className="p-2 text-muted-foreground">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout tone="warning" title="Pre-analytical requirements for ionized Ca">
        Balanced or low-concentration heparin syringe, minimal air exposure, no tourniquet stasis, rapid
        transport on ice, analysis within ~30 min. Report at the patient’s actual pH — never normalised
        to pH 7.40.
      </Callout>
    </SectionCard>
  );
}

/* ---------------- Pitfalls ---------------- */

function CorrectionPitfalls() {
  const rows: [string, string, string][] = [
    ["Hypoalbuminemia (cirrhosis, nephrotic, ICU)", "Payne raises the value → may normalise true hypocalcemia", "Order ionized Ca; do not rely on adjustment"],
    ["Alkalosis (hyperventilation, vomiting)", "↑ Ca–albumin binding → ↓ iCa despite normal total", "Measure iCa at actual pH"],
    ["Acidosis (DKA, sepsis, CKD)", "↓ binding → ↑ iCa relative to total", "Measure iCa at actual pH"],
    ["Multiple myeloma", "Paraprotein binds Ca; albumin adjustment misses it", "Always use iCa when suspecting Ca abnormality"],
    ["Haemodialysis / advanced CKD", "Poor agreement between corrected and iCa; hidden abnormalities with prognostic impact", "iCa first-line per KDIGO"],
    ["Bromocresol green albumin assay", "Overestimates albumin vs BCP / immunoassay → inflates the Payne adjustment", "Method- & population-specific recalibration required"],
    ["Citrate anticoagulation, massive transfusion", "iCa falls while total Ca appears preserved", "Serial iCa"],
  ];
  return (
    <SectionCard
      id="ca-pitfalls"
      title="Where albumin correction misleads"
      icon={<AlertTriangle className="h-5 w-5" />}
      tone="danger"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Scenario</th>
              <th className="p-2">Effect of Payne / adjustment</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b, c]) => (
              <tr key={a} className="border-t border-border align-top">
                <td className="p-2 font-medium">{a}</td>
                <td className="p-2 text-muted-foreground">{b}</td>
                <td className="p-2">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/* ---------------- References ---------------- */

function References() {
  const refs = [
    "Payne RB et al. Interpretation of serum calcium in patients with abnormal serum proteins. BMJ 1973.",
    "Barth JH et al. Comparison of methods of adjusting serum calcium for albumin. Ann Clin Biochem.",
    "UK Biobank reference-interval work on albumin-adjusted calcium.",
    "Alberta cohort — paired ionized vs total Ca: unadjusted 74.5%, Payne 63.0%, simplified Payne 58.7% agreement.",
    "KDIGO CKD-MBD update: albumin-adjusted equations do not accurately estimate iCa; investigate hypocalcemia.",
    "Épi-Hypo cohort (French chronic hypoparathyroidism, n=1,215 paired samples).",
    "Buege MJ et al. Corrected calcium unreliable for iCa-defined hypercalcemia in multiple myeloma.",
  ];
  return (
    <SectionCard id="ca-refs" title="References" defaultOpen={false}>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        {refs.map((r) => <li key={r}>{r}</li>)}
      </ol>
    </SectionCard>
  );
}

/* ---------------- Root ---------------- */

export default function CalciumApp() {
  return (
    <div className="space-y-5">
      <SectionCard
        id="ca-intro"
        title="Calcium measurements"
        subtitle="Total vs ionized vs albumin-adjusted — a clinician’s guide"
        icon={<FlaskConical className="h-5 w-5" />}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Calcium is tightly regulated and essential for neuromuscular excitability, coagulation,
          signalling and mineralization. This mini-app summarises the current position of the joint
          IOF / IFCC / EFLM working groups: default to <b>total calcium</b>, use <b>ionized calcium</b>
          up-front when decisions depend on calcium status, and <b>stop routine reporting of
          albumin-adjusted (“corrected”) calcium</b>.
        </p>
      </SectionCard>

      <PositionStatement />
      <CalciumCalculator />
      <IonizedIndications />
      <CorrectionPitfalls />
      <References />
    </div>
  );
}
