import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Activity, BookOpen, Calculator, Pill, Stethoscope, ChevronDown, ChevronRight,
  Maximize2, Minimize2, UtensilsCrossed, Bone, FlaskConical, Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { CollapseAllProvider } from "@/components/diabetes/shared";

// Lazy-load topic apps so each ships as its own chunk (only fetched when opened).
const DiabetesOverview   = lazy(() => import("@/components/diabetes/DiabetesOverview"));
const DiabetesAssessment = lazy(() => import("@/components/diabetes/DiabetesAssessment"));
const DiabetesTreatment  = lazy(() => import("@/components/diabetes/DiabetesTreatment"));
const IcodecTitration    = lazy(() => import("@/components/diabetes/IcodecTitration"));
const MealPlanner        = lazy(() => import("@/components/diabetes/MealPlanner"));
const OsteoporosisApp    = lazy(() => import("@/components/diabetes/OsteoporosisApp"));
const OsteomalaciaApp    = lazy(() => import("@/components/diabetes/OsteomalaciaApp"));
const SteroidApp         = lazy(() => import("@/components/diabetes/SteroidApp"));
const GiopApp            = lazy(() => import("@/components/diabetes/GiopApp"));

const PanelFallback = () => (
  <div className="h-32 animate-pulse rounded-lg border border-border bg-muted/30" aria-hidden />
);


export const Route = createFileRoute("/")({
  component: DiabetesTab,
  head: () => ({
    meta: [
      { title: "DiabetesRx — Clinical Diabetes, Bone & Endocrine Reference" },
      {
        name: "description",
        content:
          "Bedside clinical reference: ADA 2026 diabetes diagnosis & treatment, insulin & GLP-1 dosing, DKA/HHS, CKD-safe prescribing, osteoporosis, GIOP, osteomalacia and steroid tapers.",
      },
      { property: "og:title", content: "DiabetesRx — Clinical Diabetes, Bone & Endocrine Reference" },
      {
        property: "og:description",
        content:
          "Interactive calculators and algorithms for diabetes, osteoporosis, GIOP, osteomalacia and glucocorticoid tapers — for clinicians and medical students.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://diabetes-treatment-complete.lovable.app/" },
      { property: "og:site_name", content: "DiabetesRx" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DiabetesRx — Clinical Diabetes, Bone & Endocrine Reference" },
      {
        name: "twitter:description",
        content:
          "ADA 2026 diagnosis, insulin & GLP-1 dosing, DKA/HHS, osteoporosis, GIOP and steroid taper tools for clinicians.",
      },
    ],
    links: [{ rel: "canonical", href: "https://diabetes-treatment-complete.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: "DiabetesRx — Clinical Diabetes, Bone & Endocrine Reference",
          url: "https://diabetes-treatment-complete.lovable.app/",
          inLanguage: "en",
          audience: {
            "@type": "MedicalAudience",
            audienceType: "Clinician",
          },
          about: [
            { "@type": "MedicalCondition", name: "Type 2 diabetes mellitus" },
            { "@type": "MedicalCondition", name: "Diabetic ketoacidosis" },
            { "@type": "MedicalCondition", name: "Hyperosmolar hyperglycemic state" },
            { "@type": "MedicalCondition", name: "Osteoporosis" },
            { "@type": "MedicalCondition", name: "Glucocorticoid-induced osteoporosis" },
            { "@type": "MedicalCondition", name: "Osteomalacia" },
          ],
          isPartOf: {
            "@type": "WebSite",
            name: "DiabetesRx",
            url: "https://diabetes-treatment-complete.lovable.app/",
          },
        }),
      },
    ],
  }),
});

type SectionId =
  | "overview" | "assessment" | "treatment" | "icodec"
  | "meal-planner" | "osteoporosis" | "osteomalacia" | "steroids" | "giop";


const SECTIONS: { id: SectionId; label: string; icon: typeof BookOpen; blurb: string; group: "Diabetes" | "Nutrition" | "Bone & Endocrine" }[] = [
  { id: "overview",     label: "Overview",     icon: BookOpen,        blurb: "Classification · diagnosis · targets",              group: "Diabetes" },
  { id: "assessment",   label: "Assessment",   icon: Calculator,      blurb: "BMI · HbA1c · insulin dosing",                       group: "Diabetes" },
  { id: "treatment",    label: "Treatment",    icon: Pill,            blurb: "Algorithm · GLP-1 · DKA/HHS · CKD",                  group: "Diabetes" },
  { id: "icodec",       label: "Icodec",       icon: Activity,        blurb: "Weekly icodec + CGM titration",                      group: "Diabetes" },
  { id: "meal-planner", label: "Meal planner", icon: UtensilsCrossed, blurb: "Carb & meal prescriptions",                          group: "Nutrition" },
  { id: "osteoporosis", label: "Osteoporosis", icon: Bone,            blurb: "Risk stratification & drugs",                        group: "Bone & Endocrine" },
  { id: "osteomalacia", label: "Osteomalacia", icon: Bone,            blurb: "Workup & vitamin D therapy",                         group: "Bone & Endocrine" },
  { id: "giop",         label: "GIOP",         icon: Bone,            blurb: "Steroid-induced osteoporosis algorithm",             group: "Bone & Endocrine" },
  { id: "steroids",     label: "Steroids",     icon: FlaskConical,    blurb: "Potency · taper · monitoring",                       group: "Bone & Endocrine" },
];

