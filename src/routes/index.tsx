import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Activity, BookOpen, Calculator, Pill, Stethoscope, ChevronDown,
  UtensilsCrossed, Bone, FlaskConical, Printer, Scale, Gauge, Search, X,
  ChevronsDownUp, ChevronsUpDown, TestTube, Zap, Brain, Droplets, Heart, AlertTriangle, Code2, Footprints,
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

const DiabetesOverview   = lazy(() => import("@/components/diabetes/DiabetesOverview"));
const DiabetesAssessment = lazy(() => import("@/components/diabetes/DiabetesAssessment"));
const DiabetesTreatment  = lazy(() => import("@/components/diabetes/DiabetesTreatment"));
const DiabetesComplications = lazy(() => import("@/components/diabetes/DiabetesComplications"));
const DiabeticNeuropathy = lazy(() => import("@/components/diabetes/DiabeticNeuropathy"));
const NiceAlgorithms     = lazy(() => import("@/components/diabetes/NiceAlgorithms"));
const IcodecTitration    = lazy(() => import("@/components/diabetes/IcodecTitration"));
const MealPlanner        = lazy(() => import("@/components/diabetes/MealPlanner"));
const ObesityApp         = lazy(() => import("@/components/diabetes/ObesityApp"));
const OsteoporosisApp    = lazy(() => import("@/components/diabetes/OsteoporosisApp"));
const FraxApp            = lazy(() => import("@/components/diabetes/FraxApp"));
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
const VitaminDApp        = lazy(() => import("@/components/diabetes/VitaminDApp"));
const AvnApp           = lazy(() => import("@/components/diabetes/AvnApp"));
const DevPage           = lazy(() => import("@/routes/dev").then(m => ({ default: m.Route.options.component as React.ComponentType<any> })));

const DiabetesManagement = () => (
  <div className="space-y-6">
    <GlucoPlan />
    <NiceAlgorithms />
  </div>
);

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
  | "overview" | "assessment" | "treatment" | "complications" | "neuropathy" | "icodec" | "glp1-screening" | "diabetes-management"
  | "meal-planner" | "obesity" | "osteoporosis" | "frax" | "osteomalacia" | "vitamin-d" | "avn" | "steroids" | "thyroid" | "calcium" | "parathyroid" | "adrenal" | "pituitary" | "lipid"
  | "dev";

type GroupName = "Diabetes" | "Obesity" | "Nutrition" | "Bone & Endocrine" | "Developer";

type SectionMeta = {
  id: SectionId; label: string; icon: typeof BookOpen; blurb: string;
  group: GroupName; keywords: string; tone: string;
};

const SECTIONS: SectionMeta[] = [
  { id: "overview", label: "Overview", icon: BookOpen, blurb: "Classification · diagnosis · targets", group: "Diabetes", keywords: "ada type 1 type 2 mody lada teplizumab golimumab", tone: "bg-[oklch(0.94_0.10_25)] text-[oklch(0.35_0.18_25)] dark:bg-[oklch(0.30_0.10_25)] dark:text-[oklch(0.90_0.10_25)]" },
  { id: "neuropathy", label: "Neuropathy", icon: Footprints, blurb: "IWGDF screening · ulcer grading · WIfI", group: "Diabetes", keywords: "neuropathy iwgdf lops pad foot ulcer wagner wifi screening deformity amputation esrd gangrene monofilament", tone: "bg-[oklch(0.94_0.10_145)] text-[oklch(0.32_0.12_145)] dark:bg-[oklch(0.30_0.08_145)] dark:text-[oklch(0.90_0.08_145)]" },
];

const GROUP_ORDER: GroupName[] = ["Diabetes", "Obesity", "Nutrition", "Bone & Endocrine", "Developer"];
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

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return <>
    {text.slice(0, idx)}<mark className="hl">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}
  </>;
}

function matchesQuery(s: SectionMeta, q: string) {
  if (!q) return true;
  const n = q.toLowerCase();
  return s.label.toLowerCase().includes(n) || s.blurb.toLowerCase().includes(n) || s.keywords.includes(n) || s.group.toLowerCase().includes(n);
}

import { ensureContrast, useThemeColors } from "@/lib/accessibility";

function AppSidebar({ active, onNavigate }: { active: SectionId | null; onNavigate: (id: SectionId) => void }) {
  const [q, setQ] = useState("");
  const group = useGroupState();
  const colors = useThemeColors();
  const accessibleFg = useMemo(() => ensureContrast(colors.foreground, colors.background), [colors.foreground, colors.background]);
  const accessibleMuted = useMemo(() => ensureContrast(colors.mutedForeground, colors.background), [colors.mutedForeground, colors.background]);
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
            <div className="truncate font-display text-sm font-semibold tracking-tight" style={{ color: accessibleFg }}>Endocrine Rx</div>
            <div className="truncate text-[11px]" style={{ color: accessibleMuted }}>Clinical reference · ADA 2026</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {GROUP_ORDER.filter((g) => grouped[g]?.length).map((g) => {
          const items = grouped[g]!;
          const isCollapsed = searching ? false : group.isCollapsed(g);
          return (
            <SidebarGroup key={g}>
              <SidebarGroupLabel>{g}</SidebarGroupLabel>
              {!isCollapsed && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((s) => {
                      const Icon = s.icon;
                      return (
                        <SidebarMenuItem key={s.id}>
                          <SidebarMenuButton isActive={active === s.id} onClick={() => onNavigate(s.id)}>
                            <Icon className="h-4 w-4" />
                            <span>{s.label}</span>
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
      </SidebarContent>
    </Sidebar>
  );
}

function DiabetesTab() {
  const [active, setActive] = useState<SectionId | null>("neuropathy");
  const colors = useThemeColors();
  const accessibleFg = useMemo(() => ensureContrast(colors.foreground, colors.background), [colors.foreground, colors.background]);
  const accessibleMuted = useMemo(() => ensureContrast(colors.mutedForeground, colors.background), [colors.mutedForeground, colors.background]);
  const scrollTo = (id: SectionId) => setActive(id);
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full bg-background">
        <Toaster richColors position="top-right" />
        <AppSidebar active={active} onNavigate={scrollTo} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 glass-panel px-4 py-3">
            <h1 className="font-display text-base font-semibold" style={{ color: accessibleFg }}>Endocrine Rx</h1>
          </header>
          <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
            <Suspense fallback={<PanelFallback />}>
              {active === "neuropathy" && <DiabeticNeuropathy />}
              {active === "overview" && <DiabetesOverview />}
            </Suspense>
          </main>
          <footer className="border-t py-4 text-center text-xs" style={{ color: accessibleMuted }}>
            Endocrine Rx · Reference tool, not a substitute for clinical judgment.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
