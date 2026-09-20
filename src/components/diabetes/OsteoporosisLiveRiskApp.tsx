import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Activity, Bone, ClipboardList, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Callout, KeyRow, Pill, SectionCard } from "./shared";
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

const TRI: { value: TriState; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

const selectClass = "h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm";

function Field({ id, label, children }: { id?: string; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-xs text-muted-foreground" htmlFor={id}>
        {label}
      </Label>
      {children}
    </div>
  );
}

function TriSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: TriState;
  onChange: (v: TriState) => void;
}) {
  return (
    <Field id={id} label={label}>
      <select
        id={id}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value as TriState)}
      >
        {TRI.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
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

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start" data-testid="osteoporosis-live-layout">
      <SectionCard
        id="osteoporosis-live-form"
        title="Live osteoporosis risk"
        subtitle="Select age, sex and clinical facts — classification updates on every change. No submit."
        icon={<ClipboardList className="h-4 w-4" />}
        defaultOpen
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="live-age" label="Age (years)">
            <Input
              id="live-age"
              inputMode="numeric"
              value={input.age}
              onChange={(e) => onChange("age", e.target.value)}
            />
          </Field>
          <Field id="live-sex" label="Sex">
            <select
              id="live-sex"
              className={selectClass}
              value={input.sex}
              onChange={(e) => onChange("sex", e.target.value as NavigatorIntake["sex"])}
            >
              <option value="">—</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>
          {input.sex === "female" ? (
            <label className="flex min-w-0 items-start gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-sm sm:col-span-2">
              <Checkbox
                checked={input.postmenopausal}
                onCheckedChange={(v) => onChange("postmenopausal", !!v)}
                className="mt-0.5"
              />
              <span className="min-w-0 break-words">Postmenopausal</span>
            </label>
          ) : null}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fracture history
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="live-fx-complete" label="Fracture history complete?">
            <select
              id="live-fx-complete"
              className={selectClass}
              value={input.fractureHistoryComplete}
              onChange={(e) =>
                onChange(
                  "fractureHistoryComplete",
                  e.target.value as NavigatorIntake["fractureHistoryComplete"],
                )
              }
            >
              <option value="unknown">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <TriSelect
            id="live-hip-fx"
            label="Hip fracture"
            value={input.hipFracture ?? "unknown"}
            onChange={(v) => onChange("hipFracture", v)}
          />
          <Field id="live-vert-count" label="Vertebral fracture count">
            <Input
              id="live-vert-count"
              inputMode="numeric"
              value={input.vertebralFractureCount ?? ""}
              onChange={(e) => onChange("vertebralFractureCount", e.target.value)}
            />
          </Field>
          <TriSelect
            id="live-other-fx"
            label="Other fragility fracture (humerus / pelvis / other)"
            value={input.otherFragilityFracture ?? "unknown"}
            onChange={(v) => onChange("otherFragilityFracture", v)}
          />
          <TriSelect
            id="live-recent-fx"
            label="Fragility fracture within 2 years"
            value={input.recentFragilityFracture ?? "unknown"}
            onChange={(v) => onChange("recentFragilityFracture", v)}
          />
          <TriSelect
            id="live-recent-vert"
            label="Vertebral fracture within 2 years"
            value={input.recentVertebralFracture ?? "unknown"}
            onChange={(v) => onChange("recentVertebralFracture", v)}
          />
          <TriSelect
            id="live-fx-on-tx"
            label="Fracture on osteoporosis treatment"
            value={input.fractureOnTreatment ?? "unknown"}
            onChange={(v) => onChange("fractureOnTreatment", v)}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          DXA T-scores
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field id="live-fn" label="Femoral-neck T-score">
            <Input
              id="live-fn"
              inputMode="decimal"
              value={input.femoralNeckTScore}
              onChange={(e) => onChange("femoralNeckTScore", e.target.value)}
            />
          </Field>
          <Field id="live-th" label="Total-hip T-score">
            <Input
              id="live-th"
              inputMode="decimal"
              value={input.totalHipTScore}
              onChange={(e) => onChange("totalHipTScore", e.target.value)}
            />
          </Field>
          <Field id="live-ls" label="Lumbar-spine T-score">
            <Input
              id="live-ls"
              inputMode="decimal"
              value={input.lumbarSpineTScore}
              onChange={(e) => onChange("lumbarSpineTScore", e.target.value)}
            />
          </Field>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          FRAX threshold (not the calculator)
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <TriSelect
            id="live-frax-threshold"
            label="FRAX above applicable national treatment threshold"
            value={input.fraxAboveNationalThreshold}
            onChange={(v) => onChange("fraxAboveNationalThreshold", v)}
          />
          <div className="flex items-end">
            <Button type="button" variant="outline" size="sm" onClick={onOpenFrax}>
              Open FRAX calculator
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Compute 10-year probabilities in the separate FRAX sidebar tool, apply the
          country-specific threshold, then record only yes / no / unknown here.
        </p>

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
        />

        <CkdQualifierField
          value={input.ckdQualifier ?? "unknown"}
          crcl={input.crcl}
          idPrefix="live-ckd-qualifier"
          onChange={(q) => {
            onChange("ckdQualifier", q);
            onChange("advancedCkdOrCkdMbd", triStateFromCkdQualifier(q) ?? "unknown");
          }}
        />

        <FrailtyLevelField
          value={input.frailtyLevel ?? "unknown"}
          frequentFallsYes={
            (input.frequentFalls ?? input.clinicianIdentifiedHighFallsRisk) === "yes"
          }
          idPrefix="live-frailty-level"
          onChange={(level) => onChange("frailtyLevel", level)}
        />

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Glucocorticoids, falls, therapy
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="live-gc-dose" label="Prednisolone-equivalent (mg/day)">
            <Input
              id="live-gc-dose"
              inputMode="decimal"
              value={input.prednisoneEquivalentMgPerDay}
              onChange={(e) => onChange("prednisoneEquivalentMgPerDay", e.target.value)}
            />
          </Field>
          <Field id="live-gc-months" label="Glucocorticoid duration (months)">
            <Input
              id="live-gc-months"
              inputMode="decimal"
              value={input.steroidDurationMonths}
              onChange={(e) => onChange("steroidDurationMonths", e.target.value)}
            />
          </Field>
          <Field id="live-falls" label="Falls in past 12 months">
            <Input
              id="live-falls"
              inputMode="numeric"
              value={input.fallsInPast12Months}
              onChange={(e) => onChange("fallsInPast12Months", e.target.value)}
            />
          </Field>
          <TriSelect
            id="live-falls-high"
            label="Frequent / high falls risk"
            value={input.frequentFalls ?? input.clinicianIdentifiedHighFallsRisk}
            onChange={(v) => {
              onChange("frequentFalls", v);
              onChange("clinicianIdentifiedHighFallsRisk", v);
            }}
          />
          <Field id="live-crcl" label="CrCl (mL/min)">
            <Input
              id="live-crcl"
              inputMode="decimal"
              value={input.crcl}
              onChange={(e) => onChange("crcl", e.target.value)}
            />
          </Field>
          <Field id="live-therapy" label="Current osteoporosis therapy">
            <select
              id="live-therapy"
              className={selectClass}
              value={input.currentDrug}
              onChange={(e) =>
                onChange("currentDrug", e.target.value as NavigatorIntake["currentDrug"])
              }
            >
              <option value="unknown">Unknown</option>
              <option value="none">None</option>
              <option value="oral-bp">Oral bisphosphonate</option>
              <option value="iv-zoledronate">IV bisphosphonate</option>
              <option value="denosumab">Denosumab</option>
              <option value="teriparatide">Teriparatide / abaloparatide</option>
              <option value="romosozumab">Romosozumab</option>
            </select>
          </Field>
        </div>

        <label className="flex min-w-0 items-start gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-sm">
          <Checkbox
            checked={input.clinicalReviewComplete}
            onCheckedChange={(v) => onChange("clinicalReviewComplete", !!v)}
            className="mt-0.5"
          />
          <span className="min-w-0 break-words">
            Special-scenario clinical review is complete (required before assigning
            below-threshold).
          </span>
        </label>
      </SectionCard>

      <div className="min-w-0 max-w-full space-y-4 lg:sticky lg:top-20">
        <SectionCard
          id="osteoporosis-live-result"
          title="Auto-reclassified risk"
          subtitle={`Algorithm v${ALGORITHM_VERSION} — updates as you edit`}
          icon={<Bone className="h-4 w-4" />}
          defaultOpen
        >
          <div
            className={`rounded-md border p-3 ${
              tone === "danger"
                ? "border-destructive/50 bg-destructive/10"
                : tone === "warning"
                  ? "border-amber-500/50 bg-amber-500/10"
                  : tone === "success"
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-primary/40 bg-primary/5"
            }`}
            data-testid="live-risk-category"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={tone}>{categoryLabel(shown.finalCategory)}</Pill>
              <span className="text-xs text-muted-foreground">
                Baseline {categoryLabel(shown.baselineCategory)}
              </span>
            </div>
            <p className="mt-2 text-sm">{shown.routing}</p>
          </div>

          <JevBanner merged={merged} pending={jevPending} />

          <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
            <span className="text-sm font-semibold">
              Assessment checklist — {progress.obtained}/{progress.total} obtained
            </span>
            <ul className="grid min-w-0 grid-cols-1 gap-1 text-xs sm:grid-cols-2">
              {ASSESSMENT_ITEM_IDS.map((id) => {
                const status = mapped.assessmentItemStatus[id];
                const stTone =
                  status === "obtained" ? "success" : status === "missing" ? "warning" : "default";
                return (
                  <li key={id} className="flex min-w-0 items-start gap-2" data-testid={`assessment-${id}`}>
                    <Pill tone={stTone}>{status}</Pill>
                    <span className="min-w-0 break-words text-muted-foreground">{ASSESSMENT_ITEM_LABELS[id]}</span>
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
                <div key={s.id} className="rounded-md border border-border/60 p-3 space-y-1">
                  <Pill tone={s.veryHighRiskIndicator ? "danger" : "warning"}>
                    {s.id.replace(/_/g, " ")}
                  </Pill>
                  <p className="text-sm">{s.action}</p>
                </div>
              ))}
            </div>
          )}

          {shown.finalCategory === "assessment_incomplete" &&
            shown.assessmentIncompleteReasons.length > 0 && (
              <Callout tone="warning" title="Why classification is incomplete">
                <ul className="list-disc pl-5 space-y-1">
                  {shown.assessmentIncompleteReasons.map((r, i) => (
                    <li key={`${i}-${r}`}>{r}</li>
                  ))}
                </ul>
              </Callout>
            )}

          <div className="rounded-md border border-border/60 p-3 space-y-2">
            <p className="text-sm font-semibold">Drug selection</p>
            {shown.drugSelection.preferred ? (
              <KeyRow k="Preferred" v={shown.drugSelection.preferred} />
            ) : null}
            {shown.drugSelection.alternative ? (
              <KeyRow k="Alternative" v={shown.drugSelection.alternative} />
            ) : null}
            {shown.drugSelection.sequence ? (
              <KeyRow k="Sequence" v={shown.drugSelection.sequence} />
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

          <div className="rounded-md border border-border/60 p-3 space-y-2">
            <p className="text-sm font-semibold">Follow-up</p>
            <KeyRow k="Formal review" v={shown.followUp.formalDurationReview.join(" ")} />
            <KeyRow k="If persistent high risk" v={shown.followUp.ifPersistentHighRisk.join(" ")} />
            <KeyRow k="If controlled risk" v={shown.followUp.ifLowOrControlledRisk.join(" ")} />
          </div>
        </SectionCard>

        <SectionCard
          id="osteoporosis-rat-bd"
          title="Very high vs high — RAT / BD teaching figure"
          subtitle="Separate from FRAX. Teaching support, not a prescribing order."
          icon={<Activity className="h-4 w-4" />}
          defaultOpen
        >
          <RatBdTeachingFigure />
        </SectionCard>
      </div>
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
      className="rounded-md border border-border/60 bg-card/40 p-3 space-y-2"
      data-testid="jev-status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-semibold">{pending ? "Jev consulting…" : merged.banner}</span>
        {merged.categoryGate.reviewFlag ? <Pill tone="warning">Review flag</Pill> : null}
      </div>
      {ask && merged.categoryGate.jevChoice ? (
        <div className="text-sm space-y-1">
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
