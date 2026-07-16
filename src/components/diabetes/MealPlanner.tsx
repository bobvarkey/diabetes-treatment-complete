import { useMemo, useState } from "react";
import { UtensilsCrossed, Activity, Scale } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Category =
  | "T1DM"
  | "T2DM"
  | "LADA"
  | "T3c"
  | "GDM"
  | "Prediabetes"
  | "MRDM";

const CATEGORIES: { id: Category; label: string; blurb: string }[] = [
  { id: "T1DM", label: "Type 1 DM", blurb: "Carb-counted, insulin-matched, hypo-safe" },
  { id: "LADA", label: "LADA (1.5)", blurb: "Early insulin + moderate carb, avoid SU" },
  { id: "T2DM", label: "Type 2 DM", blurb: "Low-GI, calorie-controlled, Mediterranean/DASH" },
  { id: "T3c", label: "T3c (pancreatogenic)", blurb: "Small frequent meals + enzymes + fat-soluble vits" },
  { id: "GDM", label: "Gestational DM", blurb: "175 g CHO/day min, 3 meals + 3 snacks" },
  { id: "Prediabetes", label: "Prediabetes", blurb: "7% weight loss, DPP-style, high fibre" },
  { id: "MRDM", label: "MRDM / Type 5", blurb: "High-protein, micronutrient-dense refeeding" },
];

// Pattern recognition rules (see AACE/ADA CGM AGP interpretation)
type PatternKey =
  | "dawn"
  | "post_breakfast"
  | "post_lunch"
  | "post_dinner"
  | "nocturnal_hypo"
  | "somogyi"
  | "high_variability"
  | "fasting_hyper"
  | "on_target";

const PATTERNS: { id: PatternKey; label: string; hint: string }[] = [
  { id: "dawn", label: "Dawn phenomenon (rising 04–08 h)", hint: "Fasting > pre-dinner + ≥ 20 mg/dL rise 04→08 h" },
  { id: "fasting_hyper", label: "Persistent fasting hyperglycemia", hint: "FBG > 130 mg/dL on ≥ 3 days" },
  { id: "post_breakfast", label: "Post-breakfast spike (> 180 at 1–2 h)", hint: "Consider CHO load + rapid insulin timing" },
  { id: "post_lunch", label: "Post-lunch spike", hint: "Often heaviest CHO meal in South Asian diets" },
  { id: "post_dinner", label: "Post-dinner spike / late CHO", hint: "Rice-heavy dinners; consider split-dose or swap" },
  { id: "nocturnal_hypo", label: "Nocturnal hypoglycemia (< 70 between 00–06 h)", hint: "TBR ≥ 1 % overnight" },
  { id: "somogyi", label: "Somogyi (nocturnal low → AM rebound)", hint: "Confirmed by CGM; reduce basal, add snack" },
  { id: "high_variability", label: "High glycemic variability (CV > 36 %)", hint: "Erratic meals, gastroparesis, alcohol" },
  { id: "on_target", label: "On target (TIR ≥ 70 %)", hint: "Maintain, preserve variety" },
];

type Plan = {
  kcal: number;
  choPct: number;
  proPct: number;
  fatPct: number;
  choGramsPerMeal: { breakfast: number; lunch: number; dinner: number; snack: number };
  swaps: string[];
  timing: string[];
  monitoring: string[];
};

