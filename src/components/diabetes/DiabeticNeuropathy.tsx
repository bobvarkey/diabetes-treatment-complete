import { useRef } from "react";
import { ExportBar } from "./shared";
import { IwgdfRiskScreening, UlcerGradingFigures } from "./FootUlcerGuidance";

export default function DiabeticNeuropathy() {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Diabetic Neuropathy</h2>
          <p className="text-sm text-muted-foreground">
            IWGDF foot-risk screening, Wagner ulcer grading, and WIfI limb-threat classification
          </p>
        </div>
        <ExportBar title="Diabetic Neuropathy" getNode={() => contentRef.current} />
      </div>

      <div ref={contentRef} className="space-y-4">
        <IwgdfRiskScreening />
        <UlcerGradingFigures />
      </div>
    </div>
  );
}