function AppSidebar({
  active,
  onNavigate,
}: {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
}) {
  const grouped = useMemo(() => {
    const g: Record<string, typeof SECTIONS> = {};
    SECTIONS.forEach((s) => {
      (g[s.group] ||= []).push(s);
    });
    return g;
  }, []);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Stethoscope className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold tracking-tight">DiabetesRx</div>
            <div className="truncate text-[11px] text-muted-foreground">Clinical reference · ADA 2026</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(grouped).map(([group, items]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
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
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        <span>{s.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function DiabetesTab() {
  const [open, setOpen] = useState<Record<SectionId, boolean>>(
    () => Object.fromEntries(SECTIONS.map((s) => [s.id, s.id === "overview"])) as Record<SectionId, boolean>,
  );
  const [active, setActive] = useState<SectionId>("overview");

  const toggle = (id: SectionId) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: SectionId) => {
    // Open only the clicked section; collapse all others.
    setOpen(Object.fromEntries(SECTIONS.map((s) => [s.id, s.id === id])) as Record<SectionId, boolean>);
    setActive(id);
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
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger aria-label="Toggle navigation" />
                <div className="hidden min-w-0 md:block">
                  <h1 className="truncate font-display text-base font-semibold tracking-tight">
                    DiabetesRx
                  </h1>
                  <p className="truncate text-xs text-muted-foreground">
                    Clinical reference · ADA 2026
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 no-print">
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

          {/* Hero */}
          <section
            aria-labelledby="hero-title"
            className="border-b border-border bg-gradient-to-br from-primary/[0.06] via-background to-background px-3 py-6 sm:px-6 md:py-8"
          >
            <div className="mx-auto max-w-6xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                <Activity className="h-3 w-3" aria-hidden /> For clinicians &amp; medical students
              </div>
              <h2
                id="hero-title"
                className="font-display text-2xl font-semibold tracking-tight md:text-3xl"
              >
                Diabetes at the point of care.
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                Bedside-ready calculators, ADA 2026 diagnosis, insulin &amp; GLP-1 dosing, CKD-safe
                prescribing, and a complete DKA/HHS management tool — no fluff.
              </p>
            </div>
          </section>

          {/* Sections */}
          <main
            id="main-content"
            className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-3 py-6 sm:px-6 md:py-8"
          >
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isOpen = open[s.id];
              return (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-heading`}
                  className="scroll-mt-28"
                >
                  <button
                    onClick={() => toggle(s.id)}
                    aria-expanded={isOpen}
                    aria-controls={`${s.id}-panel`}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-all sm:px-4 sm:py-3",
                      "hover:border-primary/30 hover:bg-accent/40 hover:shadow-sm",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                          isOpen
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary group-hover:bg-primary/15",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h3
                          id={`${s.id}-heading`}
                          className="truncate font-display text-[15px] font-semibold sm:text-base"
                        >
                          {s.label}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">{s.blurb}</p>
                      </div>
                    </div>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        isOpen ? "rotate-0" : "-rotate-90",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div id={`${s.id}-panel`} role="region" className="mt-3">
                      <CollapseAllProvider>
                        <Suspense fallback={<PanelFallback />}>
                          {s.id === "overview" && <DiabetesOverview />}
                          {s.id === "assessment" && <DiabetesAssessment />}
                          {s.id === "treatment" && <DiabetesTreatment />}
                          {s.id === "icodec" && <IcodecTitration />}
                          {s.id === "meal-planner" && <MealPlanner />}
                          {s.id === "osteoporosis" && <OsteoporosisApp />}
                          {s.id === "osteomalacia" && <OsteomalaciaApp />}
                          {s.id === "giop" && <GiopApp />}
                          {s.id === "steroids" && <SteroidApp />}
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
              DiabetesRx · Reference tool, not a substitute for clinical judgment. Verify dosing
              against local formulary.
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
