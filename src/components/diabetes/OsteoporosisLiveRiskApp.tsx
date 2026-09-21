import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "./shared";
import {
  ALGORITHM_VERSION,
  ASSESSMENT_ITEM_IDS,
  ASSESSMENT_ITEM_LABELS,
  categoryLabel,
  categoryTone,
  type FinalCategory,
  type TriState,
} from "./osteoporosisAlgorithm";
import {
  assessmentProgress,
  classifyLiveIntake,
  type NavigatorIntake,
} from "./osteoporosisAlgorithmMap";
import RatBdTeachingFigure from "./RatBdTeachingFigure";
import SecondaryCausesChecklist from "./SecondaryCausesChecklist";
import CkdQualifierField from "./CkdQualifierField";
import FrailtyLevelField from "./FrailtyLevelField";
import { triStateFromCkdQualifier } from "./ckdQualifier";
import {
  compactOsteoporosisState,
  mergeJevIntoDecision,
  OSTEOPOROSIS_JEV_QUESTIONS,
  osteoporosisRoutingIsAmbiguous,
} from "@/lib/jev/osteoporosisJev";
import { defaultAskOsteoporosisJev, probeJevAvailability } from "@/lib/jev/askOsteoporosisJev";
import type { JevCallResult } from "@/lib/jev/types";
import {
  AgeSliderField,
  ChoicePills,
  IncompleteCallout,
  LiveCard,
  LiveTextField,
} from "./OsteoporosisLiveVisual";
import {
  TRI_PILL_OPTIONS,
  VERTEBRAL_PILL_OPTIONS,
  vertebralBandToCount,
  vertebralCountToBand,
} from "./osteoporosisLiveChoice";

