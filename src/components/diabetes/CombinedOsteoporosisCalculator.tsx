import * as React from "react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Callout, KeyRow } from "./shared";
import { decideFrax, type FraxDecision } from "./FraxDecisionFlow";
import { estimateFrax, type FraxResult } from "./fraxEstimate";
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
  const confirmedFragilityFracture = confirmed.length > 0 || input.fragilityFractureTypes.length > 0;
  const priorHipOrVertebral =
    input.fragilityFractureTypes.includes("hip") ||
    input.fragilityFractureTypes.includes("vertebral") ||
    confirmed.some(
      (f) => f.site === "hip" || (f.site === "vertebral" && f.vertebralPresentation === "clinical")
    );
  const multipleFractures = confirmed.length >= 2 || input.fragilityFractureTypes.length >= 2;

  const today = new Date().toISOString().split("T")[0];
  const isRecent = (f: (typeof confirmed)[number]) => {
    if (!f.date) return false;
    const d = daysBetween(f.date, today);
    return d !== null && d <= 730; // 24 months
  };
  const recentFracture = confirmed.some(isRecent);
  const recentVertebralFracture = confirmed.some((f) => f.site === "vertebral" && isRecent(f));
  const recentHipFracture = confirmed.some((f) => f.site === "hip" && isRecent(f));
  const multipleVertebralFractures = confirmed.filter((f) => f.site === "vertebral").length >= 2;

  const pred = parseFloat(input.prednisoneEquivalentMgPerDay);
  const glucocorticoid =
    (!isNaN(pred) && pred >= 7.5) ||
    input.secondaryCauseFlags.includes("Chronic glucocorticoids");

  const fallsHighRisk =
    input.clinicianIdentifiedHighFallsRisk === "yes" ||
    input.injuriousFallInPast12Months === "yes" ||
    (typeof input.fallsInPast12Months === "number" && input.fallsInPast12Months > 1);

  const highDoseGlucocorticoid = !isNaN(pred) && pred >= 7.5;

  // Manually ticked very-high-risk criteria from the intake card — any tick forces VHR.
  const vhr = input.vhrCriteria ?? [];
  const manualRecentVertebral = vhr.some((c) => c.startsWith("Recent vertebral fracture"));
  const manualMultipleVertebral = vhr.some((c) => c.startsWith("≥ 2 vertebral fractures"));
  const manualMultipleFractures = vhr.some((c) => c.startsWith("Multiple fractures"));
  const manualVeryLowBmd = vhr.some((c) => c.startsWith("Very low BMD"));
  const manualHighDoseSteroids = vhr.some((c) => c.startsWith("High-dose steroids"));
  const manualFrax30 = vhr.some((c) => c.startsWith("Major FRAX"));

  return {
    confirmedFragilityFracture,
    priorHipOrVertebral,
    multipleFractures: multipleFractures || manualMultipleFractures,
    recentFracture,
    recentVertebralFracture: recentVertebralFracture || manualRecentVertebral,
    recentHipFracture,
    multipleVertebralFractures: multipleVertebralFractures || manualMultipleVertebral,
    highDoseGlucocorticoid: highDoseGlucocorticoid || manualHighDoseSteroids,
    glucocorticoid: glucocorticoid || manualHighDoseSteroids,
    fallsHighRisk,
    manualVeryHighRisk: manualVeryLowBmd || manualFrax30,
  };
}

