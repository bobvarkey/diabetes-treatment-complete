import { useMemo } from "react";
import { Bone, ClipboardList, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Callout, KeyRow, Pill, SectionCard } from "./shared";
import {
  ALGORITHM_PURPOSE,
  ALGORITHM_SCOPE,
  ALGORITHM_TITLE,
  ALGORITHM_VERSION,
  ASSESSMENT_ITEM_IDS,
  ASSESSMENT_ITEM_LABELS,
  categoryLabel,
  categoryTone,
  classifyOsteoporosis,
  type FinalCategory,
  type TriState,
} from "./osteoporosisAlgorithm";
import { assessmentProgress, mapPatientInputToAlgorithm, type NavigatorIntake } from "./osteoporosisAlgorithmMap";
import RatBdTeachingFigure from "./RatBdTeachingFigure";

interface Props {
  input: NavigatorIntake;
  onChange: (key: "fraxAboveNationalThreshold" | "clinicalReviewComplete", value: TriState | boolean) => void;
  onOpenFrax?: () => void;
  defaultOpen?: boolean;
}

const TRI: { value: TriState; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

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
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground" htmlFor={id}>
        {label}
      </Label>
      <select
        id={id}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as TriState)}
      >
        {TRI.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CategoryBanner({ category }: { category: FinalCategory }) {
  const tone = categoryTone(category);
  const cls =
    tone === "danger"
      ? "border-destructive/50 bg-destructive/10"
      : tone === "warning"
        ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-400/40 dark:bg-amber-500/10"
        : tone === "success"
          ? "border-emerald-500/50 bg-emerald-500/10"
          : "border-primary/40 bg-primary/5";
  return (
    <div className={`rounded-md border p-3 ${cls}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={tone}>{categoryLabel(category)}</Pill>
        <span className="text-xs text-muted-foreground">Algorithm v{ALGORITHM_VERSION}</span>
      </div>
    </div>
  );
}

export default function OsteoporosisAlgorithmPanel({ input, onChange, onOpenFrax, defaultOpen = true }: Props) {
  const mapped = useMemo(() => mapPatientInputToAlgorithm(input), [input]);
  const decision = useMemo(() => classifyOsteoporosis(mapped), [mapped]);
  const progress = assessmentProgress(mapped.assessmentItemStatus);

  return (
    <SectionCard
      id="osteoporosis-algorithm-v2"
      title="Osteoporosis algorithm v2.0"
      subtitle={`${ALGORITHM_TITLE} — ${ALGORITHM_SCOPE}`}
      icon={<Bone className="h-4 w-4" />}
      defaultOpen={defaultOpen}
    >
      <Callout tone="info" title="Clinician-reviewed decision support">
        {ALGORITHM_PURPOSE} Unknown answers are never treated as negative. The FRAX calculator stays in its own
        sidebar entry; record only whether a country-appropriate result is above the applicable national treatment
        threshold.
      </Callout>

      <div className="grid gap-3 sm:grid-cols-2">
        <TriSelect
          id="frax-threshold"
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
        Compute probabilities in the separate FRAX tool, apply the country-specific intervention threshold, then
        record the comparison here. Do not enter raw FRAX percentages on this screen.
      </p>

      <label className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-sm">
        <Checkbox
          checked={input.clinicalReviewComplete}
          onCheckedChange={(v) => onChange("clinicalReviewComplete", !!v)}
          className="mt-0.5"
        />
        <span>Special-scenario clinical review is complete (required before assigning below-threshold).</span>
      </label>

      <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          <span className="text-sm font-semibold">
            Assessment checklist — {progress.obtained}/{progress.total} obtained
          </span>
        </div>
        <ul className="grid gap-1 sm:grid-cols-2 text-xs">
          {ASSESSMENT_ITEM_IDS.map((id) => {
            const status = mapped.assessmentItemStatus[id];
            const tone = status === "obtained" ? "success" : status === "missing" ? "warning" : "default";
            return (
              <li key={id} className="flex items-start gap-2">
                <Pill tone={tone}>{status}</Pill>
                <span className="text-muted-foreground">{ASSESSMENT_ITEM_LABELS[id]}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          If missing information could change classification, the result is assessment incomplete.
        </p>
      </div>

      <CategoryBanner category={decision.finalCategory} />
      <Callout
        tone={categoryTone(decision.finalCategory)}
        title={categoryLabel(decision.finalCategory)}
      >
        {decision.routing}
      </Callout>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border/60 p-3 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Baseline</p>
          <KeyRow k="Category" v={categoryLabel(decision.baselineCategory)} />
          <KeyRow k="Scope" v={decision.inScope ? "In scope" : "Out of scope / unknown"} />
          <p className="text-xs text-muted-foreground">{decision.scopeNote}</p>
        </div>
        <div className="rounded-md border border-border/60 p-3 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review</p>
          <KeyRow k="Clinical review" v={decision.clinicalReviewStatus} />
          <KeyRow k="Special scenarios" v={String(decision.specialScenariosPresent.length)} />
          <KeyRow k="Very-high indicators" v={String(decision.veryHighRiskIndicators.length)} />
        </div>
      </div>

      {decision.baselineReasons.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-semibold">Baseline reasons</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {decision.baselineReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {decision.veryHighRiskIndicators.length > 0 && (
        <Callout tone="danger" title="Very-high-risk indicators">
          <ul className="list-disc pl-5 space-y-1">
            {decision.veryHighRiskIndicators.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Callout>
      )}

      {decision.specialScenariosPresent.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Mandatory special-scenario review</p>
          {decision.specialScenariosPresent.map((s) => (
            <div key={s.id} className="rounded-md border border-border/60 bg-card/40 p-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={s.veryHighRiskIndicator ? "danger" : "warning"}>{s.id.replace(/_/g, " ")}</Pill>
                {s.automaticUpgrade ? <Pill tone="danger">Automatic upgrade</Pill> : <Pill tone="default">No automatic upgrade</Pill>}
              </div>
              <p className="text-sm">{s.action}</p>
              {s.effect ? <p className="text-xs text-muted-foreground">{s.effect}</p> : null}
            </div>
          ))}
        </div>
      )}

      {decision.assessmentIncompleteReasons.length > 0 && decision.finalCategory === "assessment_incomplete" && (
        <Callout tone="warning" title="Why classification is incomplete">
          <ul className="list-disc pl-5 space-y-1">
            {decision.assessmentIncompleteReasons.map((r, i) => (
              <li key={`${i}-${r}`}>{r}</li>
            ))}
          </ul>
        </Callout>
      )}

      <div>
        <p className="mb-1 text-sm font-semibold">Rationale</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {decision.rationale.map((r, i) => (
            <li key={`${i}-${r}`}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Very high vs high — drug-class metaphor</p>
        <p className="text-xs text-muted-foreground">
          Very-high-risk pathways consider bone-forming (RAT) agents first. High-risk pathways prefer
          antiresorptives (BD) if suitable. This figure is teaching support, not a prescribing order.
        </p>
        <RatBdTeachingFigure />
      </div>

      <div className="rounded-md border border-border/60 p-3 space-y-2">
        <p className="text-sm font-semibold">Drug selection</p>
        {decision.drugSelection.preferred ? <KeyRow k="Preferred" v={decision.drugSelection.preferred} /> : null}
        {decision.drugSelection.alternative ? <KeyRow k="Alternative" v={decision.drugSelection.alternative} /> : null}
        {decision.drugSelection.sequence ? <KeyRow k="Sequence" v={decision.drugSelection.sequence} /> : null}
        {decision.drugSelection.considerAnabolic.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {decision.drugSelection.considerAnabolic.map((d) => (
              <li key={d.drug}>
                {d.drug} — {d.months} months{d.note ? ` (${d.note})` : ""}
              </li>
            ))}
          </ul>
        )}
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          {decision.drugSelection.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-border/60 p-3 space-y-2">
        <p className="text-sm font-semibold">Drug-suitability review</p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          {decision.drugSuitabilityReview.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-border/60 p-3 space-y-2">
        <p className="text-sm font-semibold">Follow-up</p>
        <KeyRow k="Formal review" v={decision.followUp.formalDurationReview.join(" ")} />
        <KeyRow k="If persistent high risk" v={decision.followUp.ifPersistentHighRisk.join(" ")} />
        <KeyRow k="If controlled risk" v={decision.followUp.ifLowOrControlledRisk.join(" ")} />
        <KeyRow k="Early review" v={decision.followUp.earlyReviewTriggers.join("; ")} />
      </div>

      <Callout tone="danger" title="Safety rules">
        <ul className="list-disc pl-5 space-y-1">
          {decision.safetyRules.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Callout>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Educational reference only. Confirm local approvals, contraindications and the official country-calibrated
          FRAX tool before any prescribing decision.
        </p>
      </div>
    </SectionCard>
  );
}
