import { useState } from "react";
import { Archive, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import OsteoporosisFourGateApp from "./OsteoporosisFourGateApp";
import OsteoporosisLegacyApp from "./OsteoporosisLegacyApp";

export type { PatientInput } from "./OsteoporosisLegacyApp";

export default function OsteoporosisApp() {
  const [showClinicalSuite, setShowClinicalSuite] = useState(false);

  return (
    <div className="min-w-0 space-y-6">
      <OsteoporosisFourGateApp />

      <section className="min-w-0 border-t border-border pt-5" aria-labelledby="preserved-suite-heading">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="preserved-suite-heading" className="flex items-center gap-2 text-lg font-semibold">
              <Archive className="h-4 w-4 shrink-0" aria-hidden />
              Preserved clinical tools and detailed record
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Existing fracture history, secondary-cause qualifiers, CKD and frailty details, protocols,
              treatment plans, images, and report tools remain available here.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowClinicalSuite((open) => !open)}
            aria-expanded={showClinicalSuite}
            aria-controls="preserved-osteoporosis-suite"
          >
            {showClinicalSuite ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
            {showClinicalSuite ? "Hide clinical suite" : "Open clinical suite"}
          </Button>
        </div>
        {showClinicalSuite ? (
          <div id="preserved-osteoporosis-suite" className="mt-5 min-w-0">
            <OsteoporosisLegacyApp />
          </div>
        ) : null}
      </section>
    </div>
  );
}
