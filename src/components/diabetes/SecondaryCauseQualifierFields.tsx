import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ckdQualifierLabel, type CkdQualifier } from "./ckdQualifier";
import {
  alcoholBandFromUnits,
  emptyAiAdt,
  emptyAlcoholSmoking,
  emptyGlucocorticoids,
  emptyHyperthyroid,
  emptyHypogonadism,
  emptyLiver,
  emptyMalabsorption,
  emptyMyeloma,
  emptyPhpt,
  emptyPpiOther,
  emptyRa,
  emptyT1d,
  emptyT2d,
  qualifierKeyForLabel,
  type SecondaryCauseQualifiers,
} from "./secondaryCauseQualifiers";

const selectClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs text-foreground";

function MiniField({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <label className="block text-[11px] text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function OptionSelect<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <MiniField id={id} label={label}>
      <select
        id={id}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </MiniField>
  );
}

interface Props {
  label: string;
  idPrefix: string;
  qualifiers: SecondaryCauseQualifiers;
  onChange: (next: SecondaryCauseQualifiers) => void;
  glucocorticoidDose?: string;
  glucocorticoidMonths?: string;
  onGlucocorticoidChange?: (dose: string, months: string) => void;
  ckdQualifier?: CkdQualifier;
  onJumpToCkdQualifier?: () => void;
}

