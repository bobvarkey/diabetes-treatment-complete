import { useState, useEffect } from "react";
import vitaminDAsset from "@/assets/VitaminD_Protocol.png.asset.json";
import { SectionCard, Callout, Stat, KeyRow } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VitaminDApp() {
  const [level, setLevel] = useState<string>("");
  const [calcium, setCalcium] = useState<string>("");
  const [phosphate, setPhosphate] = useState<string>("");
  const [pth, setPth] = useState<string>("");
  const [egfr, setEgfr] = useState<string>("");
  const [vitD125, setVitD125] = useState<string>("");

  const numLevel = parseFloat(level);
  const numEgfr = parseFloat(egfr);

  const getVerdict = () => {
    if (isNaN(numLevel)) return null;
    
    let severity = "";
    let repletion = "";
    let maintenance = "800 – 2000 IU daily (20 – 50 μg)";
    let monitoring = "Check 25(OH)D and Serum Calcium at 3 months.";
    let tone: "success" | "warning" | "danger" | "info" = "info";

    if (numLevel < 30) {
      severity = "Deficiency";
      repletion = "Loading dose: 300,000 IU total (e.g., 50,000 IU weekly for 6 weeks)";
      tone = "danger";
    } else if (numLevel >= 30 && numLevel < 50) {
      severity = "Insufficiency";
      repletion = "Repletion: 100,000 – 150,000 IU total (e.g., 20,000 IU weekly for 5–7 weeks)";
      tone = "warning";
    } else if (numLevel >= 50) {
      severity = "Sufficient";
      repletion = "No loading required.";
      tone = "success";
    }

    if (!isNaN(numEgfr) && numEgfr < 30) {
      maintenance = "Consult specialist. Consider active Vitamin D (Calcitriol/Alfacalcidol) due to impaired hydroxylation.";
      monitoring = "Frequent monitoring of Calcium, Phosphate, and PTH required (CKD-MBD).";
    }

    return { severity, repletion, maintenance, monitoring, tone };
  };

  const verdict = getVerdict();

  const handleCopy = () => {
    if (!verdict) return;
    const text = `Vitamin D Assessment:
25(OH)D: ${level} nmol/L (${verdict.severity})
eGFR: ${egfr || 'N/A'} mL/min
Repletion: ${verdict.repletion}
Maintenance: ${verdict.maintenance}
Monitoring: ${verdict.monitoring}`;
    navigator.clipboard.writeText(text);
    toast.success("Recommendations copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Vitamin D Assessment & Dosing" id="vit-d-calculator">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vitd-level">25(OH)D (nmol/L)</Label>
                <Input
                  id="vitd-level"
                  type="number"
                  placeholder="e.g. 25"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="egfr">eGFR (mL/min/1.73m²)</Label>
                <Input
                  id="egfr"
                  type="number"
                  placeholder="e.g. 45"
                  value={egfr}
                  onChange={(e) => setEgfr(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ca">Serum Calcium (mmol/L)</Label>
                <Input
                  id="ca"
                  type="number"
                  step="0.01"
                  value={calcium}
                  onChange={(e) => setCalcium(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phos">Phosphate (mmol/L)</Label>
                <Input
                  id="phos"
                  type="number"
                  step="0.01"
                  value={phosphate}
                  onChange={(e) => setPhosphate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pth">PTH (pmol/L)</Label>
                <Input
                  id="pth"
                  type="number"
                  value={pth}
                  onChange={(e) => setPth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vitd-125">1,25(OH)2D (pmol/L)</Label>
                <Input
                  id="vitd-125"
                  type="number"
                  value={vitD125}
                  onChange={(e) => setVitD125(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {verdict ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <Stat label="Status" value={verdict.severity} />
                <div className="mt-4 space-y-3">
                  <KeyRow k="Repletion Strategy" v={verdict.repletion} />
                  <KeyRow k="Maintenance Plan" v={verdict.maintenance} />
                  <Callout tone={verdict.tone} title="Monitoring Recommendation">
                    {verdict.monitoring}
                  </Callout>
                </div>
                <div className="mt-6 flex gap-2 no-print">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                Enter 25(OH)D level to calculate dosing
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Adult Vitamin D Deficiency Correction Protocol" id="vit-d-correction">
        <p className="mb-6 text-sm text-muted-foreground">
          Reference treatment and monitoring protocol for adult Vitamin D deficiency.
        </p>

        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
          <img 
            src={vitaminDAsset.url} 
            alt="Adult Vitamin D Deficiency: Treatment & Monitoring Protocol" 
            className="w-full object-contain"
          />
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="font-display font-semibold text-foreground">Safety Rules & Monitoring</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Never repeat loading/high-dose course without rechecking 25(OH)D/calcium.</li>
            <li>Avoid oral + injectable high-dose combinations.</li>
            <li>Watch for hypercalcemia signs: nausea, vomiting, polyuria, confusion.</li>
            <li>Use daily doses (800-1000 IU) rather than intermittent large doses in older frail adults.</li>
            <li>Retest 25(OH)D and serum calcium at 8-12 weeks based on initial classification.</li>
            <li>In severe deficiency (&lt;25 nmol/L), check PTH/Calcium/Phosphate to rule out secondary hyperparathyroidism or osteomalacia.</li>
          </ul>
        </div>
      </SectionCard>
    </div>
  );
}
