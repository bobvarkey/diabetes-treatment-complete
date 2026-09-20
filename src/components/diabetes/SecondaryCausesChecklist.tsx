import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SECONDARY_CAUSE_OPTIONS,
  SECONDARY_CAUSE_NONE,
  selectedSecondaryCauseSummary,
  toggleSecondaryCauseFlags,
} from "./secondaryCauses";
import {
  DEFAULT_SECONDARY_CAUSE_QUALIFIERS,
  intakePatchFromSecondaryCauseQualifiers,
  selectedSecondaryCauseQualifiedSummary,
  seedQualifiersForFlags,
  type SecondaryCauseIntakePatch,
  type SecondaryCauseQualifiers,
} from "./secondaryCauseQualifiers";
import type { CkdQualifier } from "./ckdQualifier";
import SecondaryCauseQualifierFields from "./SecondaryCauseQualifierFields";

export interface SecondaryCausesChange {
  flags: string[];
  qualifiers: SecondaryCauseQualifiers;
  intakePatch: SecondaryCauseIntakePatch;
}

interface Props {
  flags: string[];
  onChange: (next: string[]) => void;
  idPrefix?: string;
  /** When true, omit the section heading (parent already rendered one). */
  hideHeading?: boolean;
  qualifiers?: SecondaryCauseQualifiers;
  onQualifiersChange?: (next: SecondaryCauseQualifiers) => void;
  /** Combined callback used by the live form to persist flags, qualifiers and mapped intake fields. */
  onQualifiedChange?: (next: SecondaryCausesChange) => void;
  glucocorticoidDose?: string;
  glucocorticoidMonths?: string;
  onGlucocorticoidChange?: (dose: string, months: string) => void;
  ckdQualifier?: CkdQualifier;
  onJumpToCkdQualifier?: () => void;
  currentSmoking?: boolean;
  alcohol3OrMore?: boolean;
}

export default function SecondaryCausesChecklist({
  flags,
  onChange,
  idPrefix = "secondary-cause",
  hideHeading = false,
  qualifiers = DEFAULT_SECONDARY_CAUSE_QUALIFIERS,
  onQualifiersChange,
  onQualifiedChange,
  glucocorticoidDose,
  glucocorticoidMonths,
  onGlucocorticoidChange,
  ckdQualifier,
  onJumpToCkdQualifier,
  currentSmoking,
  alcohol3OrMore,
}: Props) {
  const summary = selectedSecondaryCauseSummary(flags);
  const qualifiedText = selectedSecondaryCauseQualifiedSummary(flags, qualifiers, {
    ckdQualifier,
    glucocorticoidDose,
    glucocorticoidMonths,
  });

  const emit = (nextFlags: string[], nextQualifiers: SecondaryCauseQualifiers) => {
    const seeded = seedQualifiersForFlags({
      previousFlags: flags,
      nextFlags,
      qualifiers: nextQualifiers,
      currentSmoking,
      alcohol3OrMore,
    });
    onChange(nextFlags);
    onQualifiersChange?.(seeded);
    onQualifiedChange?.({
      flags: nextFlags,
      qualifiers: seeded,
      intakePatch: intakePatchFromSecondaryCauseQualifiers(nextFlags, seeded),
    });
  };

  const handleToggle = (label: string) => {
    emit(toggleSecondaryCauseFlags(flags, label), qualifiers);
  };

  const handleQualifiers = (next: SecondaryCauseQualifiers) => {
    emit(flags, next);
  };

  return (
    <div className="min-w-0 space-y-2" data-testid="secondary-causes-checklist">
      {hideHeading ? null : (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Secondary causes
        </p>
      )}
      <p className="min-w-0 break-words text-xs text-muted-foreground">
        Multi-select. Tick every contributor that applies, or mark none identified. Empty is
        allowed. Qualifiers open under each ticked cause — they document the work-up and map only
        onto flags algorithm v2.0 already understands; they do not invent a FRAX multiplier. Use
        the Advanced CKD / CKD-MBD qualifier below for stage and mineral-bone status.
      </p>
      <label className="flex min-w-0 items-start gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-sm text-foreground">
        <Checkbox
          id={`${idPrefix}-none`}
          checked={summary.noneIdentified}
          onCheckedChange={() => handleToggle(SECONDARY_CAUSE_NONE)}
          className="mt-0.5"
        />
        <span className="min-w-0 break-words">None identified on current review</span>
      </label>
      <div
        className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2"
        data-testid="secondary-causes-grid"
      >
        {SECONDARY_CAUSE_OPTIONS.map((label) => {
          const id = `${idPrefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          const selected = flags.includes(label);
          return (
            <div
              key={label}
              className={cn(
                "min-w-0 rounded-md border px-2 py-1.5 text-sm text-foreground",
                selected
                  ? "border-primary bg-primary/10 sm:col-span-2"
                  : "border-border/60 bg-card/40",
              )}
            >
              <label className="flex min-w-0 items-start gap-2">
                <Checkbox
                  id={id}
                  checked={selected}
                  onCheckedChange={() => handleToggle(label)}
                  className="mt-0.5"
                />
                <span className="min-w-0 break-words">{label}</span>
              </label>
              {selected ? (
                <SecondaryCauseQualifierFields
                  label={label}
                  idPrefix={id}
                  qualifiers={qualifiers}
                  onChange={handleQualifiers}
                  glucocorticoidDose={glucocorticoidDose}
                  glucocorticoidMonths={glucocorticoidMonths}
                  onGlucocorticoidChange={onGlucocorticoidChange}
                  ckdQualifier={ckdQualifier}
                  onJumpToCkdQualifier={onJumpToCkdQualifier}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <p
        className="min-w-0 break-words rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs text-foreground"
        data-testid="secondary-causes-summary"
      >
        {qualifiedText && !summary.noneIdentified && !summary.noneSelected
          ? `${summary.count} selected: ${qualifiedText}`
          : summary.text}
      </p>
    </div>
  );
}
