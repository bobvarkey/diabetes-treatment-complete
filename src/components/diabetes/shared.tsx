import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  subtitle,
  icon,
  children,
  tone = "default",
  id,
  collapsible = true,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  tone?: "default" | "warning" | "danger" | "success" | "info";
  id?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toneMap: Record<string, string> = {
    default: "border-border",
    warning: "border-warning/50 bg-warning/5",
    danger: "border-destructive/50 bg-destructive/5",
    success: "border-success/40 bg-success/5",
    info: "border-info/40 bg-info/5",
  };
  const panelId = id ? `${id}-panel` : undefined;
  const Header = (
    <header className={cn("flex items-start gap-3", collapsible ? "w-full text-left" : "mb-4")}>
      {icon ? <div className="mt-0.5 text-primary">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {collapsible ? (
        <ChevronDown
          aria-hidden
          className={cn("mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform", open ? "rotate-0" : "-rotate-90")}
        />
      ) : null}
    </header>
  );
  return (
    <section id={id} className={cn("clinical-card p-5 md:p-6 scroll-mt-24", toneMap[tone])}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="-m-1 mb-0 flex w-full rounded-md p-1 hover:bg-accent/30"
        >
          {Header}
        </button>
      ) : (
        Header
      )}
      {(!collapsible || open) && (
        <div id={panelId} className={cn("space-y-3 text-sm leading-relaxed", collapsible && "mt-4")}>
          {children}
        </div>
      )}
    </section>
  );
}


export function KeyRow({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("text-right font-medium text-foreground", mono && "font-mono")}>{v}</span>
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "warning" | "danger" | "success" | "info" | "primary";
}) {
  const map: Record<string, string> = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/15 text-destructive",
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", map[tone])}>
      {children}
    </span>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    info: "border-info/40 bg-info/5 text-foreground",
    warning: "border-warning/50 bg-warning/10 text-foreground",
    danger: "border-destructive/50 bg-destructive/10 text-foreground",
    success: "border-success/40 bg-success/10 text-foreground",
  };
  return (
    <div className={cn("rounded-md border-l-4 px-3 py-2 text-sm", map[tone])}>
      {title ? <div className="mb-1 font-semibold">{title}</div> : null}
      <div>{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
