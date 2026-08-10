import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Activity, BookOpen, Calculator, Pill, Stethoscope, ChevronDown,
  UtensilsCrossed, Bone, FlaskConical, Printer, Scale, Gauge, Search, X,
  ChevronsDownUp, ChevronsUpDown, TestTube, Zap, Brain, Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { CollapseAllProvider } from "@/components/diabetes/shared";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlossaryButton } from "@/lib/glossary";
import heroPancreas from "@/assets/hero-pancreas.jpg";

// Lazy-load topic apps so each ships as its own chunk (only fetched when opened).
const DiabetesOverview   = lazy(() => import("@/components/diabetes/DiabetesOverview"));
const DiabetesAssessment = lazy(() => import("@/components/diabetes/DiabetesAssessment"));
const DiabetesTreatment  = lazy(() => import("@/components/diabetes/DiabetesTreatment"));
const NiceAlgorithms     = lazy(() => import("@/components/diabetes/NiceAlgorithms"));
const IcodecTitration    = lazy(() => import("@/components/diabetes/IcodecTitration"));
const MealPlanner        = lazy(() => import("@/components/diabetes/MealPlanner"));
const ObesityApp         = lazy(() => import("@/components/diabetes/ObesityApp"));
const OsteoporosisApp    = lazy(() => import("@/components/diabetes/OsteoporosisApp"));
const OsteomalaciaApp    = lazy(() => import("@/components/diabetes/OsteomalaciaApp"));
const SteroidApp         = lazy(() => import("@/components/diabetes/SteroidApp"));
const ThyroidApp         = lazy(() => import("@/components/diabetes/ThyroidApp"));
const CalciumApp         = lazy(() => import("@/components/diabetes/CalciumApp"));
const AdrenalApp         = lazy(() => import("@/components/diabetes/AdrenalApp"));
const ParathyroidApp     = lazy(() => import("@/components/diabetes/ParathyroidApp"));
const PituitaryApp       = lazy(() => import("@/components/diabetes/PituitaryApp"));
const LipidApp           = lazy(() => import("@/components/diabetes/LipidApp"));
const Glp1ScreeningApp   = lazy(() => import("@/components/diabetes/Glp1ScreeningApp"));
const GlucoPlan          = lazy(() => import("@/components/diabetes/GlucoPlan"));


const PanelFallback = () => (
  <div className="h-32 animate-pulse rounded-lg border border-border bg-muted/30" aria-hidden />
);

