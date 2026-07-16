import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, Maximize2, Minimize2, Printer, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SectionEntry = {
  id: string;
  title: string;
  subtitle?: string;
  open: () => void;
};

type CollapseCtx = {
  collapseSignal: number;
  expandSignal: number;
  pageId: string;
  register: (entry: SectionEntry) => void;
  unregister: (id: string) => void;
};

const CollapseContext = createContext<CollapseCtx>({
  collapseSignal: 0,
  expandSignal: 0,
  pageId: "default",
  register: () => {},
  unregister: () => {},
});

export function useSectionPersistence(id: string | undefined, defaultOpen: boolean) {
  const { pageId } = useContext(CollapseContext);
  const storageKey = id ? `section:${pageId}:${id}` : null;
  // Always start with `defaultOpen` so SSR + first client render agree; sync from
  // localStorage after mount to avoid hydration mismatches.
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const hydrated = useRef(false);
  useEffect(() => {
    if (!storageKey) return;
    try {
      const v = window.localStorage.getItem(storageKey);
      if (v !== null) setOpen(v === "1");
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, [storageKey]);
  useEffect(() => {
    if (!storageKey || !hydrated.current) return;
    try {
      window.localStorage.setItem(storageKey, open ? "1" : "0");
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [storageKey, open]);
  return [open, setOpen] as const;
}

export function CollapseAllProvider({
  children,
  pageId = "default",
}: {
  children: ReactNode;
  pageId?: string;
}) {
  const [collapseSignal, setCollapse] = useState(0);
  const [expandSignal, setExpand] = useState(0);
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<SectionEntry[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const register = useCallback((entry: SectionEntry) => {
    setSections((prev) => {
      const next = prev.filter((s) => s.id !== entry.id);
      next.push(entry);
      return next;
    });
  }, []);
  const unregister = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const ctxValue = useMemo(
    () => ({ collapseSignal, expandSignal, pageId, register, unregister }),
    [collapseSignal, expandSignal, pageId, register, unregister],
  );

  const q = query.trim().toLowerCase();
  const matches = q
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.subtitle ?? "").toLowerCase().includes(q),
      )
    : [];

  const jumpTo = (entry: SectionEntry) => {
    entry.open();
    setQuery("");
    setTimeout(() => {
      const el = document.getElementById(entry.id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const handlePrint = () => {
    const src = rootRef.current;
    if (!src) {
      window.print();
      return;
    }
    const clone = src.cloneNode(true) as HTMLElement;
    // Remove the on-screen toolbar and any other no-print controls
    clone.querySelectorAll(".no-print").forEach((n) => n.remove());
    // Drop collapsed sub-sections entirely
    clone
      .querySelectorAll('[data-section-open="false"]')
      .forEach((n) => n.remove());
    const holder = document.createElement("div");
    holder.className = "print-only-root";
    holder.appendChild(clone);
    document.body.appendChild(holder);
    document.body.classList.add("printing-scope");
    const cleanup = () => {
      holder.remove();
      document.body.classList.remove("printing-scope");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    // Fallback cleanup in case afterprint doesn't fire (some browsers)
    setTimeout(cleanup, 60_000);
    window.print();
  };

  return (
    <CollapseContext.Provider value={ctxValue}>
      <div ref={rootRef} data-page-scope={pageId}>
        <div className="mb-3 flex flex-col gap-2 no-print sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this page…"
              aria-label="Search sub-sections on this page"
              className="h-9 pl-8 pr-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
            {q && (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md"
              >
                {matches.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No matches on this page.
                  </div>
                ) : (
                  matches.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      onClick={() => jumpTo(s)}
                      className="block w-full rounded px-2.5 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      <div className="font-medium">{s.title}</div>
                      {s.subtitle && (
                        <div className="truncate text-xs text-muted-foreground">
                          {s.subtitle}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCollapse((n) => n + 1)}
              aria-label="Collapse all sub-sections on this page"
            >
              <Minimize2 className="mr-1.5 h-4 w-4" aria-hidden />
              Collapse all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpand((n) => n + 1)}
              aria-label="Expand all sub-sections on this page"
            >
              <Maximize2 className="mr-1.5 h-4 w-4" aria-hidden />
              Expand all
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              aria-label="Print or export expanded sections as PDF"
            >
              <Printer className="mr-1.5 h-4 w-4" aria-hidden />
              Print / PDF
            </Button>
          </div>
        </div>
        {children}
      </div>
    </CollapseContext.Provider>
  );
}


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
  const [open, setOpen] = useSectionPersistence(id, defaultOpen);
  const { collapseSignal, expandSignal, register, unregister } = useContext(CollapseContext);
  useEffect(() => { if (collapseSignal > 0) setOpen(false); }, [collapseSignal, setOpen]);
  useEffect(() => { if (expandSignal > 0) setOpen(true); }, [expandSignal, setOpen]);

  useEffect(() => {
    if (!id) return;
    register({ id, title, subtitle, open: () => setOpen(true) });
    return () => unregister(id);
  }, [id, title, subtitle, register, unregister, setOpen]);

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
    <section
      id={id}
      data-section-open={collapsible ? (open ? "true" : "false") : "true"}
      className={cn("clinical-card p-5 md:p-6 scroll-mt-24", toneMap[tone])}
    >
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
