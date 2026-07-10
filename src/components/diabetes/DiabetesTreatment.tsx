import { SectionCard, KeyRow, Pill, Callout } from "./shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill as PillIcon, ClipboardList, ShieldAlert, Users, Activity } from "lucide-react";
import InsulinGuide from "./InsulinGuide";
import HyperglycemicEmergencySection from "./HyperglycemicEmergencySection";

function TreatmentAlgorithm() {
  return (
    <SectionCard title="ADA 2026 treatment algorithm" subtitle="Person-centred, complication-driven — not stepped by A1c alone" icon={<Activity className="h-5 w-5" />}>
      <ol className="list-decimal space-y-2 pl-5">
        <li><b>Lifestyle + metformin</b> for all T2DM (unless contraindicated). Target ≥5–10 % weight loss.</li>
        <li><b>Presence of ASCVD or high risk:</b> add GLP-1 RA with proven CV benefit (semaglutide, dulaglutide, liraglutide) <i>or</i> SGLT2i (empagliflozin, canagliflozin).</li>
        <li><b>Heart failure (any EF):</b> SGLT2i first-line (dapagliflozin, empagliflozin).</li>
        <li><b>CKD (eGFR ≥20, ACR ≥200):</b> SGLT2i + finerenone; add GLP-1 RA if further A1c/weight reduction needed.</li>
        <li><b>Weight management priority:</b> tirzepatide &gt; semaglutide &gt; dulaglutide/liraglutide &gt; SGLT2i.</li>
        <li><b>Cost-limited:</b> metformin + SU + basal insulin remains valid but higher hypo & weight gain.</li>
        <li><b>A1c &gt; 10 % or symptomatic:</b> start insulin ± GLP-1 RA up front.</li>
      </ol>
      <Callout tone="info" title="2026 update">
        Early combination therapy at diagnosis (metformin + GLP-1 RA + SGLT2i) is now preferred over sequential add-on
        for most T2DM patients with organ risk, based on VERIFY, SURPASS, FLOW, and SELECT trial data.
      </Callout>
    </SectionCard>
  );
}

