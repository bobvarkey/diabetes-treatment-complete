import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LiveCard({
  title,
  hint,
  children,
  className,
  id,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("osteo-live-card min-w-0 max-w-full", className)}>
      {title ? <h3 className="osteo-live-card-title">{title}</h3> : null}
      {hint ? <p className="osteo-live-hint">{hint}</p> : null}
      <div className={cn("min-w-0 space-y-4", title && "mt-3")}>{children}</div>
    </section>
  );
}

export function ChoicePills<T extends string>({
  label,
  hint,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  name: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  const headingId = `${name}-label`;
  return (
    <div className="min-w-0 space-y-2">
      <p id={headingId} className="osteo-live-label">
        {label}
      </p>
      {hint ? <p className="osteo-live-hint">{hint}</p> : null}
      <div
        role="radiogroup"
        aria-labelledby={headingId}
        className="flex min-w-0 flex-wrap gap-2"
        data-testid={`${name}-pills`}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${label}: ${opt.label}`}
              onClick={() => onChange(opt.value)}
              className={cn("osteo-live-pill", selected && "is-selected")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AgeSliderField({
  id,
  value,
  onChange,
  min = 20,
  max = 100,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  min?: number;
  max?: number;
}) {
  const parsed = Number(value);
  const hasAge = value.trim() !== "" && Number.isFinite(parsed);
  const sliderValue = hasAge ? Math.min(max, Math.max(min, parsed)) : 65;

  return (
    <div className="min-w-0 space-y-2">
      <label className="osteo-live-label" htmlFor={id}>
        Age (years)
      </label>
      <div className="flex min-w-0 items-end gap-3">
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="osteo-live-input min-w-0 flex-1"
          aria-describedby={`${id}-slider`}
        />
        {hasAge ? (
          <span className="osteo-live-age-display tabular-nums" aria-hidden>
            {Math.trunc(parsed)}
          </span>
        ) : null}
      </div>
      <input
        id={`${id}-slider`}
        type="range"
        min={min}
        max={max}
        value={sliderValue}
        onChange={(e) => onChange(e.target.value)}
        className="osteo-live-slider w-full min-w-0"
        aria-label="Age slider"
      />
    </div>
  );
}

export function IncompleteCallout({
  reasons,
  testId = "live-incomplete-banner",
}: {
  reasons?: string[];
  testId?: string;
}) {
  return (
    <div className="osteo-live-incomplete min-w-0" data-testid={testId}>
      <h2 className="osteo-live-incomplete-title">assessment incomplete</h2>
      <p className="osteo-live-incomplete-body">
        Complete assessment; do not auto-prescribe or assign low risk.
      </p>
      {reasons && reasons.length > 0 ? (
        <ul className="osteo-live-incomplete-reasons">
          {reasons.map((r, i) => (
            <li key={`${i}-${r}`}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function LiveTextField({
  id,
  label,
  value,
  onChange,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="osteo-live-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="osteo-live-input"
      />
    </div>
  );
}
