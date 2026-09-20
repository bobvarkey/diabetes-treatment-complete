import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Callout, KeyRow, Pill, SectionCard, Stat } from "./shared";
import FraxDecisionFlow from "./FraxDecisionFlow";
import OsteoporosisClinicalRiskOverlay from "./OsteoporosisClinicalRiskOverlay";
import { estimateFrax, type Sex } from "./fraxEstimate";

/**
 * Standalone FRAX calculator. Kept separate from the osteoporosis v2.0
 * risk/treatment algorithm — that screen consumes only a threshold comparison.
 */
export default function FraxApp() {
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("female");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [fnT, setFnT] = useState("");
  const [useBmd, setUseBmd] = useState(true);
  const [prevFx, setPrevFx] = useState(false);
  const [parentHip, setParentHip] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [gc, setGc] = useState(false);
  const [ra, setRa] = useState(false);
  const [secondary, setSecondary] = useState(false);
  const [alcohol, setAlcohol] = useState(false);

  const ageN = parseFloat(age);
  const ready = Number.isFinite(ageN) && ageN >= 40 && ageN <= 90;
  const tN = parseFloat(fnT);

  const result = useMemo(() => {
    if (!ready) return null;
    return estimateFrax({
      age: ageN,
      sex,
      weightKg: parseFloat(weight),
      heightCm: parseFloat(height),
      previousFracture: prevFx,
      parentHipFracture: parentHip,
      currentSmoking: smoking,
      glucocorticoids: gc,
      rheumatoidArthritis: ra,
      secondaryOsteoporosis: secondary,
      alcohol3OrMore: alcohol,
      femoralNeckTScore: useBmd && Number.isFinite(tN) ? tN : null,
    });
  }, [ready, ageN, sex, weight, height, prevFx, parentHip, smoking, gc, ra, secondary, alcohol, useBmd, tN]);

  return (
    <div className="space-y-4">
      <SectionCard
        id="frax-overview"
        title="FRAX calculator"
        subtitle="Country-appropriate 10-year fracture probability — separate from the osteoporosis treatment algorithm"
        icon={<Calculator className="h-4 w-4" />}
        defaultOpen
      >
        <Callout tone="info" title="Kept separate on purpose">
          Use this tool to obtain or estimate a FRAX result. Then open the Osteoporosis sidebar item and record only
          whether that result is above the applicable national treatment threshold. The osteoporosis algorithm does
          not fold FRAX inputs into risk classification and does not invent FRAX multipliers.
        </Callout>
        <p className="text-sm text-muted-foreground">
          Official FRAX is proprietary and country-calibrated. Confirm probabilities with the official tool before
          clinical decisions. Thresholds vary by guideline (for example NOF/BHOF vs age-dependent NOGG/IOF-ESCEO).
        </p>
      </SectionCard>

      <SectionCard
        id="frax-decision"
        title="FRAX decision flow"
        subtitle="Enter official or locally calculated 10-year probabilities and clinical flags"
        icon={<Calculator className="h-4 w-4" />}
        defaultOpen
      >
        <FraxDecisionFlow />
      </SectionCard>

      <SectionCard
        id="frax-estimate"
        title="In-app FRAX-style estimate"
        subtitle="Approximate triage only — not a validated country-calibrated probability"
        icon={<Info className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="Age (40–90 y)">
            <Input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label="Sex">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>
          <Field label="Weight (kg)">
            <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
          <Field label="Height (cm)">
            <Input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
          </Field>
          <Field label="Femoral-neck T-score">
            <Input inputMode="decimal" value={fnT} onChange={(e) => setFnT(e.target.value)} />
          </Field>
          <label className="flex items-end gap-2 text-sm">
            <Checkbox checked={useBmd} onCheckedChange={(v) => setUseBmd(!!v)} />
            <span>Include BMD in estimate</span>
          </label>
        </div>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          <Flag checked={prevFx} onChange={setPrevFx} label="Previous fragility fracture" />
          <Flag checked={parentHip} onChange={setParentHip} label="Parent fractured hip" />
          <Flag checked={smoking} onChange={setSmoking} label="Current smoking" />
          <Flag checked={gc} onChange={setGc} label="Glucocorticoids (≥5 mg/d ≥3 mo)" />
          <Flag checked={ra} onChange={setRa} label="Rheumatoid arthritis" />
          <Flag checked={secondary} onChange={setSecondary} label="Secondary osteoporosis" />
          <Flag checked={alcohol} onChange={setAlcohol} label="Alcohol ≥ 3 units/day" />
        </div>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">Enter an age between 40 and 90 years to estimate.</p>
        ) : result ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={result.category === "very high" || result.category === "high" ? "danger" : "info"}>
                Estimated {result.category} risk
              </Pill>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Major osteoporotic" value={`${result.major}%`} hint="10-year estimate" />
              <Stat label="Hip fracture" value={`${result.hip}%`} hint="10-year estimate" />
              <Stat label="BMI" value={result.bmi != null ? result.bmi.toFixed(1) : "—"} hint={result.usedBmd ? "Femoral-neck BMD included" : "BMD not included"} />
            </div>
            <ul className="list-disc pl-5 text-xs text-muted-foreground">
              {result.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <KeyRow
              k="Next"
              v="Compare this (or the official FRAX result) with the applicable national treatment threshold, then record yes/no on the Osteoporosis algorithm screen."
            />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        id="frax-clinical-overlay"
        title="FRAX + clinical flags"
        subtitle="Keep the numerical probability separate from fracture-history and falls flags"
        icon={<Info className="h-4 w-4" />}
        defaultOpen={false}
      >
        <OsteoporosisClinicalRiskOverlay />
      </SectionCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Flag({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}