const SEX_OPTIONS: { value: NavigatorIntake["sex"]; label: string }[] = [
  { value: "", label: "Unknown" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const COMPLETE_OPTIONS: { value: NavigatorIntake["fractureHistoryComplete"]; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const THERAPY_OPTIONS: { value: NavigatorIntake["currentDrug"]; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "none", label: "None" },
  { value: "oral-bp", label: "Oral bisphosphonate" },
  { value: "iv-zoledronate", label: "IV bisphosphonate" },
  { value: "denosumab", label: "Denosumab" },
  { value: "teriparatide", label: "Teriparatide / abaloparatide" },
  { value: "romosozumab", label: "Romosozumab" },
];

function TriPills({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: TriState;
  onChange: (v: TriState) => void;
}) {
  return (
    <ChoicePills
      name={id}
      label={label}
      hint={hint}
      value={value}
      options={TRI_PILL_OPTIONS}
      onChange={onChange}
    />
  );
}

export type AskOsteoporosisJev = typeof defaultAskOsteoporosisJev;

interface Props {
  input: NavigatorIntake;
  onChange: <K extends keyof NavigatorIntake>(key: K, value: NavigatorIntake[K]) => void;
  onOpenFrax?: () => void;
  askJev?: AskOsteoporosisJev;
}

export default function OsteoporosisLiveRiskApp({
  input,
  onChange,
  onOpenFrax,
  askJev = defaultAskOsteoporosisJev,
}: Props) {
  const { mapped, decision } = useMemo(() => classifyLiveIntake(input), [input]);
  const progress = assessmentProgress(mapped.assessmentItemStatus);
  const ambiguous = osteoporosisRoutingIsAmbiguous(decision);

  const [jevResult, setJevResult] = useState<JevCallResult | null>(null);
  const [jevPending, setJevPending] = useState(false);
  const calledJevRef = useRef(false);
  const requestGen = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void probeJevAvailability()
      .then((body) => {
        if (cancelled) return;
        if (!body.available) {
          setJevResult({
            available: false,
            reason: body.reason === "network" ? "network" : "missing_key",
            reviewFlag: true,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setJevResult({ available: false, reason: "network", reviewFlag: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ambiguous) {
      calledJevRef.current = false;
      setJevPending(false);
      setJevResult((prev) => (prev && prev.available === false ? prev : null));
      return;
    }
    const gen = ++requestGen.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setJevPending(true);
      const state = compactOsteoporosisState(mapped, decision);
      void askJev({ state, questions: OSTEOPOROSIS_JEV_QUESTIONS }, controller.signal)
        .then((result) => {
          if (gen !== requestGen.current) return;
          calledJevRef.current = true;
          setJevResult(result);
        })
        .catch(() => {
          if (gen !== requestGen.current) return;
          calledJevRef.current = true;
          setJevResult({ available: false, reason: "network", reviewFlag: true });
        })
        .finally(() => {
          if (gen === requestGen.current) setJevPending(false);
        });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [ambiguous, askJev, decision, mapped]);

  const merged = useMemo(
    () =>
      mergeJevIntoDecision({
        input: mapped,
        deterministic: decision,
        jev: jevResult,
        calledJev: calledJevRef.current && ambiguous,
      }),
    [mapped, decision, jevResult, ambiguous],
  );

  const shown = merged.decision;
  const tone = categoryTone(shown.finalCategory);
  const incomplete = shown.finalCategory === "assessment_incomplete";
  // Provisional risk from known data only (unknowns treated as negative): gives the
  // clinician a floor classification while the full assessment is still incomplete.
  const provisional: FinalCategory | null = !incomplete
    ? null
    : shown.baselineCategory === "very_high"
      ? "very_high"
      : shown.baselineCategory === "high"
        ? "high"
        : "below_treatment_threshold";
  const provisionalTone = provisional ? categoryTone(provisional) : "info";

  return (
    <div className="osteo-live-helper min-w-0 max-w-full">
      <div
        className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start"
        data-testid="osteoporosis-live-layout"
      >
        <div id="osteoporosis-live-form" className="min-w-0 max-w-full scroll-mt-24 space-y-3">
          {incomplete ? <IncompleteCallout /> : null}

          <LiveCard>
            <AgeSliderField id="live-age" value={input.age} onChange={(v) => onChange("age", v)} />
            <ChoicePills
              name="live-sex"
              label="Sex"
              value={input.sex}
              options={SEX_OPTIONS}
              onChange={(v) => onChange("sex", v)}
            />
            {input.sex === "female" ? (
              <ChoicePills
                name="live-postmenopausal"
                label="Postmenopausal"
                value={input.postmenopausal ? "yes" : "no"}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
                onChange={(v) => onChange("postmenopausal", v === "yes")}
              />
            ) : null}
          </LiveCard>

          <LiveCard title="Fragility fracture history">
            <ChoicePills
              name="live-fx-complete"
              label="Fracture history complete?"
              value={input.fractureHistoryComplete}
              options={COMPLETE_OPTIONS}
              onChange={(v) => onChange("fractureHistoryComplete", v)}
            />
            <ChoicePills
              name="live-vert-count"
              label="Vertebral fractures"
              value={vertebralCountToBand(input.vertebralFractureCount)}
              options={VERTEBRAL_PILL_OPTIONS}
              onChange={(band) =>
                onChange(
                  "vertebralFractureCount",
                  vertebralBandToCount(band, input.vertebralFractureCount),
                )
              }
            />
            <TriPills
              id="live-hip-fx"
              label="Hip fracture"
              value={input.hipFracture ?? "unknown"}
              onChange={(v) => onChange("hipFracture", v)}
            />
            <TriPills
              id="live-other-fx"
              label="Other fragility fracture"
              hint="Includes humeral or pelvic fracture and other fragility sites."
              value={input.otherFragilityFracture ?? "unknown"}
              onChange={(v) => onChange("otherFragilityFracture", v)}
            />
            <TriPills
              id="live-recent-fx"
              label="Fragility fracture within 2 years"
              value={input.recentFragilityFracture ?? "unknown"}
              onChange={(v) => onChange("recentFragilityFracture", v)}
            />
            <TriPills
              id="live-recent-vert"
              label="Vertebral fracture within 2 years"
              value={input.recentVertebralFracture ?? "unknown"}
              onChange={(v) => onChange("recentVertebralFracture", v)}
            />
            <TriPills
              id="live-fx-on-tx"
              label="Fracture on osteoporosis treatment"
              value={input.fractureOnTreatment ?? "unknown"}
              onChange={(v) => onChange("fractureOnTreatment", v)}
            />
          </LiveCard>

          <LiveCard
            title="DXA"
            hint="DXA at hip and lumbar spine — T-scores feed classification; FRAX stays in the sidebar calculator."
          >
            <LiveTextField
              id="live-fn"
              label="Femoral-neck T-score"
              inputMode="decimal"
              value={input.femoralNeckTScore}
              onChange={(v) => onChange("femoralNeckTScore", v)}
            />
            <LiveTextField
              id="live-th"
              label="Total-hip T-score"
              inputMode="decimal"
              value={input.totalHipTScore}
              onChange={(v) => onChange("totalHipTScore", v)}
            />
            <LiveTextField
              id="live-ls"
              label="Lumbar-spine T-score"
              inputMode="decimal"
              value={input.lumbarSpineTScore}
              onChange={(v) => onChange("lumbarSpineTScore", v)}
            />
          </LiveCard>

          <LiveCard
            title="FRAX threshold"
            hint="FRAX above applicable national treatment threshold. Compute 10-year probabilities in the separate FRAX sidebar tool, then record only yes / no / unknown here."
          >
            <TriPills
              id="live-frax-threshold"
              label="FRAX above applicable national treatment threshold"
              value={input.fraxAboveNationalThreshold}
              onChange={(v) => onChange("fraxAboveNationalThreshold", v)}
            />
            <Button type="button" variant="outline" size="sm" onClick={onOpenFrax}>
              Open FRAX calculator
            </Button>
          </LiveCard>

          <LiveCard title="Secondary causes">
            <SecondaryCausesChecklist
              flags={input.secondaryCauseFlags}
              onChange={(next) => onChange("secondaryCauseFlags", next)}
              qualifiers={input.secondaryCauseQualifiers}
              onQualifiedChange={(next) => {
                onChange("secondaryCauseFlags", next.flags);
                onChange("secondaryCauseQualifiers", next.qualifiers);
                if (next.intakePatch.currentSmoking !== undefined) {
                  onChange("currentSmoking", next.intakePatch.currentSmoking);
                }
                if (next.intakePatch.alcohol3OrMore !== undefined) {
                  onChange("alcohol3OrMore", next.intakePatch.alcohol3OrMore);
                }
                if (next.intakePatch.postmenopausal) onChange("postmenopausal", true);
              }}
              glucocorticoidDose={input.prednisoneEquivalentMgPerDay}
              glucocorticoidMonths={input.steroidDurationMonths}
              onGlucocorticoidChange={(dose, months) => {
                onChange("prednisoneEquivalentMgPerDay", dose);
                onChange("steroidDurationMonths", months);
              }}
              ckdQualifier={input.ckdQualifier ?? "unknown"}
              onJumpToCkdQualifier={() =>
                document.getElementById("live-ckd-qualifier-heading")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              currentSmoking={input.currentSmoking}
              alcohol3OrMore={input.alcohol3OrMore}
              idPrefix="live-secondary"
              hideHeading
            />
          </LiveCard>

          <LiveCard title="Advanced CKD / CKD-MBD">
            <CkdQualifierField
              value={input.ckdQualifier ?? "unknown"}
              crcl={input.crcl}
              idPrefix="live-ckd-qualifier"
              hideHeading
              onChange={(q) => {
                onChange("ckdQualifier", q);
                onChange("advancedCkdOrCkdMbd", triStateFromCkdQualifier(q) ?? "unknown");
              }}
            />
            <LiveTextField
              id="live-crcl"
              label="CrCl (mL/min)"
              inputMode="decimal"
              value={input.crcl}
              onChange={(v) => onChange("crcl", v)}
            />
          </LiveCard>

          <LiveCard title="Frailty (Clinical Frailty Scale)">
            <FrailtyLevelField
              value={input.frailtyLevel ?? "unknown"}
              frequentFallsYes={
                (input.frequentFalls ?? input.clinicianIdentifiedHighFallsRisk) === "yes"
              }
              idPrefix="live-frailty-level"
              hideHeading
              onChange={(level) => onChange("frailtyLevel", level)}
            />
          </LiveCard>

          <LiveCard title="Glucocorticoids, falls, therapy">
            <LiveTextField
              id="live-gc-dose"
              label="Prednisolone-equivalent (mg/day)"
              inputMode="decimal"
              value={input.prednisoneEquivalentMgPerDay}
              onChange={(v) => onChange("prednisoneEquivalentMgPerDay", v)}
            />
            <LiveTextField
              id="live-gc-months"
              label="Glucocorticoid duration (months)"
              inputMode="decimal"
              value={input.steroidDurationMonths}
              onChange={(v) => onChange("steroidDurationMonths", v)}
            />
            <LiveTextField
              id="live-falls"
              label="Falls in past 12 months"
              inputMode="numeric"
              value={input.fallsInPast12Months}
              onChange={(v) => onChange("fallsInPast12Months", v)}
            />
            <TriPills
              id="live-falls-high"
              label="Frequent / high falls risk"
              value={input.frequentFalls ?? input.clinicianIdentifiedHighFallsRisk}
              onChange={(v) => {
                onChange("frequentFalls", v);
                onChange("clinicianIdentifiedHighFallsRisk", v);
              }}
            />
            <ChoicePills
              name="live-therapy"
              label="Current osteoporosis therapy"
              value={input.currentDrug}
              options={THERAPY_OPTIONS}
              onChange={(v) => onChange("currentDrug", v)}
            />
          </LiveCard>

          <LiveCard title="Clinical review">
            <ChoicePills
              name="live-clinical-review"
              label="Special-scenario clinical review is complete"
              hint="Required before assigning below-threshold."
              value={input.clinicalReviewComplete ? "yes" : "no"}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              onChange={(v) => onChange("clinicalReviewComplete", v === "yes")}
            />
          </LiveCard>
        </div>

        <div className="min-w-0 max-w-full space-y-3 lg:sticky lg:top-20">
          <LiveCard id="osteoporosis-live-result" title="Auto-reclassified risk">
            <p className="osteo-live-hint">Algorithm v{ALGORITHM_VERSION} — updates as you edit</p>
            {incomplete ? (
              <div data-testid="live-risk-category">
                <IncompleteCallout
                  reasons={shown.assessmentIncompleteReasons}
                  testId="live-result-incomplete"
                />
              </div>
            ) : (
              <div
                className={`rounded-[1.15rem] border p-4 ${
                  tone === "danger"
                    ? "border-destructive/50 bg-destructive/10"
                    : tone === "warning"
                      ? "border-amber-500/50 bg-amber-500/10"
                      : tone === "success"
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-[color:var(--osteo-input-border)] bg-[color:var(--osteo-pill)]"
                }`}
                data-testid="live-risk-category"
              >
                <div className="osteo-live-result-title">{categoryLabel(shown.finalCategory)}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill tone={tone}>{categoryLabel(shown.finalCategory)}</Pill>
                  <span className="text-xs text-muted-foreground">
                    Baseline {categoryLabel(shown.baselineCategory)}
                  </span>
                </div>
                <p className="mt-2 text-sm">{shown.routing}</p>
              </div>
            )}

            <JevBanner merged={merged} pending={jevPending} />

            <div className="space-y-2 rounded-[1.15rem] bg-[color:var(--osteo-pill)] p-3">
              <span className="text-sm font-semibold">
                Assessment checklist — {progress.obtained}/{progress.total} obtained
              </span>
              <ul className="grid min-w-0 grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                {ASSESSMENT_ITEM_IDS.map((id) => {
                  const status = mapped.assessmentItemStatus[id];
                  const stTone =
                    status === "obtained"
                      ? "success"
                      : status === "missing"
                        ? "warning"
                        : "default";
                  return (
                    <li
                      key={id}
                      className="flex min-w-0 items-start gap-2"
                      data-testid={`assessment-${id}`}
                    >
                      <Pill tone={stTone}>{status}</Pill>
                      <span className="min-w-0 break-words text-muted-foreground">
                        {ASSESSMENT_ITEM_LABELS[id]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {shown.baselineReasons.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-semibold">Baseline reasons</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {shown.baselineReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {shown.specialScenariosPresent.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Special-scenario review</p>
                {shown.specialScenariosPresent.map((s) => (
                  <div
                    key={s.id}
                    className="space-y-1 rounded-[1.15rem] bg-[color:var(--osteo-pill)] p-3"
                  >
                    <Pill tone={s.veryHighRiskIndicator ? "danger" : "warning"}>
                      {s.id.replace(/_/g, " ")}
                    </Pill>
                    <p className="text-sm">{s.action}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 rounded-[1.15rem] bg-[color:var(--osteo-pill)] p-3">
              <p className="text-sm font-semibold">Drug selection</p>
              {shown.drugSelection.preferred ? (
                <ResultRow k="Preferred" v={shown.drugSelection.preferred} />
              ) : null}
              {shown.drugSelection.alternative ? (
                <ResultRow k="Alternative" v={shown.drugSelection.alternative} />
              ) : null}
              {shown.drugSelection.sequence ? (
                <ResultRow k="Sequence" v={shown.drugSelection.sequence} />
              ) : null}
              {shown.drugSelection.considerAnabolic.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {shown.drugSelection.considerAnabolic.map((d) => (
                    <li key={d.drug}>
                      {d.drug} — {d.months} months
                    </li>
                  ))}
                </ul>
              )}
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {shown.drugSelection.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 rounded-[1.15rem] bg-[color:var(--osteo-pill)] p-3">
              <p className="text-sm font-semibold">Follow-up</p>
              <ResultRow k="Formal review" v={shown.followUp.formalDurationReview.join(" ")} />
              <ResultRow
                k="If persistent high risk"
                v={shown.followUp.ifPersistentHighRisk.join(" ")}
              />
              <ResultRow
                k="If controlled risk"
                v={shown.followUp.ifLowOrControlledRisk.join(" ")}
              />
            </div>
          </LiveCard>

          <LiveCard
            id="osteoporosis-rat-bd"
            title="Very high vs high — RAT / BD teaching figure"
            hint="Separate from FRAX. Teaching support, not a prescribing order."
          >
            <RatBdTeachingFigure />
          </LiveCard>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[color:var(--osteo-input-border)] py-1.5 last:border-0">
      <span className="min-w-0 break-words text-[color:var(--osteo-muted)]">{k}</span>
      <span className="min-w-0 break-words text-right font-medium">{v}</span>
    </div>
  );
}

function JevBanner({
  merged,
  pending,
}: {
  merged: ReturnType<typeof mergeJevIntoDecision>;
  pending: boolean;
}) {
  const ask = merged.categoryGate.mode === "ask_clinician";
  const probs = merged.categoryGate.probabilities;
  return (
    <div
      className="space-y-2 rounded-[1.15rem] bg-[color:var(--osteo-pill)] p-3"
      data-testid="jev-status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-semibold">{pending ? "Jev consulting…" : merged.banner}</span>
        {merged.categoryGate.reviewFlag ? <Pill tone="warning">Review flag</Pill> : null}
      </div>
      {ask && merged.categoryGate.jevChoice ? (
        <div className="space-y-1 text-sm">
          <p>
            Suggested label:{" "}
            <strong>{categoryLabel(merged.categoryGate.jevChoice as FinalCategory)}</strong>
            {merged.categoryGate.confidence != null
              ? ` · confidence ${merged.categoryGate.confidence.toFixed(2)}`
              : ""}
          </p>
          {probs ? (
            <ul className="list-disc pl-5 text-xs text-muted-foreground">
              {Object.entries(probs).map(([k, v]) => (
                <li key={k}>
                  {k.replace(/_/g, " ")}: {(v * 100).toFixed(0)}%
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-muted-foreground">{merged.categoryGate.clinicianPrompt}</p>
        </div>
      ) : null}
      {merged.specialistGate.acted && merged.specialistGate.label ? (
        <p className="text-xs text-muted-foreground">
          Specialist score: {merged.specialistGate.label}
        </p>
      ) : null}
      {merged.specialistGate.gate === "ask" ? (
        <p className="text-xs text-muted-foreground">{merged.specialistGate.clinicianPrompt}</p>
      ) : null}
      {merged.judgmentGate.gate === "ask" ? (
        <p className="text-xs text-muted-foreground">{merged.judgmentGate.clinicianPrompt}</p>
      ) : null}
    </div>
  );
}