function baseTargetsFor(cat: Category, weightKg: number, activity: number): Plan {
  // kcal/kg by category
  const kcalKg: Record<Category, number> = {
    T1DM: 30, LADA: 28, T2DM: 25, T3c: 30, GDM: 30, Prediabetes: 22, MRDM: 35,
  };
  const kcal = Math.round(kcalKg[cat] * weightKg * activity);
  const macro: Record<Category, [number, number, number]> = {
    T1DM:        [45, 20, 35],
    LADA:        [40, 25, 35],
    T2DM:        [40, 25, 35],
    T3c:         [45, 20, 35], // + enzymes; fat as tolerated
    GDM:         [40, 25, 35], // ≥ 175 g CHO/day
    Prediabetes: [40, 25, 35],
    MRDM:        [50, 25, 25], // high protein refeeding, moderate fat
  };
  const [c, p, f] = macro[cat];
  const totalCho = Math.round((kcal * c / 100) / 4);
  // Meal CHO split (g) — 25/30/30/15
  const chogm = {
    breakfast: Math.round(totalCho * 0.25),
    lunch:     Math.round(totalCho * 0.30),
    dinner:    Math.round(totalCho * 0.30),
    snack:     Math.round(totalCho * 0.15),
  };
  const baseSwaps = [
    "Swap white rice → brown/red rice or quinoa (½ portion + dal + veg)",
    "Swap wheat roti → millet (bajra/ragi/jowar) roti (GI ↓)",
    "Add 25–30 g fibre/day: leafy veg, legumes, chia/flax",
    "Protein at each meal (dal, egg, paneer, fish, chicken) — blunts spike",
  ];
  const catSwaps: Record<Category, string[]> = {
    T1DM: ["Carb-count each meal; use ICR (start 1 U : 10–15 g)", "Pre-bolus rapid insulin 15 min before meal for < 180 at 2 h"],
    LADA: ["Prefer basal + prandial early; avoid sulfonylureas"],
    T2DM: ["Mediterranean or DASH template; olive oil, nuts, fish 2×/wk"],
    T3c:  ["3 meals + 2–3 snacks; pancreatic enzymes with each meal", "Fat-soluble vit A/D/E/K + B12; avoid alcohol"],
    GDM:  ["Min 175 g CHO/day, ≥ 71 g protein; 3 meals + 3 snacks", "Bedtime snack: 15 g CHO + protein to prevent starvation ketosis"],
    Prediabetes: ["DPP goal: 7 % body-weight loss, 150 min/wk activity", "≥ 14 g fibre / 1000 kcal"],
    MRDM: ["Refeed cautiously (avoid refeeding syndrome)", "High-quality protein 1.2–1.5 g/kg; supplement Zn, Mg, PO4, thiamine"],
  };
  return {
    kcal, choPct: c, proPct: p, fatPct: f,
    choGramsPerMeal: chogm,
    swaps: [...baseSwaps, ...catSwaps[cat]],
    timing: [
      "Consistent meal timings; do not skip breakfast",
      "Finish dinner ≥ 3 h before bed",
      "Post-meal 10 min walk (lowers 1-h PPG ~ 20 mg/dL)",
    ],
    monitoring: [
      "Log FBG, 2-h PPG at rotating meals",
      cat === "T1DM" || cat === "LADA" ? "CGM preferred; target TIR ≥ 70 %" : "Consider intermittent CGM every 3 months",
    ],
  };
}

function applyPatternAdjustments(plan: Plan, patterns: Set<PatternKey>, cat: Category): Plan {
  const p = { ...plan, choGramsPerMeal: { ...plan.choGramsPerMeal }, swaps: [...plan.swaps], timing: [...plan.timing], monitoring: [...plan.monitoring] };

  if (patterns.has("dawn")) {
    p.choGramsPerMeal.breakfast = Math.max(15, p.choGramsPerMeal.breakfast - 10);
    p.timing.push("Front-load protein at breakfast (eggs, paneer, Greek yogurt); delay CHO to mid-morning");
    p.swaps.push("Consider metformin XR at bedtime or basal titration for dawn phenomenon");
  }
  if (patterns.has("fasting_hyper")) {
    p.timing.push("No CHO within 3 h of bed; bedtime protein snack (~ 10 g)");
    p.monitoring.push("Titrate basal insulin 2 U every 3 days until FBG 80–130 (safety-gated)");
  }
  if (patterns.has("post_breakfast")) {
    p.choGramsPerMeal.breakfast = Math.max(15, p.choGramsPerMeal.breakfast - 15);
    p.swaps.push("Breakfast: swap cereal/paratha → besan chilla, moong dosa, veg omelette");
    if (cat === "T1DM" || cat === "LADA") p.timing.push("Pre-bolus rapid insulin 20 min before breakfast");
  }
  if (patterns.has("post_lunch")) {
    p.choGramsPerMeal.lunch -= 10;
    p.swaps.push("Lunch: ½ cup rice + 2 katori dal + 2 katori sabzi + salad; add curd");
  }
  if (patterns.has("post_dinner")) {
    p.choGramsPerMeal.dinner = Math.max(15, p.choGramsPerMeal.dinner - 15);
    p.swaps.push("Dinner: 1 millet roti + paneer/chicken + sabzi; avoid rice at night");
    p.timing.push("Split dinner: soup/salad 19:00, main 20:00; walk 15 min after");
  }
  if (patterns.has("nocturnal_hypo") || patterns.has("somogyi")) {
    p.choGramsPerMeal.snack = Math.max(20, p.choGramsPerMeal.snack + 5);
    p.timing.push("Bedtime snack 15–20 g slow CHO + protein (milk + nuts, whole-grain toast + peanut butter)");
    p.monitoring.push("Reduce basal 10–20 % and re-check overnight CGM; avoid alcohol at dinner");
  }
  if (patterns.has("high_variability")) {
    p.timing.push("Fix meal times; consistent CHO per meal (± 10 g); avoid alcohol on empty stomach");
    if (cat === "T3c") p.swaps.push("Rule out enzyme under-dosing; give lipase with every meal & snack");
  }
  if (patterns.has("on_target")) {
    p.monitoring.push("Maintain plan; recheck HbA1c in 3 months; preserve dietary variety");
  }
  return p;
}

