import { Checkbox } from "@/components/ui/checkbox";
import {
  SECONDARY_CAUSE_OPTIONS,
  SECONDARY_CAUSE_NONE,
  selectedSecondaryCauseSummary,
  toggleSecondaryCauseFlags,
} from "./secondaryCauses";

interface Props {
  flags: string[];
  onChange: (next: string[]) => void;
  idPrefix?: string;
  /** When true, omit the section heading (parent already rendered one). */
  hideHeading?: boolean;
}

export default function SecondaryCausesChecklist({
  flags,
  onChange,
  idPrefix = "secondary-cause",
  hideHeading = false,
}: Props) {
  const summary = selectedSecondaryCauseSummary(flags);

  return (
    <div className="space-y-2" data-testid="secondary-causes-checklist">
      {hideHeading ? null : (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Secondary causes
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Multi-select. Tick every contributor that applies, or mark none identified. Empty is
        allowed. These flags document the work-up and mark secondary-cause assessment obtained;
        algorithm v2.0 does not invent a FRAX multiplier from them. Use the Advanced CKD /
        CKD-MBD qualifier below for stage and mineral-bone status.
      </p>
      <label className="flex min-w-0 items-start gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-sm text-foreground">
        <Checkbox
          id={`${idPrefix}-none`}
          checked={summary.noneIdentified}
          onCheckedChange={() => onChange(toggleSecondaryCauseFlags(flags, SECONDARY_CAUSE_NONE))}
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
          return (
            <label
              key={label}
              className="flex min-w-0 items-start gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-sm text-foreground"
            >
              <Checkbox
                id={id}
                checked={flags.includes(label)}
                onCheckedChange={() => onChange(toggleSecondaryCauseFlags(flags, label))}
                className="mt-0.5"
              />
              <span className="min-w-0 break-words">{label}</span>
            </label>
          );
        })}
      </div>
      <p
        className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs text-foreground"
        data-testid="secondary-causes-summary"
      >
        {summary.text}
      </p>
    </div>
  );
}