export const Route = createFileRoute("/")({
  component: DiabetesTab,
  head: () => ({
    meta: [
      { title: "Endocrine Rx — Clinical Diabetes, Bone & Endocrine Reference" },
      { name: "description", content: "Bedside clinical reference: ADA 2026 diabetes diagnosis & treatment, insulin & GLP-1 dosing, DKA/HHS, CKD-safe prescribing, osteoporosis, GIOP, osteomalacia and steroid tapers." },
      { property: "og:title", content: "Endocrine Rx — Clinical Diabetes, Bone & Endocrine Reference" },
      { property: "og:description", content: "Interactive calculators and algorithms for diabetes, osteoporosis, GIOP, osteomalacia and glucocorticoid tapers — for clinicians and medical students." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://diabetes-treatment-complete.lovable.app/" },
      { property: "og:site_name", content: "Endocrine Rx" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Endocrine Rx — Clinical Diabetes, Bone & Endocrine Reference" },
      { name: "twitter:description", content: "ADA 2026 diagnosis, insulin & GLP-1 dosing, DKA/HHS, osteoporosis, GIOP and steroid taper tools for clinicians." },
    ],
    links: [{ rel: "canonical", href: "https://diabetes-treatment-complete.lovable.app/" }],
  }),
});

type SectionId =
  | "overview" | "assessment" | "treatment" | "nice-algorithms" | "icodec" | "glp1-screening" | "glucoplan"
  | "meal-planner" | "obesity" | "osteoporosis" | "osteomalacia" | "steroids" | "thyroid" | "calcium" | "parathyroid" | "adrenal" | "pituitary" | "lipid";

type GroupName = "Diabetes" | "Obesity" | "Nutrition" | "Bone & Endocrine";

type SectionMeta = {
  id: SectionId; label: string; icon: typeof BookOpen; blurb: string;
  group: GroupName; keywords: string; tone: string; // tailwind bg/text for icon tile
};

const SECTIONS: SectionMeta[] = [
  { id: "overview",     label: "Overview",     icon: BookOpen,        blurb: "Classification · diagnosis · targets",           group: "Diabetes",         keywords: "ada type 1 type 2 mody lada teplizumab golimumab", tone: "bg-[oklch(0.94_0.10_25)] text-[oklch(0.35_0.18_25)] dark:bg-[oklch(0.30_0.10_25)] dark:text-[oklch(0.90_0.10_25)]" },
  { id: "assessment",   label: "Assessment",   icon: Calculator,      blurb: "HbA1c · insulin dosing · patterns",              group: "Diabetes",         keywords: "hba1c insulin tdd basal bolus correction", tone: "bg-[oklch(0.94_0.10_55)] text-[oklch(0.38_0.14_55)] dark:bg-[oklch(0.32_0.10_55)] dark:text-[oklch(0.90_0.10_55)]" },
  { id: "treatment",    label: "Treatment",    icon: Pill,            blurb: "Algorithm · GLP-1 · DKA/HHS · CKD",              group: "Diabetes",         keywords: "metformin glp1 sglt2 dka hhs ckd", tone: "bg-[oklch(0.94_0.10_350)] text-[oklch(0.38_0.18_350)] dark:bg-[oklch(0.32_0.10_350)] dark:text-[oklch(0.90_0.10_350)]" },
  { id: "nice-algorithms", label: "NICE 2026 algorithms", icon: Activity, blurb: "Stepwise visual pathway · MS → DPP-4 → SPI", group: "Diabetes", keywords: "nice 2026 algorithm metformin sglt2 dpp4 sulfonylurea pioglitazone insulin spi frailty ckd ascvd heart failure young onset cheat sheet infographic", tone: "bg-[oklch(0.94_0.10_240)] text-[oklch(0.36_0.16_240)] dark:bg-[oklch(0.32_0.10_240)] dark:text-[oklch(0.90_0.10_240)]" },
  { id: "icodec",       label: "Icodec",       icon: Activity,        blurb: "Weekly icodec + CGM titration",                  group: "Diabetes",         keywords: "insulin icodec weekly cgm", tone: "bg-[oklch(0.94_0.10_295)] text-[oklch(0.40_0.18_295)] dark:bg-[oklch(0.32_0.10_295)] dark:text-[oklch(0.90_0.10_295)]" },
  { id: "glp1-screening", label: "GLP-1 screening", icon: Stethoscope, blurb: "Pre-screen · contraindications · NAION / optic nerve", group: "Diabetes", keywords: "glp1 semaglutide tirzepatide liraglutide dulaglutide prescreen mtc men2 pancreatitis retinopathy naion optic nerve glaucoma eligibility", tone: "bg-[oklch(0.94_0.10_190)] text-[oklch(0.36_0.14_190)] dark:bg-[oklch(0.32_0.10_190)] dark:text-[oklch(0.90_0.10_190)]" },
  { id: "glucoplan",    label: "GlucoPlan",    icon: Heart,           blurb: "Care planning · ADA 2026",                       group: "Diabetes",         keywords: "glucoplan decision support care plan ada 2026 management", tone: "bg-[oklch(0.94_0.10_0)] text-[oklch(0.38_0.18_0)] dark:bg-[oklch(0.32_0.10_0)] dark:text-[oklch(0.90_0.10_0)]" },
  { id: "obesity",      label: "Obesity",      icon: Scale,           blurb: "BMI · ICMR · waist · MetS · HOMA-IR",            group: "Obesity",          keywords: "bmi icmr waist metabolic homa obesity", tone: "bg-[oklch(0.94_0.10_15)] text-[oklch(0.38_0.18_15)] dark:bg-[oklch(0.32_0.10_15)] dark:text-[oklch(0.90_0.10_15)]" },

  { id: "meal-planner", label: "Meal planner", icon: UtensilsCrossed, blurb: "Carb & meal prescriptions",                       group: "Nutrition",        keywords: "meal carb indian kerala vegetarian", tone: "bg-[oklch(0.94_0.09_140)] text-[oklch(0.36_0.14_140)] dark:bg-[oklch(0.32_0.09_140)] dark:text-[oklch(0.90_0.10_140)]" },
  { id: "osteoporosis", label: "Osteoporosis", icon: Bone,            blurb: "Risk · drugs · GIOP · sequencing · combos",      group: "Bone & Endocrine", keywords: "bone dxa denosumab bisphosphonate teriparatide giop frax", tone: "bg-[oklch(0.94_0.10_260)] text-[oklch(0.40_0.18_260)] dark:bg-[oklch(0.32_0.10_260)] dark:text-[oklch(0.90_0.10_260)]" },
  { id: "osteomalacia", label: "Osteomalacia", icon: Bone,            blurb: "Workup & vitamin D therapy",                     group: "Bone & Endocrine", keywords: "vitamin d calcium phosphate osteomalacia", tone: "bg-[oklch(0.94_0.10_200)] text-[oklch(0.38_0.14_200)] dark:bg-[oklch(0.32_0.10_200)] dark:text-[oklch(0.90_0.10_200)]" },
  { id: "steroids",     label: "Steroids",     icon: FlaskConical,    blurb: "Potency · taper · monitoring",                   group: "Bone & Endocrine", keywords: "prednisone taper cortisol hpa hydrocortisone", tone: "bg-[oklch(0.94_0.10_70)] text-[oklch(0.38_0.14_70)] dark:bg-[oklch(0.32_0.10_70)] dark:text-[oklch(0.90_0.10_70)]" },
  { id: "thyroid",      label: "Thyroid",      icon: Gauge,           blurb: "TFTs · hypo/hyper · storm · nodules · pregnancy", group: "Bone & Endocrine", keywords: "tsh t4 levothyroxine graves ted teprotumumab tirads", tone: "bg-[oklch(0.94_0.10_170)] text-[oklch(0.38_0.14_170)] dark:bg-[oklch(0.32_0.10_170)] dark:text-[oklch(0.90_0.10_170)]" },
  { id: "calcium",      label: "Calcium",      icon: TestTube,        blurb: "Total vs ionized · stop albumin-adjusted Ca",   group: "Bone & Endocrine", keywords: "calcium ionized albumin payne corrected iof ifcc kdigo hypocalcemia hypercalcemia", tone: "bg-[oklch(0.94_0.10_230)] text-[oklch(0.38_0.16_230)] dark:bg-[oklch(0.32_0.10_230)] dark:text-[oklch(0.90_0.10_230)]" },
  { id: "parathyroid", label: "Parathyroid",  icon: TestTube,        blurb: "Ca × PTH pattern · hypo vs hyper vs secondary",   group: "Bone & Endocrine", keywords: "pth parathyroid hyperparathyroidism hypoparathyroidism fhh secondary calcium phosphate magnesium ckd vitamin d urine calcium", tone: "bg-[oklch(0.94_0.10_310)] text-[oklch(0.38_0.16_310)] dark:bg-[oklch(0.32_0.10_310)] dark:text-[oklch(0.90_0.10_310)]" },
  { id: "pituitary",   label: "Pituitary",    icon: Brain,           blurb: "Micro/macroadenoma · MEN · polyglandular",        group: "Bone & Endocrine", keywords: "pituitary adenoma microadenoma macroadenoma prolactinoma acromegaly cushing apoplexy men1 men2 men4 aps apeced schmidt polyglandular hypopituitarism", tone: "bg-[oklch(0.94_0.10_280)] text-[oklch(0.38_0.16_280)] dark:bg-[oklch(0.32_0.10_280)] dark:text-[oklch(0.90_0.10_280)]" },
  { id: "adrenal",      label: "Adrenal axis", icon: Zap,             blurb: "Cushing · Addison · ACTH stim · DST · LNSC · UFC", group: "Bone & Endocrine", keywords: "cushing addison adrenal insufficiency cortisol acth dst lnsc ufc dexamethasone stimulation crisis", tone: "bg-[oklch(0.94_0.10_100)] text-[oklch(0.38_0.16_100)] dark:bg-[oklch(0.32_0.10_100)] dark:text-[oklch(0.90_0.10_100)]" },
  { id: "lipid",        label: "Lipids",       icon: Droplets,        blurb: "Targets · statins · FH · PCSK9i · TG",            group: "Bone & Endocrine", keywords: "ldl hdl triglyceride statin ezetimibe pcsk9 inclisiran bempedoic acid icosapent familial hypercholesterolemia", tone: "bg-[oklch(0.94_0.10_330)] text-[oklch(0.38_0.18_330)] dark:bg-[oklch(0.32_0.10_330)] dark:text-[oklch(0.90_0.10_330)]" },
];

const GROUP_ORDER: GroupName[] = ["Diabetes", "Obesity", "Nutrition", "Bone & Endocrine"];
const GROUPS_KEY = "erx:sidebar:groups";

function useGroupState() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GROUPS_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  const write = (next: Record<string, boolean>) => {
    setCollapsed(next);
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  return {
    isCollapsed: (g: string) => !!collapsed[g],
    toggle: (g: string) => write({ ...collapsed, [g]: !collapsed[g] }),
    expandAll: () => write({}),
    collapseAll: () => write(Object.fromEntries(GROUP_ORDER.map((g) => [g, true]))),
  };
}

/** Highlight matches inside a label without touching HTML injection. */
function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="hl">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function matchesQuery(s: SectionMeta, q: string) {
  if (!q) return true;
  const n = q.toLowerCase();
  return s.label.toLowerCase().includes(n) || s.blurb.toLowerCase().includes(n) || s.keywords.includes(n) || s.group.toLowerCase().includes(n);
}

function AppSidebar({
  active, onNavigate,
}: { active: SectionId | null; onNavigate: (id: SectionId) => void }) {
  const [q, setQ] = useState("");
  const group = useGroupState();

  const grouped = useMemo(() => {
    const g: Record<string, SectionMeta[]> = {};
    SECTIONS.filter((s) => matchesQuery(s, q)).forEach((s) => { (g[s.group] ||= []).push(s); });
    return g;
  }, [q]);

  const searching = q.trim().length > 0;

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg sunset-gradient text-white shadow-sm">
            <Stethoscope className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold tracking-tight">Endocrine Rx</div>
            <div className="truncate text-[11px] text-muted-foreground">Clinical reference · ADA 2026</div>
          </div>
        </div>
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sections…"
              aria-label="Search sidebar"
              className="h-9 pl-8 pr-8"
            />
            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQ("")}
                className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-1 px-0.5">
            <button
              type="button"
              onClick={group.expandAll}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
            >
              <ChevronsUpDown className="h-3 w-3" aria-hidden /> Expand all
            </button>
            <button
              type="button"
              onClick={group.collapseAll}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
            >
              <ChevronsDownUp className="h-3 w-3" aria-hidden /> Collapse all
            </button>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {GROUP_ORDER.filter((g) => grouped[g]?.length).map((g) => {
          const items = grouped[g]!;
          const isCollapsed = searching ? false : group.isCollapsed(g);
          return (
            <SidebarGroup key={g}>
              <button
                type="button"
                onClick={() => !searching && group.toggle(g)}
                aria-expanded={!isCollapsed}
                className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SidebarGroupLabel asChild>
                  <span>{g}</span>
                </SidebarGroupLabel>
                <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", isCollapsed ? "-rotate-90" : "rotate-0")} aria-hidden />
              </button>
              {!isCollapsed && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((s) => {
                      const Icon = s.icon;
                      const isActive = active === s.id;
                      return (
                        <SidebarMenuItem key={s.id}>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={s.label}
                            onClick={() => onNavigate(s.id)}
                            aria-current={isActive ? "page" : undefined}
                            className="group/menu-item"
                          >
                            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors motion-reduce:transition-none", s.tone, isActive && "ring-2 ring-primary/40")}>
                              <Icon className="h-3.5 w-3.5" aria-hidden />
                            </span>
                            <span className="truncate"><Highlight text={s.label} q={q} /></span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
        {searching && Object.keys(grouped).length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">No sections match “{q}”.</div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function HomeSearch({ onPick }: { onPick: (id: SectionId) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => SECTIONS.filter((s) => matchesQuery(s, q)), [q]);
  const showResults = q.trim().length > 0;

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <label className="sr-only" htmlFor="home-search">Find a tool</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id="home-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { onPick(results[0].id); setQ(""); }}}
          placeholder="Find a calculator or tool — try “DKA”, “ICMR”, “teprotumumab”…"
          className="h-12 rounded-full border-2 pl-11 pr-4 text-[15px] shadow-sm focus-visible:ring-4 focus-visible:ring-primary/20"
        />
      </div>
      {showResults && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No tool matches “{q}”.</div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => { onPick(s.id); setQ(""); }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:bg-accent"
                    >
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md", s.tone)}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium"><Highlight text={s.label} q={q} /></span>
                        <span className="block truncate text-xs text-muted-foreground"><Highlight text={s.blurb} q={q} /></span>
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{s.group}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function DiabetesTab() {
  const [active, setActive] = useState<SectionId | null>(null);
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);

  const scrollTo = (id: SectionId) => {
    setActive(id);
    setOpen(true);
    setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      30,
    );
  };

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh w-full bg-background">
        <Toaster richColors position="top-right" />
        <AppSidebar active={active} onNavigate={scrollTo} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Sticky glass header */}
          <header className="sticky top-0 z-30 glass-panel">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger aria-label="Toggle navigation" />
                <div className="hidden min-w-0 md:block">
                  <h1 className="truncate font-display text-base font-semibold tracking-tight">
                    <span className="sunset-text">Endocrine Rx</span>
                  </h1>
                  <p className="truncate text-xs text-muted-foreground">
                    Clinical reference · ADA 2026
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 no-print">
                <GlossaryButton />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-9 min-w-9"
                  onClick={() => window.print()}
                  aria-label="Print current view"
                >
                  <Printer className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          </header>

          {active === null ? (
            /* Home hero with front-page search */
            <section
              aria-labelledby="hero-title"
              className="relative overflow-hidden border-b border-border px-3 py-10 sm:px-6 md:py-16"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-90"
                style={{ background: "radial-gradient(ellipse at 20% 20%, color-mix(in oklab, var(--coral) 30%, transparent), transparent 55%), radial-gradient(ellipse at 85% 70%, color-mix(in oklab, var(--magenta) 35%, transparent), transparent 55%), radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--violet) 25%, transparent), transparent 60%)" }}
              />
              <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 md:grid-cols-[1.1fr_1fr]">
                <div>
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-background/60 px-2.5 py-0.5 text-xs font-medium text-primary backdrop-blur">
                    <Activity className="h-3 w-3" aria-hidden /> For clinicians &amp; medical students
                  </div>
                  <h2 id="hero-title" className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                    Endocrinology, <span className="sunset-text">bedside-fast.</span>
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    Interactive calculators and algorithms for diabetes, obesity, osteoporosis, thyroid and steroid care — all in one place.
                  </p>
                  <div className="mt-6">
                    <HomeSearch onPick={scrollTo} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {SECTIONS.slice(0, 6).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => scrollTo(s.id)}
                        className="rounded-full border border-border bg-background/60 px-3 py-1 backdrop-blur transition-colors hover:border-primary/40 hover:text-primary motion-reduce:transition-none"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative mx-auto w-full max-w-md md:max-w-none">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl hero-glow ring-1 ring-border">
                    <img
                      src={heroPancreas}
                      alt="Glowing anatomical illustration of a human pancreas"
                      width={1600}
                      height={1024}
                      className="h-full w-full object-cover"
                      data-noviewer
                    />
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section aria-labelledby="active-title" className="border-b border-border bg-gradient-to-br from-primary/[0.05] via-background to-background px-3 py-5 sm:px-6">
              <div className="mx-auto max-w-6xl">
                <h2 id="active-title" className="font-display text-xl font-semibold tracking-tight md:text-2xl">
                  {SECTIONS.find((s) => s.id === active)?.label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{SECTIONS.find((s) => s.id === active)?.blurb}</p>
              </div>
            </section>
          )}

          {/* Sections */}
          <main
            id="main-content"
            className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-3 py-6 sm:px-6 md:py-8"
          >
            {SECTIONS.filter((s) => s.id === active).map((s) => {
              const Icon = s.icon;
              const isOpen = open;
              return (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-heading`}
                  className="scroll-mt-28"
                >
                  <button
                    onClick={toggle}
                    aria-expanded={isOpen}
                    aria-controls={`${s.id}-panel`}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-all motion-reduce:transition-none sm:px-4 sm:py-3",
                      "hover:border-primary/30 hover:bg-accent/40 hover:shadow-sm",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors motion-reduce:transition-none", s.tone)}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h3 id={`${s.id}-heading`} className="truncate font-display text-[15px] font-semibold sm:text-base">
                          {s.label}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">{s.blurb}</p>
                      </div>
                    </div>
                    <ChevronDown
                      aria-hidden
                      className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", isOpen ? "rotate-0" : "-rotate-90")}
                    />
                  </button>
                  {isOpen && (
                    <div id={`${s.id}-panel`} role="region" className="mt-3">
                      <CollapseAllProvider pageId={s.id}>
                        <Suspense fallback={<PanelFallback />}>
                          {s.id === "overview" && <DiabetesOverview />}
                          {s.id === "assessment" && <DiabetesAssessment />}
                          {s.id === "treatment" && <DiabetesTreatment />}
                          {s.id === "nice-algorithms" && <NiceAlgorithms />}
                          {s.id === "icodec" && <IcodecTitration />}
                          {s.id === "glp1-screening" && <Glp1ScreeningApp />}
                          {s.id === "meal-planner" && <MealPlanner />}
                          {s.id === "obesity" && <ObesityApp />}
                          {s.id === "osteoporosis" && <OsteoporosisApp />}
                          {s.id === "osteomalacia" && <OsteomalaciaApp />}
                          {s.id === "steroids" && <SteroidApp />}
                          {s.id === "thyroid" && <ThyroidApp />}
                          {s.id === "calcium" && <CalciumApp />}
                          {s.id === "adrenal" && <AdrenalApp />}
                          {s.id === "parathyroid" && <ParathyroidApp />}
                          {s.id === "pituitary" && <PituitaryApp />}
                          {s.id === "lipid" && <LipidApp />}
                        </Suspense>
                      </CollapseAllProvider>
                    </div>
                  )}
                </section>
              );
            })}
          </main>

          <footer className="border-t border-border bg-muted/30 py-5 text-center text-xs text-muted-foreground no-print">
            <div className="mx-auto max-w-6xl px-4">
              Endocrine Rx · Reference tool, not a substitute for clinical judgment. Verify dosing
              against local formulary.
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
