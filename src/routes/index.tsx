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

// Lazy-load topic apps so each ships as its own chunk (only fetched when opened).
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

// Combined Diabetes Management component
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
      { title: "Endocrine Rx \u2014 Clinical Diabetes, Bone & Endocrine Reference" },
      { name: "description", content: "Bedside clinical reference: ADA 2026 diabetes diagnosis & treatment, insulin & GLP-1 dosing, DKA/HHS, CKD-safe prescribing, osteoporosis, GIOP, osteomalacia and steroid tapers." },
      { property: "og:title", content: "Endocrine Rx \u2014 Clinical Diabetes, Bone & Endocrine Reference" },
      { property: "og:description", content: "Interactive calculators and algorithms for diabetes, osteoporosis, GIOP, osteomalacia and glucocorticoid tapers \u2014 for clinicians and medical students." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://diabetes-treatment-complete.lovable.app/" },
      { property: "og:site_name", content: "Endocrine Rx" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Endocrine Rx \u2014 Clinical Diabetes, Bone & Endocrine Reference" },
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
  group: GroupName; keywords: string; tone: string; // tailwind bg/text for icon tile
};

const SECTIONS: SectionMeta[] = [
  { id: "overview",     label: "Overview",     icon: BookOpen,        blurb: "Classification \u00b7 diagnosis \u00b7 targets",           group: "Diabetes",         keywords: "ada type 1 type 2 mody lada teplizumab golimumab", tone: "bg-[oklch(0.94_0.10_25)] text-[oklch(0.35_0.18_25)] dark:bg-[oklch(0.30_0.10_25)] dark:text-[oklch(0.90_0.10_25)]" },
  { id: "assessment",   label: "Assessment",   icon: Calculator,      blurb: "HbA1c \u00b7 insulin dosing \u00b7 patterns",              group: "Diabetes",         keywords: "hba1c insulin tdd basal bolus correction", tone: "bg-[oklch(0.94_0.10_55)] text-[oklch(0.38_0.14_55)] dark:bg-[oklch(0.32_0.10_55)] dark:text-[oklch(0.90_0.10_55)]" },
  { id: "treatment",    label: "Treatment",    icon: Pill,            blurb: "Algorithm \u00b7 GLP-1 \u00b7 CKD",                        group: "Diabetes",         keywords: "metformin glp1 sglt2 ckd", tone: "bg-[oklch(0.94_0.10_350)] text-[oklch(0.38_0.18_350)] dark:bg-[oklch(0.32_0.10_350)] dark:text-[oklch(0.90_0.10_350)]" },
  { id: "complications", label: "Complications", icon: AlertTriangle,   blurb: "DKA \u00b7 HHS \u00b7 foot ulcers \u00b7 neuropathy", group: "Diabetes", keywords: "dka hhs euglycemic diabetic ketoacidosis hyperglycemic hyperosmolar jbds ada venous ph ketones bohb foot ulcer neuropathy wagner wifi iwgdf lops pad ischemia infection gangrene screening", tone: "bg-[oklch(0.94_0.10_30)] text-[oklch(0.38_0.18_30)] dark:bg-[oklch(0.32_0.10_30)] dark:text-[oklch(0.90_0.10_30)]" },
  { id: "neuropathy", label: "Neuropathy", icon: Footprints, blurb: "IWGDF screening \u00b7 ulcer grading \u00b7 WIfI", group: "Diabetes", keywords: "neuropathy iwgdf lops pad foot ulcer wagner wifi screening deformity amputation esrd gangrene monofilament", tone: "bg-[oklch(0.94_0.10_145)] text-[oklch(0.32_0.12_145)] dark:bg-[oklch(0.30_0.08_145)] dark:text-[oklch(0.90_0.08_145)]" },
  { id: "diabetes-management", label: "Diabetes Management", icon: Heart, blurb: "Care planning \u00b7 NICE algorithms \u00b7 ADA 2026", group: "Diabetes", keywords: "glucoplan decision support care plan ada 2026 management nice algorithms stepwise visual pathway ms dpp4 spi frailty ckd ascvd heart failure young onset cheat sheet infographic", tone: "bg-[oklch(0.94_0.10_0)] text-[oklch(0.38_0.18_0)] dark:bg-[oklch(0.32_0.10_0)] dark:text-[oklch(0.90_0.10_0)]" },
  { id: "obesity",      label: "Obesity",      icon: Scale,           blurb: "BMI \u00b7 ICMR \u00b7 waist \u00b7 MetS \u00b7 HOMA-IR",            group: "Obesity",          keywords: "bmi icmr waist metabolic homa obesity", tone: "bg-[oklch(0.94_0.10_15)] text-[oklch(0.38_0.18_15)] dark:bg-[oklch(0.32_0.10_15)] dark:text-[oklch(0.90_0.10_15)]" },

  { id: "meal-planner", label: "Meal planner", icon: UtensilsCrossed, blurb: "Carb & meal prescriptions",                       group: "Nutrition",        keywords: "meal carb indian kerala vegetarian", tone: "bg-[oklch(0.94_0.09_140)] text-[oklch(0.36_0.14_140)] dark:bg-[oklch(0.32_0.09_140)] dark:text-[oklch(0.90_0.10_140)]" },
  { id: "osteoporosis", label: "Osteoporosis", icon: Bone,            blurb: "Algorithm v2 \u00b7 risk \u00b7 treatment \u00b7 follow-up",    group: "Bone & Endocrine", keywords: "bone dxa denosumab bisphosphonate teriparatide giop osteoporosis algorithm", tone: "bg-[oklch(0.94_0.10_260)] text-[oklch(0.40_0.18_260)] dark:bg-[oklch(0.32_0.10_260)] dark:text-[oklch(0.90_0.10_260)]" },
  { id: "frax",         label: "FRAX calculator", icon: Calculator,   blurb: "10-year probability \u00b7 national thresholds",     group: "Bone & Endocrine", keywords: "frax fracture probability hip major osteoporotic threshold nogg", tone: "bg-[oklch(0.94_0.10_245)] text-[oklch(0.38_0.16_245)] dark:bg-[oklch(0.32_0.10_245)] dark:text-[oklch(0.90_0.10_245)]" },
  { id: "osteomalacia", label: "Osteomalacia", icon: Bone,            blurb: "Workup & vitamin D therapy",                     group: "Bone & Endocrine", keywords: "vitamin d calcium phosphate osteomalacia", tone: "bg-[oklch(0.94_0.10_200)] text-[oklch(0.38_0.14_200)] dark:bg-[oklch(0.32_0.10_200)] dark:text-[oklch(0.90_0.10_200)]" },
  { id: "vitamin-d",    label: "Vitamin D correction", icon: Droplets, blurb: "Loading & maintenance protocol",          group: "Bone & Endocrine", keywords: "vitamin d deficiency correction loading protocol cholecalciferol", tone: "bg-[oklch(0.94_0.10_45)] text-[oklch(0.38_0.16_45)] dark:bg-[oklch(0.32_0.10_45)] dark:text-[oklch(0.90_0.10_45)]" },
  { id: "avn",          label: "Avascular necrosis", icon: Bone,            blurb: "Pathogenesis \u00b7 SATS causes \u00b7 sites",             group: "Bone & Endocrine", keywords: "avn avascular necrosis bone death hip scaphoid trauma steroids alcohol sickle cell sats", tone: "bg-[oklch(0.94_0.10_260)] text-[oklch(0.40_0.18_260)] dark:bg-[oklch(0.32_0.10_260)] dark:text-[oklch(0.90_0.10_260)]" },
  { id: "steroids",     label: "Steroids",     icon: FlaskConical,    blurb: "Potency \u00b7 taper \u00b7 monitoring",                   group: "Bone & Endocrine", keywords: "prednisone taper cortisol hpa hydrocortisone", tone: "bg-[oklch(0.94_0.10_70)] text-[oklch(0.38_0.14_70)] dark:bg-[oklch(0.32_0.10_70)] dark:text-[oklch(0.90_0.10_70)]" },
  { id: "thyroid",      label: "Thyroid",      icon: Gauge,           blurb: "TFTs \u00b7 hypo/hyper \u00b7 storm \u00b7 nodules \u00b7 pregnancy", group: "Bone & Endocrine", keywords: "tsh t4 levothyroxine graves ted teprotumumab tirads", tone: "bg-[oklch(0.94_0.10_170)] text-[oklch(0.38_0.14_170)] dark:bg-[oklch(0.32_0.10_170)] dark:text-[oklch(0.90_0.10_170)]" },
  { id: "calcium",      label: "Calcium",      icon: TestTube,        blurb: "Total vs ionized \u00b7 stop albumin-adjusted Ca",   group: "Bone & Endocrine", keywords: "calcium ionized albumin payne corrected iof ifcc kdigo hypocalcemia hypercalcemia", tone: "bg-[oklch(0.94_0.10_230)] text-[oklch(0.38_0.16_230)] dark:bg-[oklch(0.32_0.10_230)] dark:text-[oklch(0.90_0.10_230)]" },
  { id: "parathyroid", label: "Parathyroid",  icon: TestTube,        blurb: "Ca \u00d7 PTH pattern \u00b7 hypo vs hyper vs secondary",   group: "Bone & Endocrine", keywords: "pth parathyroid hyperparathyroidism hypoparathyroidism fhh secondary calcium phosphate magnesium ckd vitamin d urine calcium", tone: "bg-[oklch(0.94_0.10_310)] text-[oklch(0.38_0.16_310)] dark:bg-[oklch(0.32_0.10_310)] dark:text-[oklch(0.90_0.10_310)]" },
  { id: "pituitary",   label: "Pituitary",    icon: Brain,           blurb: "Micro/macroadenoma \u00b7 MEN \u00b7 polyglandular",        group: "Bone & Endocrine", keywords: "pituitary adenoma microadenoma macroadenoma prolactinoma acromegaly cushing apoplexy men1 men2 men4 aps apeced schmidt polyglandular hypopituitarism", tone: "bg-[oklch(0.94_0.10_280)] text-[oklch(0.38_0.16_280)] dark:bg-[oklch(0.32_0.10_280)] dark:text-[oklch(0.90_0.10_280)]" },
  { id: "adrenal",      label: "Adrenal axis", icon: Zap,             blurb: "Cushing \u00b7 Addison \u00b7 ACTH stim \u00b7 DST \u00b7 LNSC \u00b7 UFC", group: "Bone & Endocrine", keywords: "cushing addison adrenal insufficiency cortisol acth dst lnsc ufc dexamethasone stimulation crisis", tone: "bg-[oklch(0.94_0.10_100)] text-[oklch(0.38_0.16_100)] dark:bg-[oklch(0.32_0.10_100)] dark:text-[oklch(0.90_0.10_100)]" },
  { id: "lipid",        label: "Lipids",       icon: Droplets,        blurb: "Targets \u00b7 statins \u00b7 FH \u00b7 PCSK9i \u00b7 TG",            group: "Bone & Endocrine", keywords: "ldl hdl triglyceride statin ezetimibe pcsk9 inclisiran bempedoic acid icosapent familial hypercholesterolemia", tone: "bg-[oklch(0.94_0.10_330)] text-[oklch(0.38_0.18_330)] dark:bg-[oklch(0.32_0.10_330)] dark:text-[oklch(0.90_0.10_330)]" },
  { id: "dev",          label: "Dev Tools",    icon: Code2,           blurb: "Internal debugging & mock bridge",               group: "Developer",        keywords: "dev developer debug mock revenuecat wrapper bridge premium", tone: "bg-[oklch(0.94_0_0)] text-[oklch(0.35_0_0)] dark:bg-[oklch(0.30_0_0)] dark:text-[oklch(0.90_0_0)]" },
];