type Cuisine = "generic" | "indian" | "kerala";

const CUISINE_SWAPS: Record<Exclude<Cuisine, "generic">, string[]> = {
  indian: [
    "Prefer millet rotis (bajra/ragi/jowar) over wheat; limit white rice to ½ cup/meal",
    "Dal + sabzi + curd at every main meal; add methi/palak 3–4×/wk",
    "Swap sooji/poha → besan chilla, moong dal dosa, or veg upma with extra vegetables",
    "Snack: roasted chana, sprouts chaat, or a handful of nuts (avoid namkeen/biscuits)",
    "Limit ghee to 1 tsp/meal; mustard/groundnut oil for cooking; avoid vanaspati",
  ],
  kerala: [
    "Swap white parboiled rice (choru) → red matta rice or brown kuthari; keep to ½–¾ cup/meal",
    "Prefer puttu + kadala curry or idiyappam + egg/veg stew over appam with sweetened coconut milk",
    "Fish (sardine/mackerel) 3–4×/wk — grilled or curried, not deep-fried; limit beef fry, pork, and fried snacks",
    "Thoran / aviyal / olan at each meal for fibre; keep coconut chutney portion small",
    "Replace payasam / banana chips / pazham pori with tender coconut water, unsweetened moru, or a small nendran piece",
    "Cap coconut oil at ~2 tsp/day; steam (puttu, idiyappam, idli) rather than fry",
  ],
};

function samplePlate(_cat: Category, chog: number, cuisine: Cuisine = "generic"): string {
  if (cuisine === "kerala") {
    if (chog <= 25) return `1 small puttu (½ cup) + kadala curry + thoran (~${chog} g CHO)`;
    if (chog <= 40) return `½ cup red matta rice + fish curry + thoran + aviyal + moru (~${chog} g CHO)`;
    return `¾ cup red matta rice + fish/chicken curry + thoran + aviyal + salad + moru (~${chog} g CHO)`;
  }
  if (cuisine === "indian") {
    if (chog <= 25) return `1 millet roti + 1 katori dal + 1 katori sabzi + salad (~${chog} g CHO)`;
    if (chog <= 40) return `1½ millet roti + ½ cup brown rice + dal + sabzi + curd + salad (~${chog} g CHO)`;
    return `2 millet rotis + ¾ cup brown rice + dal + sabzi + paneer/chicken + curd + salad (~${chog} g CHO)`;
  }
  if (chog <= 25) return `1 whole-grain wrap + lentil/bean stew + salad (~${chog} g CHO)`;
  if (chog <= 40) return `½ cup whole grain + protein (fish/chicken/tofu) + 2 veg sides + salad (~${chog} g CHO)`;
  return `¾ cup whole grain + protein + 2 veg sides + curd/yogurt + salad (~${chog} g CHO)`;
}

