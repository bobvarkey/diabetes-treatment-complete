import { useMemo, useState } from "react";
import { Scan, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { SectionCard, Callout, KeyRow, Pill } from "./shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Sex = "female" | "male" | "";

interface DexaIntake {
  sex: Sex;
  age: string;
  postmenopausal: boolean;
  menopausalTransition: boolean;
  discontinuingEstrogen: boolean;
  lowBodyWeight: boolean;
  priorFracture: boolean;
  highRiskMedication: boolean;
  boneLossCondition: boolean;
  consideringTherapy: boolean;
  onTherapy: boolean;
  boneLossWouldChangeManagement: boolean;
}

const INITIAL: DexaIntake = {
  sex: "",
  age: "",
  postmenopausal: false,
  menopausalTransition: false,
  discontinuingEstrogen: false,
  lowBodyWeight: false,
  priorFracture: false,
  highRiskMedication: false,
  boneLossCondition: false,
  consideringTherapy: false,
  onTherapy: false,
  boneLossWouldChangeManagement: false,
};

function evaluateDexa(intake: DexaIntake): { indicated: boolean; reasons: string[] } | null {
  const age = parseFloat(intake.age);
  const hasAge = !isNaN(age);
  if (!intake.sex && !hasAge) return null;

  const reasons: string[] = [];
  const hasRiskFactor = intake.lowBodyWeight || intake.priorFracture || intake.highRiskMedication || intake.boneLossCondition;
  const hasClinicalRiskFactor = intake.lowBodyWeight || intake.priorFracture || intake.highRiskMedication;

  if (intake.sex === "female" && hasAge && age >= 65) {
    reasons.push("All women aged 65 years or older");
  }
  if (intake.sex === "male" && hasAge && age >= 70) {
    reasons.push("All men aged 70 years or older");
  }
  if (intake.sex === "female" && intake.postmenopausal && hasAge && age < 65 && hasRiskFactor) {
    reasons.push("Postmenopausal woman under 65 with risk factor for low bone mass");
  }
  if (intake.sex === "female" && intake.menopausalTransition && hasClinicalRiskFactor) {
    reasons.push("Woman during menopausal transition with clinical fracture risk factor");
  }
  if (intake.sex === "female" && intake.discontinuingEstrogen && hasRiskFactor) {
    reasons.push("Discontinuing estrogen with a standard indication for BMD testing");
  }
  if (intake.sex === "male" && hasAge && age < 70 && hasRiskFactor) {
    reasons.push("Man under 70 with risk factor for low bone mass");
  }
  if (intake.priorFracture) {
    reasons.push("Fragility fracture");
  }
  if (intake.boneLossCondition) {
    reasons.push("Disease or condition associated with low bone mass or bone loss");
  }
  if (intake.highRiskMedication) {
    reasons.push("Medication associated with low bone mass or bone loss");
  }
  if (intake.consideringTherapy) {
    reasons.push("Being considered for pharmacologic osteoporosis therapy");
  }
  if (intake.onTherapy) {
    reasons.push("Currently receiving pharmacologic osteoporosis therapy (monitor treatment effect)");
  }
  if (intake.boneLossWouldChangeManagement) {
    reasons.push("Demonstration of bone loss would alter management");
  }

  return { indicated: reasons.length > 0, reasons };
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <Button
        type="button"
        size="sm"
        variant={checked ? "default" : "outline"}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
      >
        {checked ? "Yes" : "No"}
      </Button>
    </div>
  );
}

