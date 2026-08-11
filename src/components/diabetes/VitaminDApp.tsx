import { lazy } from "react";
import vitaminDAsset from "@/assets/VitaminD_Protocol.png.asset.json";
import { ExportBar } from "./shared";

const ImageViewer = lazy(() => import("@/components/ImageViewer"));

export default function VitaminDApp() {
  return (
    <div className="space-y-6">
      <div className="clinical-card p-6">
        <h2 className="mb-4 font-display text-xl font-bold sunset-text">Adult Vitamin D Deficiency Correction</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Treatment and monitoring protocol for adult Vitamin D deficiency. 
          Use the protocol for loading, maintenance, and monitoring based on 25(OH)D levels.
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
          </ul>
        </div>
      </div>

      <ExportBar 
        title="Adult Vitamin D Deficiency Protocol"
        content="Vitamin D deficiency correction protocol based on 25(OH)D ranges: <10 ng/mL (Severe), 10-19.9 ng/mL (Deficiency), 20-29.9 ng/mL (Insufficiency), and >=30 ng/mL (Sufficient)."
      />
    </div>
  );
}
