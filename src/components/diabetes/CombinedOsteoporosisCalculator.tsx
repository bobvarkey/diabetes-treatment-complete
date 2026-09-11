import * as React from "react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Callout, KeyRow } from "./shared";
import { decideFrax, type FraxDecision } from "./FraxDecisionFlow";
import type { PatientInput } from "./OsteoporosisApp";

interface Props {
  input: PatientInput;
}

function daysBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function deriveFlags(input: PatientInput) {
  const confirmed = input.fractureHistory.filter((f) => f.fragilityFracture === "yes");
  const priorHipOrVertebral =
    input.fragilityFractureType === "hip" ||
    input.fragilityFractureType === "vertebral" ||
    confirmed.some(
      (f) => f.site === "hip" || (f.site === "vertebral" && f.vertebralPresentation === "clinical")
    );
  const multipleFractures = confirmed.length >= 2;

  const today = new Date().toISOString().split("T")[0];
  const recentFracture = confirmed.some((f) => {
    if (!f.date) return false;
    const d = daysBetween(f.date, today);
    return d !== null && d <= 730; // 24 months
  });

  const pred = parseFloat(input.prednisoneEquivalentMgPerDay);
  const glucocorticoid =
    (!isNaN(pred) && pred >= 7.5) ||
    input.secondaryCauseFlags.includes("Chronic glucocorticoids");

  const fallsHighRisk =
    input.clinicianIdentifiedHighFallsRisk === "yes" ||
    input.injuriousFallInPast12Months === "yes" ||
    (typeof input.fallsInPast12Months === "number" && input.fallsInPast12Months > 1);

  return {
    priorHipOrVertebral,
    multipleFractures,
    recentFracture,
    glucocorticoid,
    fallsHighRisk,
  };
}

export default function CombinedOsteoporosisCalculator({ input }: Props) {
  const major = parseFloat(input.fraxMajorPercent);
  const hip = parseFloat(input.fraxHipPercent);
  const tScore = parseFloat(input.femoralNeckTScore);
  const flags = useMemo(() => deriveFlags(input), [input]);

  const decision = useMemo(() => {
    if (!isFinite(major) && !isFinite(hip) && !isFinite(tScore) && !Object.values(flags).some(Boolean)) {
      return null;
    }
    return decideFrax({
      fraxMajor: isFinite(major) ? major : NaN,
      fraxHip: isFinite(hip) ? hip : NaN,
      tScore: isFinite(tScore) ? tScore : NaN,
      flags,
    });
  }, [major, hip, tScore, flags]);

  if (!decision) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Combined FRAX + clinical risk calculator</CardTitle>
          <CardDescription>
            Enter FRAX probabilities, T-score or clinical flags in the intake above to generate a combined treatment recommendation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tone =
    decision.tone === "success"
      ? "success"
      : decision.tone === "warning"
      ? "warning"
      : decision.tone === "danger"
      ? "danger"
      : "info";

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-lg">Combined FRAX + clinical risk calculator</CardTitle>
            <CardDescription>
              Single calculator using intake FRAX, T-score and derived clinical flags.
            </CardDescription>
          </div>
          <Pill tone={tone}>{decision.tag}</Pill>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isFinite(major) && (
            <Badge variant={major >= 20 ? "destructive" : "secondary"}>Major {major}% · threshold 20%</Badge>
          )}
          {isFinite(hip) && (
            <Badge variant={hip >= 3 ? "destructive" : "secondary"}>Hip {hip}% · threshold 3%</Badge>
          )}
          {isFinite(tScore) && (
            <Badge variant={tScore <= -2.5 ? "destructive" : tScore <= -1 ? "default" : "secondary"}>T {tScore.toFixed(1)}</Badge>
          )}
        </div>

        <Callout tone={tone} title={decision.tag}>
          {decision.summary}
        </Callout>

        {decision.drivers.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold">Why this tier</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {decision.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {decision.next.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold">Next steps</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {decision.next.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm space-y-1">
          <p className="font-medium">Derived clinical flags from intake</p>
          <KeyRow k="Prior hip/vertebral" v={flags.priorHipOrVertebral ? "Yes" : "No"} />
          <KeyRow k="Multiple fragility fractures" v={flags.multipleFractures ? "Yes" : "No"} />
          <KeyRow k="Recent fracture (≤24 mo)" v={flags.recentFracture ? "Yes" : "No"} />
          <KeyRow k="Glucocorticoid exposure" v={flags.glucocorticoid ? "Yes" : "No"} />
          <KeyRow k="High falls risk" v={flags.fallsHighRisk ? "Yes" : "No"} />
        </div>
      </CardContent>
    </Card>
  );
}
