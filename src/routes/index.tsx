import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity, BookOpen, Calculator, Pill, Stethoscope, ChevronDown, ChevronRight,
  Maximize2, Minimize2, UtensilsCrossed, Bone, FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DiabetesOverview from "@/components/diabetes/DiabetesOverview";
import DiabetesAssessment from "@/components/diabetes/DiabetesAssessment";
import DiabetesTreatment from "@/components/diabetes/DiabetesTreatment";
import MealPlanner from "@/components/diabetes/MealPlanner";
import IcodecTitration from "@/components/diabetes/IcodecTitration";
import OsteoporosisApp from "@/components/diabetes/OsteoporosisApp";
import OsteomalaciaApp from "@/components/diabetes/OsteomalaciaApp";
import SteroidApp from "@/components/diabetes/SteroidApp";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: DiabetesTab,
});

type SectionId = "overview" | "assessment" | "treatment" | "icodec" | "meal-planner" | "osteoporosis" | "osteomalacia" | "steroids";

const SECTIONS: { id: SectionId; label: string; icon: typeof BookOpen; blurb: string }[] = [
  { id: "overview",     label: "Overview",     icon: BookOpen,         blurb: "Classification · pathophysiology · diagnosis · targets" },
  { id: "assessment",   label: "Assessment",   icon: Calculator,       blurb: "BMI · HbA1c · insulin dosing · glucose patterns" },
  { id: "treatment",    label: "Treatment",    icon: Pill,             blurb: "Algorithm · GLP-1 · insulin · DKA/HHS · CKD · geriatric" },
  { id: "icodec",       label: "Icodec",       icon: Activity,         blurb: "Once-weekly icodec initiation + CGM-based titration" },
  { id: "meal-planner", label: "Meal planner", icon: UtensilsCrossed,  blurb: "Pattern-aware carb/meal prescriptions by DM category" },
  { id: "osteoporosis", label: "Osteoporosis", icon: Bone,             blurb: "Post-fracture risk stratification & drug selection" },
  { id: "osteomalacia", label: "Osteomalacia", icon: Bone,             blurb: "Workup & vitamin D–centered treatment by etiology" },
  { id: "steroids",     label: "Steroids",     icon: FlaskConical,     blurb: "Potency converter · reference · tapering & monitoring" },
];

function DiabetesTab() {
  const [open, setOpen] = useState<Record<SectionId, boolean>>(
    () => Object.fromEntries(SECTIONS.map((s) => [s.id, true])) as Record<SectionId, boolean>,
  );
  const [active, setActive] = useState<SectionId>("overview");

  const allOpen = Object.values(open).every(Boolean);
  const toggle = (id: SectionId) => setOpen((s) => ({ ...s, [id]: !s[id] }));
  const setAll = (v: boolean) =>
    setOpen(Object.fromEntries(SECTIONS.map((s) => [s.id, v])) as Record<SectionId, boolean>);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
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
    setOpen((s) => ({ ...s, [id]: true }));
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">DiabetesRx</h1>
              <p className="text-xs text-muted-foreground">Clinical reference · ADA 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            <a
              href="#meal-planner"
              className="hidden items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent md:inline-flex"
            >
              <UtensilsCrossed className="h-3.5 w-3.5" /> Meal planner
            </a>
            <Button variant="outline" size="sm" onClick={() => setAll(!allOpen)}>
              {allOpen ? <Minimize2 className="mr-1 h-4 w-4" /> : <Maximize2 className="mr-1 h-4 w-4" />}
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
          </div>
        </div>
        {/* section nav */}
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto border-t border-border px-4 py-2 no-print">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />{s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Activity className="h-3 w-3" /> For clinicians & medical students
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Diabetes at the point of care.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Bedside-ready calculators, ADA 2026 diagnosis, insulin & GLP-1 dosing, CKD-safe
              prescribing, and a complete DKA/HHS management tool — no fluff.
            </p>
          </div>
        </div>
      </section>

      {/* Sections */}
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-24">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isOpen = open[s.id];
          return (
            <div key={s.id} id={s.id} className="scroll-mt-32">
              <button
                onClick={() => toggle(s.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.blurb}</div>
                  </div>
                </div>
                {isOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="mt-3">
                  {s.id === "overview" && <DiabetesOverview />}
                  {s.id === "assessment" && <DiabetesAssessment />}
                  {s.id === "treatment" && <DiabetesTreatment />}
                  {s.id === "icodec" && <IcodecTitration />}
                  {s.id === "meal-planner" && <MealPlanner />}
                  {s.id === "osteoporosis" && <OsteoporosisApp />}
                  {s.id === "osteomalacia" && <OsteomalaciaApp />}
                  {s.id === "steroids" && <SteroidApp />}
                </div>
              )}
            </div>
          );
        })}
      </main>

      <footer className="border-t border-border bg-muted/30 py-6 text-center text-xs text-muted-foreground no-print">
        <div className="mx-auto max-w-6xl px-4">
          DiabetesRx · Reference tool, not a substitute for clinical judgment. Verify dosing against local formulary.
        </div>
      </footer>
    </div>
  );
}