function GLP1Guide() {
  const rows = [
    ["Liraglutide", "Victoza", "Daily SC", "0.6 → 1.2 → 1.8 mg", "-1.0 to -1.5", "-3 to -6", "LEADER: ↓ MACE, ↓ renal composite"],
    ["Semaglutide", "Ozempic / Wegovy", "Weekly SC", "0.25 → 0.5 → 1.0 → 2.0 mg", "-1.5 to -2.0", "-6 to -15", "SUSTAIN-6, SELECT: ↓ MACE, ↓ HF hosp"],
    ["Semaglutide oral", "Rybelsus", "Daily PO (fasting)", "3 → 7 → 14 mg", "-1.0 to -1.5", "-3 to -5", "PIONEER-6: CV neutral"],
    ["Dulaglutide", "Trulicity", "Weekly SC", "0.75 → 1.5 → 3.0 → 4.5 mg", "-1.0 to -1.6", "-3 to -5", "REWIND: ↓ MACE incl. primary prevention"],
    ["Tirzepatide (GIP/GLP-1)", "Mounjaro / Zepbound", "Weekly SC", "2.5 → 5 → 7.5 → 10 → 12.5 → 15 mg", "-2.0 to -2.5", "-10 to -22", "SURPASS, SURMOUNT: superior A1c & weight"],
    ["Exenatide LAR", "Bydureon BCise", "Weekly SC", "2 mg", "-1.0", "-2 to -4", "EXSCEL: CV neutral"],
  ];
  return (
    <SectionCard title="GLP-1 receptor agonists" icon={<PillIcon className="h-5 w-5" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-2">Molecule</th><th className="p-2">Brand</th><th className="p-2">Route</th>
              <th className="p-2">Titration</th><th className="p-2">Δ A1c (%)</th><th className="p-2">Δ Wt (kg)</th><th className="p-2">Landmark trial</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-border align-top">
                <td className="p-2 font-medium">{r[0]}</td>
                <td className="p-2 text-muted-foreground">{r[1]}</td>
                <td className="p-2">{r[2]}</td>
                <td className="p-2 font-mono text-xs">{r[3]}</td>
                <td className="p-2 font-mono">{r[4]}</td>
                <td className="p-2 font-mono">{r[5]}</td>
                <td className="p-2 text-xs text-muted-foreground">{r[6]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout tone="warning" title="Cautions & AE">
        Titrate slowly for GI tolerance (nausea, vomiting, diarrhea). Contraindicated: personal/family history of MTC or MEN2.
        Hold before elective surgery (7 days for weekly agents) per ASA 2023 due to gastroparesis/aspiration risk.
        Rare: pancreatitis, gallbladder disease, retinopathy worsening with rapid A1c drop in T1DM.
      </Callout>
    </SectionCard>
  );
}

function DrugClasses() {
  const rows = [
    ["Metformin", "-1.0 to -2.0", "Neutral / ↓", "Very low", "GI, B12 ↓, lactic acidosis (rare)", "Hold if eGFR <30; avoid contrast if eGFR <30"],
    ["SGLT2i", "-0.5 to -1.0", "-2 to -3 kg", "Low", "UTI, mycotic GU, euglycemic DKA, volume depletion", "CV & renal benefit; approved down to eGFR 20"],
    ["GLP-1 RA", "-1.0 to -2.5", "-3 to -15 kg", "Low", "GI, gallbladder, pancreatitis", "CV & renal benefit; weight loss"],
    ["DPP-4i", "-0.5 to -0.8", "Neutral", "Low", "Pancreatitis (rare), joint pain, bullous pemphigoid", "Avoid saxagliptin/alogliptin in HF"],
    ["Sulfonylureas", "-1.0 to -1.5", "+2 kg", "Moderate–high", "Hypoglycemia, weight gain", "Cheapest oral; avoid glyburide in elderly/CKD"],
    ["Thiazolidinediones", "-0.5 to -1.4", "+2–5 kg", "Low", "HF, fractures, edema, bladder Ca (pio, controversial)", "Reduces MASH; avoid in NYHA III/IV"],
    ["Meglitinides", "-0.5 to -1.0", "+1 kg", "Moderate", "Post-meal hypo, GI", "Useful in irregular meals or SU-intolerant"],
    ["α-glucosidase inh.", "-0.5 to -0.8", "Neutral", "Very low", "Flatulence, diarrhea", "Post-prandial focus; hepatotoxicity (acarbose)"],
    ["Basal insulin", "-1.5 to -2.5", "+2–4 kg", "Moderate", "Hypoglycemia, lipohypertrophy", "No ceiling; titrate to fasting"],
  ];
  return (
    <SectionCard title="Non-insulin drug class comparison">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-2">Class</th><th className="p-2">Δ A1c</th><th className="p-2">Weight</th><th className="p-2">Hypo risk</th><th className="p-2">Adverse effects</th><th className="p-2">Notes</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-border align-top">
                <td className="p-2 font-medium">{r[0]}</td>
                <td className="p-2 font-mono">{r[1]}</td>
                <td className="p-2">{r[2]}</td>
                <td className="p-2">{r[3]}</td>
                <td className="p-2 text-xs text-muted-foreground">{r[4]}</td>
                <td className="p-2 text-xs">{r[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function CareChecklist() {
  const items: [string, string][] = [
    ["Every visit", "BP, weight, adherence, hypo events, injection sites, feet inspection"],
    ["Every 3 mo", "HbA1c (or ≥ twice yearly if at goal)"],
    ["Annually", "Lipid panel, ACR, eGFR, comprehensive foot exam, dilated eye exam (or Q2y if normal)"],
    ["Annually", "Depression, cognitive & functional status, social determinants"],
    ["Vaccinations", "Influenza yearly; pneumococcal (PCV20 or PCV15+PPSV23); hepatitis B if <60; COVID-19 & RSV per CDC; zoster ≥50"],
    ["Dental", "Every 6 months — periodontitis both cause and consequence of hyperglycemia"],
  ];
  return (
    <SectionCard title="Annual diabetes care checklist" icon={<ClipboardList className="h-5 w-5" />}>
      <div className="space-y-1">
        {items.map(([k, v]) => <KeyRow key={k + v} k={k} v={v} />)}
      </div>
    </SectionCard>
  );
}

function CKDSafeDrugs() {
  const rows = [
    ["Metformin", "OK to eGFR 45; 50% dose 30–44; stop <30", "Lactic acidosis risk"],
    ["SGLT2i", "Start ≥ eGFR 20; continue until dialysis (per label)", "Empa & dapa retain CV/renal benefit low eGFR"],
    ["GLP-1 RA", "No dose adjustment; safe in dialysis (liraglutide, dulaglutide, semaglutide)", "Watch dehydration from GI AEs"],
    ["DPP-4i", "Linagliptin: no adjust. Sita/saxa/alo: renal-dose", "Linagliptin preferred in advanced CKD"],
    ["Sulfonylurea", "Avoid glyburide; glipizide preferred", "High hypoglycemia risk in CKD"],
    ["Insulin", "Reduce dose 25–50% as eGFR falls", "Prolonged action; titrate carefully"],
    ["Pioglitazone", "No renal adjust, but avoid if edema/HF", "Useful in MASH + CKD"],
  ];
  return (
    <SectionCard title="CKD-safe prescribing" tone="warning">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-2">Drug</th><th className="p-2">Renal dosing</th><th className="p-2">Caveat</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-border">
                <td className="p-2 font-medium">{r[0]}</td>
                <td className="p-2">{r[1]}</td>
                <td className="p-2 text-muted-foreground">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function GeriatricSyndromes() {
  return (
    <SectionCard title="Geriatric assessment" subtitle="Screen at diagnosis & annually ≥65 yr" icon={<Users className="h-5 w-5" />} tone="info">
      <div className="grid gap-2">
        <KeyRow k="Cognition" v="Mini-Cog, MoCA — hypoglycemia risk ↑" />
        <KeyRow k="Function" v="ADL / IADL — injection & CGM feasibility" />
        <KeyRow k="Frailty" v="FRAIL scale / Clinical Frailty Scale" />
        <KeyRow k="Falls" v="Timed Up & Go — deprescribe hypoglycemic agents if positive" />
        <KeyRow k="Depression" v="PHQ-2 → PHQ-9" />
        <KeyRow k="Nutrition" v="MNA-SF — malnutrition alters insulin need" />
        <KeyRow k="Polypharmacy" v="Beers criteria — avoid glyburide, chlorpropamide" />
        <KeyRow k="Vision / dexterity" v="Determines pen vs vial, CGM suitability" />
      </div>
      <Callout tone="warning" title="De-intensification">
        In older adults with A1c &lt; 6.5 % on insulin/SU, actively deprescribe to reduce hypoglycemia. Target A1c 7.5–8.0 %
        for those with limited life expectancy, dementia, or dependence in ADLs.
      </Callout>
    </SectionCard>
  );
}

export default function DiabetesTreatment() {
  return (
    <Tabs defaultValue="algorithm" className="w-full">
      <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
        <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
        <TabsTrigger value="glp1">GLP-1</TabsTrigger>
        <TabsTrigger value="insulin">Insulin</TabsTrigger>
        <TabsTrigger value="classes">Drug classes</TabsTrigger>
        <TabsTrigger value="checklist">Care checklist</TabsTrigger>
        <TabsTrigger value="dka">DKA / HHS</TabsTrigger>
        <TabsTrigger value="ckd">CKD-safe</TabsTrigger>
        <TabsTrigger value="geri">Geriatric</TabsTrigger>
      </TabsList>
      <TabsContent value="algorithm" className="mt-4"><TreatmentAlgorithm /></TabsContent>
      <TabsContent value="glp1" className="mt-4"><GLP1Guide /></TabsContent>
      <TabsContent value="insulin" className="mt-4"><InsulinGuide /></TabsContent>
      <TabsContent value="classes" className="mt-4"><DrugClasses /></TabsContent>
      <TabsContent value="checklist" className="mt-4"><CareChecklist /></TabsContent>
      <TabsContent value="dka" className="mt-4"><HyperglycemicEmergencySection /></TabsContent>
      <TabsContent value="ckd" className="mt-4"><CKDSafeDrugs /></TabsContent>
      <TabsContent value="geri" className="mt-4"><GeriatricSyndromes /></TabsContent>
    </Tabs>
  );
}
