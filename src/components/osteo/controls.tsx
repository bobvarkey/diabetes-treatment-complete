import { cn } from "@/lib/utils";
import { label } from "@/lib/osteo/logic";
import type { ReactNode } from "react";

export function Field({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </div>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const pillBase =
  "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 active:scale-[0.97]";

export function PillRadio<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o === value;
        const isUnknownish = o === "unknown" || o === "not_assessed";
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o)}
            className={cn(
              pillBase,
              active
                ? isUnknownish
                  ? "bg-secondary text-secondary-foreground shadow-inner ring-1 ring-border"
                  : "bg-brand text-primary-foreground shadow-md shadow-brand/25"
                : "bg-card/60 text-muted-foreground ring-1 ring-border hover:bg-card hover:text-foreground",
            )}
          >
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

export function PillMultiselect({
  options,
  value,
  onChange,
  exclusive,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  exclusive?: string;
}) {
  const toggle = (o: string) => {
    if (exclusive && o === exclusive) {
      onChange(value.includes(o) ? [] : [o]);
      return;
    }
    const next = value.includes(o) ? value.filter((v) => v !== o) : [...value, o];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(o)}
            className={cn(
              pillBase,
              active
                ? o === exclusive
                  ? "bg-secondary text-secondary-foreground ring-1 ring-border"
                  : "bg-accent text-accent-foreground shadow-md shadow-accent/25"
                : "bg-card/60 text-muted-foreground ring-1 ring-border hover:bg-card hover:text-foreground",
            )}
          >
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  unit,
  placeholder,
  step,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  unit?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="flex max-w-56 items-center gap-2 rounded-xl bg-card/70 px-3 py-2 ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
      <input
        type="number"
        inputMode="decimal"
        step={step ?? "any"}
        value={value === null ? "" : String(value)}
        placeholder={placeholder ?? "Blank = unknown"}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        className="tabular w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground"
      />
      {unit ? <span className="shrink-0 text-xs text-muted-foreground">{unit}</span> : null}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-md rounded-xl bg-card/70 px-3 py-2 text-[14px] ring-1 ring-border outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
    />
  );
}

export function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="tabular rounded-xl bg-card/70 px-3 py-2 text-[14px] ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

export function Gate({
  index,
  title,
  purpose,
  children,
  delay = 0,
}: {
  index: string;
  title: string;
  purpose: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="animate-seat glass overflow-hidden rounded-3xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent font-display text-[13px] font-bold text-primary-foreground shadow-md shadow-brand/30">
          {index}
        </span>
        <div>
          <h2 className="font-display text-[15px] font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{purpose}</p>
        </div>
      </div>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  );
}

export function Conditional({ children }: { children: ReactNode }) {
  return (
    <div className="animate-seat rounded-2xl bg-mist/70 p-4 ring-1 ring-border">{children}</div>
  );
}
