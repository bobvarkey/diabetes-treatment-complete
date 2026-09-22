import { cn } from "@/lib/utils";
import {
  CKD_QUALIFIER_OPTIONS,
  ckdQualifierLabel,
  ckdQualifierSetsAdvancedScenario,
  type CkdQualifier,
} from "./ckdQualifier";

interface Props {
  value: CkdQualifier;
  onChange: (next: CkdQualifier) => void;
  crcl?: string;
  idPrefix?: string;
  /** When true, omit the section heading (parent already rendered one). */
  hideHeading?: boolean;
}

export default function CkdQualifierField({
  value,
  onChange,
  crcl,
  idPrefix = "live-ckd-qualifier",
  hideHeading = false,
}: Props) {
  const crclN = crcl != null && crcl.trim() !== "" ? parseFloat(crcl) : NaN;
  const lowCrcl = Number.isFinite(crclN) && crclN < 30;
  const advanced = ckdQualifierSetsAdvancedScenario(value);
  const noneButLowCrcl = value === "none" && lowCrcl;

  return (
    <div className="space-y-2" data-testid="ckd-qualifier">
      {hideHeading ? (
        <p id={`${idPrefix}-heading`} className="sr-only">
          Advanced CKD / CKD-MBD
        </p>
      ) : (
        <p
          id={`${idPrefix}-heading`}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Advanced CKD / CKD-MBD
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Qualifier for the algorithm v2.0 special scenario (advanced CKD or suspected CKD-MBD). Stage
        and mineral-bone status are documented here; the engine still uses one yes/no/unknown flag.
        Not an automatic risk upgrade or anabolic route. FRAX stays separate.
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${idPrefix}-heading`}
        className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2"
      >
        {CKD_QUALIFIER_OPTIONS.map((opt) => {
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
              <span className="min-w-0 break-words">
                <span className="block leading-snug">{opt.label}</span>
                <span className="block text-[11px] text-muted-foreground">{opt.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
      {advanced ? (
        <p
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-foreground"
          data-testid="ckd-qualifier-scenario-note"
        >
          {ckdQualifierLabel(value)} — special-scenario review is active for advanced CKD / CKD-MBD.
          Individualize calcium, phosphate, PTH and ALP; not an automatic upgrade.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground" data-testid="ckd-qualifier-summary">
          Selected: {ckdQualifierLabel(value)}
        </p>
      )}
      {noneButLowCrcl ? (
        <p className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs text-foreground">
          CrCl is &lt; 30 mL/min but the qualifier is “not advanced”. The algorithm follows the
          qualifier (no special scenario) until you pick G4 / G5 / dialysis or CKD-MBD.
        </p>
      ) : null}
    </div>
  );
}