export default function SecondaryCauseQualifierFields({
  label,
  idPrefix,
  qualifiers,
  onChange,
  glucocorticoidDose = "",
  glucocorticoidMonths = "",
  onGlucocorticoidChange,
  ckdQualifier = "unknown",
  onJumpToCkdQualifier,
}: Props) {
  const key = qualifierKeyForLabel(label);
  const testId = `secondary-cause-qualifier-${(key ?? "unknown").replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

  const patch = <K extends keyof SecondaryCauseQualifiers>(
    k: K,
    value: NonNullable<SecondaryCauseQualifiers[K]>,
  ) => onChange({ ...qualifiers, [k]: value });

  let body: ReactNode = null;

  if (label === "Type 2 diabetes") {
    const q = qualifiers.t2d ?? emptyT2d();
    body = (
      <>
        <OptionSelect
          id={`${idPrefix}-t2d-context`}
          label="How is T2D known?"
          value={q.context}
          onChange={(context) => patch("t2d", { context })}
          options={[
            { value: "unknown", label: "Unknown" },
            { value: "known", label: "Known / documented T2D" },
            { value: "screening", label: "Found on this work-up (HbA1c screening)" },
          ]}
        />
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          T1D and T2D are already separate flags. Duration and complications are not algorithm
          inputs. T2D may fracture at higher T-scores — not a FRAX multiplier here.
        </p>
      </>
    );
  } else if (label === "Type 1 diabetes") {
    const q = qualifiers.t1d ?? emptyT1d();
    body = (
      <>
        <OptionSelect
          id={`${idPrefix}-t1d-context`}
          label="How is T1D known?"
          value={q.context}
          onChange={(context) => patch("t1d", { context })}
          options={[
            { value: "unknown", label: "Unknown" },
            { value: "known", label: "Known / documented T1D" },
          ]}
        />
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          T1D is the FRAX secondary-osteoporosis flag (separate from T2D). Duration and
          complications are not algorithm inputs.
        </p>
      </>
    );
  } else if (label === "Chronic glucocorticoids") {
    const q = qualifiers.glucocorticoids ?? emptyGlucocorticoids();
    body = (
      <>
        <OptionSelect
          id={`${idPrefix}-gc-status`}
          label="Exposure"
          value={q.status}
          onChange={(status) => patch("glucocorticoids", { status })}
          options={[
            { value: "unknown", label: "Unknown" },
            { value: "current", label: "Current / ongoing" },
            { value: "past", label: "Past" },
          ]}
        />
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          <MiniField id={`${idPrefix}-gc-dose`} label="Prednisolone-equivalent (mg/day)">
            <Input
              id={`${idPrefix}-gc-dose`}
              inputMode="decimal"
              className="h-8 text-xs"
              value={glucocorticoidDose}
              onChange={(e) => onGlucocorticoidChange?.(e.target.value, glucocorticoidMonths)}
            />
          </MiniField>
          <MiniField id={`${idPrefix}-gc-months`} label="Duration (months)">
            <Input
              id={`${idPrefix}-gc-months`}
              inputMode="decimal"
              className="h-8 text-xs"
              value={glucocorticoidMonths}
              onChange={(e) => onGlucocorticoidChange?.(glucocorticoidDose, e.target.value)}
            />
          </MiniField>
        </div>
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          Same dose/duration fields as Glucocorticoids below — algorithm v2.0 special-scenario
          inputs, not a second copy or FRAX multiplier.
        </p>
      </>
    );
  } else if (label === "Hypogonadism / early menopause") {
    const q = qualifiers.hypogonadism ?? emptyHypogonadism();
    const menopause =
      q.phenotype === "early_menopause" || q.menopauseAgeYears.trim() !== "" || q.phenotype === "unknown";
    body = (
      <>
        <OptionSelect
          id={`${idPrefix}-hypo-phenotype`}
          label="Which hypogonadism?"
          value={q.phenotype}
          onChange={(phenotype) => patch("hypogonadism", { ...q, phenotype })}
          options={[
            { value: "unknown", label: "Unknown" },
            { value: "early_menopause", label: "Premature / early menopause" },
            { value: "hypogonadism_male", label: "Male hypogonadism" },
            { value: "other", label: "Other hypogonadism" },
          ]}
        />
        {menopause && q.phenotype !== "hypogonadism_male" ? (
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
            <MiniField id={`${idPrefix}-meno-age`} label="Age at menopause (years)">
              <Input
                id={`${idPrefix}-meno-age`}
                inputMode="numeric"
                className="h-8 text-xs"
                value={q.menopauseAgeYears}
                onChange={(e) => patch("hypogonadism", { ...q, menopauseAgeYears: e.target.value })}
              />
            </MiniField>
            <OptionSelect
              id={`${idPrefix}-meno-onset`}
              label="Onset (if known)"
              value={q.menopauseOnset}
              onChange={(menopauseOnset) => patch("hypogonadism", { ...q, menopauseOnset })}
              options={[
                { value: "unknown", label: "Unknown" },
                { value: "spontaneous", label: "Spontaneous" },
                { value: "surgical", label: "Surgical" },
              ]}
            />
          </div>
        ) : null}
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          Early menopause sets postmenopausal on the form. FRAX secondary osteoporosis stays the
          existing hypogonadism flag — no invented multiplier.
        </p>
      </>
    );
  } else if (label === "Hyperthyroidism / over-replacement") {
    const q = qualifiers.hyperthyroid ?? emptyHyperthyroid();
    body = (
      <>
        <OptionSelect
          id={`${idPrefix}-thyroid-status`}
          label="Status"
          value={q.status}
          onChange={(status) => patch("hyperthyroid", { ...q, status })}
          options={[
            { value: "unknown", label: "Unknown" },
            { value: "untreated", label: "Untreated / active" },
            { value: "treated", label: "Treated" },
            { value: "over_replacement", label: "Thyroxine over-replacement" },
          ]}
        />
        <MiniField id={`${idPrefix}-tsh`} label="TSH (if simple / known)">
          <Input
            id={`${idPrefix}-tsh`}
            inputMode="decimal"
            className="h-8 text-xs"
            value={q.tsh}
            onChange={(e) => patch("hyperthyroid", { ...q, tsh: e.target.value })}
          />
        </MiniField>
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          Documented for the work-up and Jev compact state. The engine does not branch on TSH.
        </p>
      </>
    );
  } else if (label === "Primary hyperparathyroidism") {
    const q = qualifiers.phpt ?? emptyPhpt();
    body = (
      <>
        <OptionSelect
          id={`${idPrefix}-phpt-status`}
          label="Status"
          value={q.status}
          onChange={(status) => patch("phpt", { status })}
          options={[
            { value: "unknown", label: "Unknown" },
            { value: "active", label: "Active / known" },
            { value: "post_op", label: "Post-op / treated" },
          ]}
        />
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          Active vs post-op is documented here. Classification still uses the PHPT tick, not a
          FRAX multiplier.
        </p>
      </>
    );
  } else if (label === "CKD") {
    body = (
      <>
        <p className="min-w-0 break-words text-xs text-foreground">
          Stage and mineral-bone status live in the existing{" "}
          <span className="font-medium">Advanced CKD / CKD-MBD</span> qualifier
          {ckdQualifier !== "unknown" ? ` — currently ${ckdQualifierLabel(ckdQualifier)}` : ""}.
        </p>
        {onJumpToCkdQualifier ? (
          <button
            type="button"
            className="min-w-0 break-words text-left text-xs text-primary underline-offset-2 hover:underline"
            onClick={onJumpToCkdQualifier}
          >
            Open Advanced CKD / CKD-MBD qualifier
          </button>
        ) : (
          <p className="min-w-0 break-words text-[11px] text-muted-foreground">
            Set Advanced CKD / CKD-MBD on the live form or intake card. Do not restage here.
          </p>
        )}
      </>
    );
  } else if (label === "Chronic liver disease") {
    const q = qualifiers.liver ?? emptyLiver();
    body = (
      <OptionSelect
        id={`${idPrefix}-liver-pattern`}
        label="Pattern (if known)"
        value={q.pattern}
        onChange={(pattern) => patch("liver", { pattern })}
        options={[
          { value: "unknown", label: "Unknown" },
          { value: "cirrhosis", label: "Cirrhosis" },
          { value: "cholestatic", label: "Cholestatic" },
          { value: "other", label: "Other chronic liver disease" },
        ]}
      />
    );
  } else if (label === "Malabsorption / IBD / bariatric") {
    const q = qualifiers.malabsorption ?? emptyMalabsorption();
    body = (
      <>
        <OptionSelect
          id={`${idPrefix}-malabs-kind`}
          label="Which GI cause?"
          value={q.kind}
          onChange={(kind) => patch("malabsorption", { kind })}
          options={[
            { value: "unknown", label: "Unknown / unspecified" },
            { value: "ibd", label: "IBD" },
            { value: "celiac", label: "Coeliac / celiac" },
            { value: "bariatric", label: "Bariatric / bypass" },
            { value: "other", label: "Other malabsorption" },
          ]}
        />
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          The checklist flag is coarse. Targeted work-up still follows IBD / coeliac / bypass as
          documented here.
        </p>
      </>
    );
  } else if (label === "Multiple myeloma / MGUS") {
    const q = qualifiers.myeloma ?? emptyMyeloma();
    body = (
      <OptionSelect
          id={`${idPrefix}-myeloma-status`}
          label="MGUS or myeloma?"
        value={q.status}
        onChange={(status) => patch("myeloma", { status })}
        options={[
          { value: "unknown", label: "Unknown" },
          { value: "mgus", label: "MGUS" },
          { value: "active_myeloma", label: "Active myeloma" },
        ]}
      />
    );
  } else if (label === "Aromatase inhibitor / ADT") {
    const q = qualifiers.aiAdt ?? emptyAiAdt();
    body = (
      <>
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          <OptionSelect
            id={`${idPrefix}-ai-agent`}
            label="Which therapy?"
            value={q.agent}
            onChange={(agent) => patch("aiAdt", { ...q, agent })}
            options={[
              { value: "unknown", label: "Unknown" },
              { value: "ai", label: "Aromatase inhibitor" },
              { value: "adt", label: "ADT" },
            ]}
          />
          <OptionSelect
            id={`${idPrefix}-ai-status`}
            label="Current vs past?"
            value={q.status}
            onChange={(status) => patch("aiAdt", { ...q, status })}
            options={[
              { value: "unknown", label: "Unknown" },
              { value: "current", label: "Current" },
              { value: "past", label: "Past" },
            ]}
          />
        </div>
        <MiniField id={`${idPrefix}-ai-duration`} label="Duration (months, if simple)">
          <Input
            id={`${idPrefix}-ai-duration`}
            inputMode="decimal"
            className="h-8 text-xs"
            value={q.durationMonths}
            onChange={(e) => patch("aiAdt", { ...q, durationMonths: e.target.value })}
          />
        </MiniField>
      </>
    );
  } else if (label === "Chronic PPI / anticonvulsants / heparin") {
    const q = qualifiers.ppiOther ?? emptyPpiOther();
    body = (
      <>
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          <OptionSelect
            id={`${idPrefix}-ppi-agent`}
            label="Which agent?"
            value={q.agent}
            onChange={(agent) => patch("ppiOther", { ...q, agent })}
            options={[
              { value: "unknown", label: "Unknown" },
              { value: "ppi", label: "PPI" },
              { value: "anticonvulsant", label: "Anticonvulsant" },
              { value: "heparin", label: "Heparin" },
            ]}
          />
          <OptionSelect
            id={`${idPrefix}-ppi-status`}
            label="Ongoing vs past?"
            value={q.status}
            onChange={(status) => patch("ppiOther", { ...q, status })}
            options={[
              { value: "unknown", label: "Unknown" },
              { value: "current", label: "Ongoing" },
              { value: "past", label: "Past" },
            ]}
          />
        </div>
        <MiniField id={`${idPrefix}-ppi-duration`} label="Duration (months, if known)">
          <Input
            id={`${idPrefix}-ppi-duration`}
            inputMode="decimal"
            className="h-8 text-xs"
            value={q.durationMonths}
            onChange={(e) => patch("ppiOther", { ...q, durationMonths: e.target.value })}
          />
        </MiniField>
        {q.agent === "ppi" || q.agent === "unknown" ? (
          <label className="flex min-w-0 items-start gap-2 text-xs text-foreground">
            <Checkbox
              id={`${idPrefix}-ppi-high-dose`}
              checked={q.highDosePpi}
              onCheckedChange={(v) => patch("ppiOther", { ...q, highDosePpi: !!v })}
              className="mt-0.5"
            />
            <span className="min-w-0 break-words">High-dose PPI if relevant</span>
          </label>
        ) : null}
      </>
    );
  } else if (label === "Alcohol > 3 U/d or smoker") {
    const q = qualifiers.alcoholSmoking ?? emptyAlcoholSmoking();
    body = (
      <>
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          <OptionSelect
            id={`${idPrefix}-smoking`}
            label="Smoking"
            value={q.smoking}
            onChange={(smoking) => patch("alcoholSmoking", { ...q, smoking })}
            options={[
              { value: "unknown", label: "Unknown" },
              { value: "never", label: "Never" },
              { value: "past", label: "Past" },
              { value: "current", label: "Current" },
            ]}
          />
          <OptionSelect
            id={`${idPrefix}-alcohol`}
            label="Alcohol"
            value={q.alcohol}
            onChange={(alcohol) => patch("alcoholSmoking", { ...q, alcohol })}
            options={[
              { value: "unknown", label: "Unknown" },
              { value: "none", label: "None" },
              { value: "under_3", label: "≤ 3 units/day" },
              { value: "over_3", label: "> 3 units/day" },
            ]}
          />
        </div>
        <MiniField id={`${idPrefix}-alcohol-units`} label="Alcohol units/day (if known)">
          <Input
            id={`${idPrefix}-alcohol-units`}
            inputMode="decimal"
            className="h-8 text-xs"
            value={q.alcoholUnitsPerDay}
            onChange={(e) => {
              const alcoholUnitsPerDay = e.target.value;
              patch("alcoholSmoking", {
                ...q,
                alcoholUnitsPerDay,
                alcohol: alcoholBandFromUnits(alcoholUnitsPerDay, q.alcohol),
              });
            }}
          />
        </MiniField>
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          Maps onto the existing current-smoking and alcohol ≥ 3 U/d FRAX fields. Amount is
          documentation — not a FRAX multiplier.
        </p>
      </>
    );
  } else if (label === "Rheumatoid arthritis") {
    const q = qualifiers.ra ?? emptyRa();
    body = (
      <>
        <OptionSelect
          id={`${idPrefix}-ra-activity`}
          label="Activity"
          value={q.activity}
          onChange={(activity) => patch("ra", { activity })}
          options={[
            { value: "unknown", label: "Unknown" },
            { value: "active", label: "Active" },
            { value: "remission", label: "Remission / treated" },
          ]}
        />
        <p className="min-w-0 break-words text-[11px] text-muted-foreground">
          FRAX rheumatoid-arthritis stays the existing RA tick. Glucocorticoids, if used, belong
          on the chronic-glucocorticoid flag and dose/duration fields.
        </p>
      </>
    );
  }

  if (!body) return null;

  return (
    <div
      className={cn("min-w-0 space-y-2 border-t border-border/50 pt-2")}
      data-testid={testId}
    >
      {body}
    </div>
  );
}