export default function CombinedOsteoporosisCalculator({ input }: Props) {
  const flags = useMemo(() => deriveFlags(input), [input]);
  const fractureCancelsFrax = flags.confirmedFragilityFracture;
  const major = fractureCancelsFrax ? NaN : parseFloat(input.fraxMajorPercent);
  const hip = fractureCancelsFrax ? NaN : parseFloat(input.fraxHipPercent);
  const tScore = parseFloat(input.femoralNeckTScore);

  const fraxEstimate = useMemo<FraxResult | null>(() => {
    if (fractureCancelsFrax) return null;
    const age = parseFloat(input.age);
    if (!input.sex || !isFinite(age) || age < 40 || age > 90) return null;
    const steroidDose = parseFloat(input.prednisoneEquivalentMgPerDay);
    const steroidDuration = parseFloat(input.steroidDurationMonths);
    const secondary = input.secondaryCauseFlags.some((flag) =>
      ["Type 1 diabetes", "Hypogonadism / early menopause", "Hyperthyroidism / over-replacement", "Primary hyperparathyroidism", "CKD", "Chronic liver disease", "Malabsorption / IBD / bariatric", "Multiple myeloma / MGUS"].includes(flag),
    );
    return estimateFrax({
      age,
      sex: input.sex as import("./fraxEstimate").Sex,
      weightKg: parseFloat(input.weightKg),
      heightCm: parseFloat(input.heightCm),
      previousFracture: false,
      parentHipFracture: input.parentHipFracture,
      currentSmoking: input.currentSmoking,
      glucocorticoids: isFinite(steroidDose) && steroidDose >= 5 && isFinite(steroidDuration) && steroidDuration >= 3,
      rheumatoidArthritis: input.secondaryCauseFlags.includes("Rheumatoid arthritis"),
      secondaryOsteoporosis: secondary,
      alcohol3OrMore: input.alcohol3OrMore,
      femoralNeckTScore: isFinite(parseFloat(input.femoralNeckTScore)) ? parseFloat(input.femoralNeckTScore) : null,
    });
  }, [input, fractureCancelsFrax]);

  const decision = useMemo(() => {
    if (!isFinite(major) && !isFinite(hip) && !isFinite(tScore) && !Object.values(flags).some(Boolean) && !fraxEstimate) {
      return null;
    }
    return decideFrax({
      fraxMajor: isFinite(major) ? major : fraxEstimate ? fraxEstimate.major : NaN,
      fraxHip: isFinite(hip) ? hip : fraxEstimate ? fraxEstimate.hip : NaN,
      tScore: isFinite(tScore) ? tScore : NaN,
      flags,
    });
  }, [major, hip, tScore, flags, fraxEstimate]);

  if (!decision) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Combined FRAX + clinical risk calculator</CardTitle>
          <CardDescription>
            Enter age/sex/weight/height for a calculated FRAX estimate, or FRAX probabilities/T-score/clinical flags for the combined treatment recommendation.
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
          {fractureCancelsFrax ? (
            <Badge variant="destructive">Confirmed fragility fracture — FRAX not required</Badge>
          ) : (
            <>
              {isFinite(major) && (
                <Badge variant={major >= 20 ? "destructive" : "secondary"}>Major {major}% · threshold 20%</Badge>
              )}
              {isFinite(hip) && (
                <Badge variant={hip >= 3 ? "destructive" : "secondary"}>Hip {hip}% · threshold 3%</Badge>
              )}
            </>
          )}
          {isFinite(tScore) && (
            <Badge variant={tScore <= -2.5 ? "destructive" : tScore <= -1 ? "default" : "secondary"}>T {tScore.toFixed(1)}</Badge>
          )}
          {!isFinite(major) && !isFinite(hip) && (
            <Badge variant="outline">10-year fracture probability not calculated</Badge>
          )}
        </div>

        {fractureCancelsFrax ? (
          <Callout tone="danger" title="Clinical osteoporosis after a low-trauma fracture — at least HIGH risk">
            Once a confirmed low-trauma fracture has occurred, especially of the spine or hip, the clinical goal shifts
            from predicting risk to treating it. Guidelines support starting pharmacological therapy regardless of FRAX
            or DXA T-score, so this calculator cancels FRAX input and reports an automatic high-risk profile. Entering
            multiple fracture sites keeps the classification high and escalates toward very high when recent or multiple
            vertebral features are present.
          </Callout>
        ) : (
          !isFinite(major) && !isFinite(hip) && (
            <Callout tone="info" title="FRAX is optional">
              No validated 10-year probability has been entered, so the app reports “10-year fracture probability not
              calculated”. Risk below is classified from fracture history, BMD and clinical risk factors alone. FRAX is
              most useful in osteopenia without a confirmed fragility fracture.
            </Callout>
          )
        )}

        {flags.priorHipOrVertebral && (
          <Callout tone="danger" title="Prior hip or vertebral fragility fracture — at least HIGH risk">
            Treat irrespective of FRAX or T-score. Escalate to VERY HIGH if a vertebral fracture occurred within 2
            years, if there are ≥ 2 vertebral fractures, or if there is very low BMD, high-dose glucocorticoids or
            multiple major risk factors. A hip fracture within 2 years carries substantial imminent refracture risk
            and needs prompt treatment. Do not double a FRAX result for a previous fracture — FRAX already counts it.
          </Callout>
        )}

        <Callout tone="info" title="When FRAX can still add context after a fracture">
          A verified FRAX may help identify very-high-risk thresholds (for example major fracture risk ≥30%) when
          considering specialist-led anabolic therapy. However, FRAX underrepresents recent fractures: it treats an old
          minor fracture similarly to recent or multiple spine fractures, although the first 1–2 years carry severe
          imminent refracture risk. It also cannot monitor treatment response because it is validated for treatment-naïve
          patients; do not rerun FRAX after starting bone medication to judge whether treatment is working.
        </Callout>


        {fraxEstimate && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-semibold">In-app FRAX-style estimate (not a validated probability)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Major osteoporotic</p>
                <p className="text-lg font-semibold">{fraxEstimate.major}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hip fracture</p>
                <p className="text-lg font-semibold">{fraxEstimate.hip}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-lg font-semibold capitalize">{fraxEstimate.category}</p>
              </div>
            </div>
            <ul className="list-disc pl-5 text-xs text-muted-foreground">
              {fraxEstimate.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}

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
          <KeyRow k="Confirmed fragility fracture" v={flags.confirmedFragilityFracture ? "Yes" : "No"} />
          <KeyRow k="Prior hip/vertebral" v={flags.priorHipOrVertebral ? "Yes" : "No"} />
          <KeyRow k="Multiple fragility fractures" v={flags.multipleFractures ? "Yes" : "No"} />
          <KeyRow k="Recent fracture (≤24 mo)" v={flags.recentFracture ? "Yes" : "No"} />
          <KeyRow k="Vertebral fracture within 2 y" v={flags.recentVertebralFracture ? "Yes" : "No"} />
          <KeyRow k="≥2 vertebral fractures" v={flags.multipleVertebralFractures ? "Yes" : "No"} />
          <KeyRow k="Hip fracture within 2 y" v={flags.recentHipFracture ? "Yes" : "No"} />
          <KeyRow k="Glucocorticoid exposure" v={flags.glucocorticoid ? "Yes" : "No"} />
          <KeyRow k="Very-high-risk criterion selected" v={flags.manualVeryHighRisk ? "Yes" : "No"} />
          <KeyRow k="High falls risk" v={flags.fallsHighRisk ? "Yes" : "No"} />
        </div>
      </CardContent>
    </Card>
  );
}
