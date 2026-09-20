import { cn } from "@/lib/utils";
import CfsFrailtyIcon, { CFS_FRAILTY_ICON_ATTRIBUTION } from "./CfsFrailtyIcon";
import {
  FRAILTY_LEVEL_OPTIONS,
  frailtyLevelLabel,
  frailtyLevelSetsFallsScenario,
  type FrailtyLevel,
} from "./frailtyLevel";

interface Props {
  value: FrailtyLevel;
  onChange: (next: FrailtyLevel) => void;
  frequentFallsYes?: boolean;
  idPrefix?: string;
}

export default function FrailtyLevelField({
  value,
  onChange,
  frequentFallsYes = false,
  idPrefix = "live-frailty-level",
}: Props) {
  const frail = frailtyLevelSetsFallsScenario(value);
  const notFrailButFalls = frailtyLevelReviewedAndNotFrail(value) && frequentFallsYes;

  return (
    <div className="min-w-0 space-y-2" data-testid="frailty-level">
      <p
        id={`${idPrefix}-heading`}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Frailty (Clinical Frailty Scale)
      </p>
      <p className="min-w-0 break-words text-xs text-muted-foreground">
        Single-select CFS 1–9. Pick one level. The engine still uses one yes/no/unknown
        falls-and-frailty flag (frequent falls or high falls risk). CFS 5–9 map to yes;
        CFS 1–4 map to no and do not clear documented frequent falls. Not an automatic
        risk upgrade or FRAX multiplier. FRAX stays separate.
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${idPrefix}-heading`}
        className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2"
        data-testid="frailty-level-grid"
      >
        {FRAILTY_LEVEL_OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              className={cn(
                "flex min-w-0 cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-sm text-foreground",
                selected ? "border-primary bg-primary/10" : "border-border/60 bg-card/40",
              )}
            >
              <input
                type="radio"
                name={idPrefix}
                id={`${idPrefix}-${opt.id}`}
                value={opt.id}
                checked={selected}
                onChange={() => onChange(opt.id)}
                className="mt-0.5 shrink-0 accent-primary"
              />
              <CfsFrailtyIcon level={opt.id} />
              <span className="min-w-0 break-words">
                <span className="block leading-snug">{opt.label}</span>
                <span className="block text-[11px] text-muted-foreground">{opt.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p
        className="min-w-0 break-words text-[11px] text-muted-foreground"
        data-testid="frailty-cfs-attribution"
      >
        {CFS_FRAILTY_ICON_ATTRIBUTION}
      </p>
      {frail ? (
        <p
          className="min-w-0 break-words rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-foreground"
          data-testid="frailty-level-scenario-note"
        >
          {frailtyLevelLabel(value)} — special-scenario review is active for frequent falls
          / high falls risk (falls and frailty). Provide falls assessment and prevention;
          not an automatic upgrade.
        </p>
      ) : (
        <p className="min-w-0 break-words text-xs text-muted-foreground" data-testid="frailty-level-summary">
          Selected: {frailtyLevelLabel(value)}
        </p>
      )}
      {notFrailButFalls ? (
        <p className="min-w-0 break-words rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs text-foreground">
          CFS is not frail, but frequent / high falls risk is already documented. The
          algorithm keeps the falls flag (special-scenario review stays active).
        </p>
      ) : null}
    </div>
  );
}

function frailtyLevelReviewedAndNotFrail(value: FrailtyLevel): boolean {
  return value !== "unknown" && !frailtyLevelSetsFallsScenario(value);
}