export default function MealPlanner() {
  const [cat, setCat] = useState<Category>("T2DM");
  const [wt, setWt] = useState("70");
  const [activity, setActivity] = useState("1.3");
  const [cuisine, setCuisine] = useState<Cuisine>("indian");
  const [patterns, setPatterns] = useState<Set<PatternKey>>(new Set());
  const [cgmNotes, setCgmNotes] = useState("");

  const togglePattern = (k: PatternKey) => {
    const n = new Set(patterns);
    n.has(k) ? n.delete(k) : n.add(k);
    setPatterns(n);
  };

  const plan = useMemo(() => {
    const base = baseTargetsFor(cat, parseFloat(wt) || 70, parseFloat(activity) || 1.3);
    const withPatterns = applyPatternAdjustments(base, patterns, cat);
    if (cat === "T2DM" && cuisine !== "generic") {
      return { ...withPatterns, swaps: [...withPatterns.swaps, ...CUISINE_SWAPS[cuisine]] };
    }
    return withPatterns;
  }, [cat, wt, activity, patterns, cuisine]);

  return (
    <div id="meal-planner" className="space-y-5">
      <SectionCard
        title="Diabetes meal planner"
        subtitle="Pattern-aware, category-specific carb/meal suggestions"
        icon={<UtensilsCrossed className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label>Diabetes category</Label>
            <Select value={cat} onValueChange={(v) => setCat(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label} — {c.blurb}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value)} />
          </div>
          <div>
            <Label>Activity factor</Label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.2">Sedentary (1.2)</SelectItem>
                <SelectItem value="1.3">Light (1.3)</SelectItem>
                <SelectItem value="1.5">Moderate (1.5)</SelectItem>
                <SelectItem value="1.7">Heavy (1.7)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {cat === "T2DM" && (
            <div className="md:col-span-4">
              <Label>Cuisine template (T2DM)</Label>
              <Select value={cuisine} onValueChange={(v) => setCuisine(v as Cuisine)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">Generic (low-GI / Mediterranean)</SelectItem>
                  <SelectItem value="indian">Indian (North / mixed) — millets, dal, sabzi</SelectItem>
                  <SelectItem value="kerala">Kerala — red matta rice, fish, thoran, puttu</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Adds cuisine-specific swaps and sample plates. Switch back to Generic for non-Indian patients.
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Glucose pattern recognition" icon={<Activity className="h-5 w-5" />}>
        <p className="text-muted-foreground">Select patterns from CGM / SMBG log (last 7–14 days). Plan updates live.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PATTERNS.map((p) => {
            const on = patterns.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePattern(p.id)}
                className={
                  "rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                  (on ? "border-primary bg-primary/10" : "border-border hover:bg-accent/40")
                }
              >
                <div className="font-medium">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.hint}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <Label>Optional CGM notes (TIR, TBR, AGP shape)</Label>
          <Textarea rows={2} value={cgmNotes} onChange={(e) => setCgmNotes(e.target.value)} placeholder="e.g. TIR 52 %, TBR 3 %, nocturnal drift 02–05 h" />
        </div>
      </SectionCard>

      <SectionCard title="Prescription — daily targets" icon={<Scale className="h-5 w-5" />}>
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Energy" value={`${plan.kcal}`} hint="kcal/day" />
          <Stat label="CHO" value={`${plan.choPct}%`} hint={`${Math.round(plan.kcal * plan.choPct / 400)} g`} />
          <Stat label="Protein" value={`${plan.proPct}%`} hint={`${Math.round(plan.kcal * plan.proPct / 400)} g`} />
          <Stat label="Fat" value={`${plan.fatPct}%`} hint={`${Math.round(plan.kcal * plan.fatPct / 900)} g`} />
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <div className="rounded-md border border-border p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meal CHO distribution</div>
            <KeyRow k="Breakfast" v={`${plan.choGramsPerMeal.breakfast} g`} mono />
            <KeyRow k="Lunch" v={`${plan.choGramsPerMeal.lunch} g`} mono />
            <KeyRow k="Dinner" v={`${plan.choGramsPerMeal.dinner} g`} mono />
            <KeyRow k="Snack(s)" v={`${plan.choGramsPerMeal.snack} g`} mono />
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sample plate ({cat === "T2DM" && cuisine === "kerala" ? "Kerala" : cat === "T2DM" && cuisine === "generic" ? "generic" : "Indian"} template)
            </div>
            <KeyRow k="Breakfast" v={samplePlate(cat, plan.choGramsPerMeal.breakfast, cat === "T2DM" ? cuisine : "indian")} />
            <KeyRow k="Lunch" v={samplePlate(cat, plan.choGramsPerMeal.lunch, cat === "T2DM" ? cuisine : "indian")} />
            <KeyRow k="Dinner" v={samplePlate(cat, plan.choGramsPerMeal.dinner, cat === "T2DM" ? cuisine : "indian")} />
            <KeyRow k="Snack" v={cat === "T2DM" && cuisine === "kerala" ? `Tender coconut water + steamed groundnuts (~${plan.choGramsPerMeal.snack} g CHO)` : `Fruit + nuts, or curd + seeds (~${plan.choGramsPerMeal.snack} g CHO)`} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Practical swaps & timing" tone="info">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Food swaps</div>
            <ul className="list-disc space-y-1 pl-5">{plan.swaps.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timing & activity</div>
            <ul className="list-disc space-y-1 pl-5">{plan.timing.map((s) => <li key={s}>{s}</li>)}</ul>
            <div className="mt-2 flex flex-wrap gap-1">
              {[...patterns].map((p) => <Pill key={p} tone="primary">{PATTERNS.find((x) => x.id === p)?.label}</Pill>)}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Monitoring & follow-up" tone="success">
        <ul className="list-disc space-y-1 pl-5">{plan.monitoring.map((s) => <li key={s}>{s}</li>)}</ul>
      </SectionCard>

      <Callout tone="warning" title="Clinician note">
        Recommendations are decision-support; individualise for renal/hepatic function, pregnancy, eating disorders,
        cultural preferences, and shared goals. Not a replacement for a registered dietitian consult.
      </Callout>
    </div>
  );
}
