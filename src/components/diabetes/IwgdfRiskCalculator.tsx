import { useState, useMemo } from "react";
import { ShieldCheck, RotateCcw, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type YesNoUnknown = "yes" | "no" | "unknown";

const riskFactors = [
  { id: "LOPS", shortLabel: "LOPS" },
  { id: "PAD", shortLabel: "PAD" },
  { id: "foot_deformity", shortLabel: "Deformity" },
  { id: "prior_foot_ulcer", shortLabel: "Ulcer" },
  { id: "prior_amputation", shortLabel: "Amputation" },
  { id: "ESRD", shortLabel: "ESRD" },
];

const riskCategories: Record<0|1|2|3, { label: string; description: string; frequency: string; tone: string }> = {
  0: { label: "Very low risk", description: "LOPS confirmed absent and PAD confirmed absent", frequency: "Once a year", tone: "bg-emerald-50 border-emerald-200" },
  1: { label: "Low risk", description: "LOPS or PAD present, without higher-risk features", frequency: "Every 6–12 months", tone: "bg-blue-50 border-blue-200" },
  2: { label: "Moderate risk", description: "LOPS + PAD, or LOPS/PAD + foot deformity", frequency: "Every 3–6 months", tone: "bg-amber-50 border-amber-200" },
  3: { label: "High risk", description: "LOPS or PAD + ulcer/amputation/ESRD", frequency: "Every 1–3 months", tone: "bg-red-50 border-red-200" },
};

function YesNoToggle({ label, value, onChange }: { label: string; value: YesNoUnknown; onChange: (v: YesNoUnknown) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-2">
        {(["yes", "no", "unknown"] as YesNoUnknown[]).map((opt) => (
          <Button key={opt} type="button" size="sm" variant={value === opt ? "default" : "outline"}
            className={`flex-1 text-xs ${value === opt ? (opt === "yes" ? "bg-emerald-600 hover:bg-emerald-700" : opt === "no" ? "bg-red-600 hover:bg-red-700" : "bg-slate-600 hover:bg-slate-700") : ""}`}
            onClick={() => onChange(opt)}>
            {opt === "yes" ? "Yes" : opt === "no" ? "No" : "?"}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function IwgdfRiskCalculator() {
  const [factors, setFactors] = useState<Record<string, YesNoUnknown>>({
    LOPS: "unknown", PAD: "unknown", foot_deformity: "unknown", prior_foot_ulcer: "unknown", prior_amputation: "unknown", ESRD: "unknown",
  });

  const updateFactor = (id: string, value: YesNoUnknown) => setFactors((prev) => ({ ...prev, [id]: value }));
  const reset = () => setFactors({ LOPS: "unknown", PAD: "unknown", foot_deformity: "unknown", prior_foot_ulcer: "unknown", prior_amputation: "unknown", ESRD: "unknown" });

  const result = useMemo(() => {
    const { LOPS, PAD, foot_deformity, prior_foot_ulcer, prior_amputation, ESRD } = factors;
    const hasUnknown = LOPS === "unknown" || PAD === "unknown";
    const hasMajorEvent = prior_foot_ulcer === "yes" || prior_amputation === "yes" || ESRD === "yes";
    if ((LOPS === "yes" || PAD === "yes") && hasMajorEvent) return { ...riskCategories[3], isFinal: true };
    const lopsPresent = LOPS === "yes", padPresent = PAD === "yes", deformityPresent = foot_deformity === "yes";
    if ((lopsPresent && padPresent) || (lopsPresent && deformityPresent) || (padPresent && deformityPresent)) return { ...riskCategories[2], isFinal: true };
    if (lopsPresent || padPresent) return { ...riskCategories[1], isFinal: true };
    if (LOPS === "no" && PAD === "no") return { ...riskCategories[0], isFinal: true };
    return { ...riskCategories[1], isFinal: false, label: "Assessment incomplete", description: hasUnknown ? "LOPS or PAD status is unknown" : "Complete all assessments", frequency: "—", tone: "bg-slate-50 border-slate-200" };
  }, [factors]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />IWGDF Risk Calculator</CardTitle>
        <p className="text-sm text-muted-foreground">Select risk factors to calculate IWGDF risk category and screening frequency</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {riskFactors.map((f) => <YesNoToggle key={f.id} label={f.shortLabel} value={factors[f.id]} onChange={(v) => updateFactor(f.id, v)} />)}
        </div>
        <div className={`rounded-lg border-2 p-4 ${result.tone}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Calculated Risk Level</div>
              <div className="mt-1 text-xl font-bold">{result.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{result.description}</div>
            </div>
            <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" />Reset</Button>
          </div>
          <div className="mt-4 pt-4 border-t border-black/10">
            <div className="text-xs font-medium uppercase text-muted-foreground">Recommended Screening Frequency</div>
            <div className="mt-1 text-lg font-semibold">{result.frequency}</div>
          </div>
        </div>
        <Alert variant="default" className="bg-muted/50"><Info className="h-4 w-4" /><AlertDescription className="text-xs"><strong>Classification safeguards:</strong> Palpable pulses alone do not exclude PAD. An elevated ABI alone does not establish PAD. Record unresolved PAD as unknown, not absent. Active ulcer/infection/Charcot needs prompt assessment.</AlertDescription></Alert>
      </CardContent>
    </Card>
  );
}