export default function DexaScanApp() {
  const [intake, setIntake] = useState<DexaIntake>(INITIAL);
  const set = <K extends keyof DexaIntake>(key: K, value: DexaIntake[K]) =>
    setIntake((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(() => evaluateDexa(intake), [intake]);

  return (
    <div className="space-y-4">
      <SectionCard
        id="dexa-indication-checker"
        title="DXA indication checker"
        subtitle="Who should have BMD testing? (ISCD-style indications)"
        icon={<Scan className="h-5 w-5" />}
        defaultOpen
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Sex</Label>
                <div className="flex gap-2">
                  {(["female", "male"] as const).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant={intake.sex === s ? "default" : "outline"}
                      onClick={() => set("sex", s)}
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dexa-age">Age (years)</Label>
                <input
                  id="dexa-age"
                  type="number"
                  min={0}
                  value={intake.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="e.g. 68"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {intake.sex === "female" && (
              <div className="space-y-2">
                <ToggleRow
                  label="Postmenopausal"
                  checked={intake.postmenopausal}
                  onChange={(v) => set("postmenopausal", v)}
                />
                <ToggleRow
                  label="In menopausal transition"
                  checked={intake.menopausalTransition}
                  onChange={(v) => set("menopausalTransition", v)}
                />
                <ToggleRow
                  label="Discontinuing estrogen"
                  checked={intake.discontinuingEstrogen}
                  onChange={(v) => set("discontinuingEstrogen", v)}
                />
              </div>
            )}

            <div className="space-y-2">
              <ToggleRow
                label="Low body weight"
                checked={intake.lowBodyWeight}
                onChange={(v) => set("lowBodyWeight", v)}
              />
              <ToggleRow
                label="Prior fragility fracture"
                checked={intake.priorFracture}
                onChange={(v) => set("priorFracture", v)}
              />
              <ToggleRow
                label="High-risk medication use (e.g. glucocorticoids)"
                checked={intake.highRiskMedication}
                onChange={(v) => set("highRiskMedication", v)}
              />
              <ToggleRow
                label="Disease/condition associated with bone loss"
                checked={intake.boneLossCondition}
                onChange={(v) => set("boneLossCondition", v)}
              />
              <ToggleRow
                label="Being considered for osteoporosis therapy"
                checked={intake.consideringTherapy}
                onChange={(v) => set("consideringTherapy", v)}
              />
              <ToggleRow
                label="Currently on osteoporosis therapy (monitoring)"
                checked={intake.onTherapy}
                onChange={(v) => set("onTherapy", v)}
              />
              <ToggleRow
                label="Finding bone loss would change management"
                checked={intake.boneLossWouldChangeManagement}
                onChange={(v) => set("boneLossWouldChangeManagement", v)}
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIntake(INITIAL)}
              className="text-muted-foreground"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>

          <div className="flex flex-col justify-center">
            {!result ? (
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                <Scan className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Enter sex and age, then tick any applicable risk factors to see whether DXA is indicated.
                </p>
              </div>
            ) : result.indicated ? (
              <div className="space-y-3 rounded-lg border border-success/30 bg-success/5 p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <h3 className="text-lg font-bold">DXA/BMD testing indicated</h3>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {result.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-bold">No current indication</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  No current indication for routine DXA/BMD testing based on the listed criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="dexa-indications-reference"
        title="DXA indications reference"
        subtitle="Dual-energy X-ray Absorptiometry — bone mineral density assessment"
        icon={<Scan className="h-5 w-5" />}
        defaultOpen={false}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Pill tone="primary">Women</Pill>
            <div className="space-y-2">
              <KeyRow k="Age ≥ 65" v="DXA indicated for all women" />
              <KeyRow
                k="Postmenopausal < 65"
                v="DXA if risk factors: low body weight, prior fracture, high-risk medication, or disease/condition associated with bone loss"
              />
              <KeyRow
                k="Menopausal transition"
                v="DXA if clinical fracture risk factors: low body weight, prior fracture, high-risk medication"
              />
              <KeyRow
                k="Discontinuing estrogen"
                v="Consider DXA if any standard indication for BMD testing is present"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Pill tone="primary">Men</Pill>
            <div className="space-y-2">
              <KeyRow k="Age ≥ 70" v="DXA indicated for all men" />
              <KeyRow
                k="Age < 70"
                v="DXA if risk factors: low body weight, prior fracture, high-risk medication, or disease/condition associated with bone loss"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Pill tone="primary">All adults</Pill>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Fragility fracture</li>
            <li>Disease or condition associated with low bone mass or bone loss</li>
            <li>Medication associated with low bone mass or bone loss</li>
            <li>Being considered for pharmacologic osteoporosis therapy</li>
            <li>Currently receiving pharmacologic osteoporosis therapy — to monitor treatment effect</li>
            <li>Not on therapy, but demonstration of bone loss would alter management</li>
          </ul>
        </div>

        <Callout tone="info" title="Interpreting the result">
          A T-score ≤ −2.5 at an accepted site establishes densitometric osteoporosis in
          postmenopausal women and men ≥ 50. DXA is not required to diagnose osteoporosis after a
          confirmed fragility hip or vertebral fracture — those patients generally warrant treatment
          regardless of the DXA result.
        </Callout>
      </SectionCard>
    </div>
  );
}
