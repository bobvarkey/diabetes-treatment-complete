import React from "react";
import { AlertTriangle, Info, ClipboardList, Activity, FlaskConical, LifeBuoy } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat, CollapseAllProvider } from "./shared";
import { ExportBar } from "./shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiabetesComplications() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Diabetic Complication Management</h2>
          <p className="text-muted-foreground text-sm">Emergency protocols and chronic screening guidelines</p>
        </div>
        <ExportBar title="Diabetic Complication Management" />
      </div>

      <Tabs defaultValue="dka" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="dka">DKA</TabsTrigger>
          <TabsTrigger value="hhs">HHS</TabsTrigger>
          <TabsTrigger value="new-criteria">New Criteria</TabsTrigger>
          <TabsTrigger value="euglycemic">Euglycemic DKA</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="dka" className="mt-6 space-y-4">
          <CollapseAllProvider pageId="dka-emergency">
            <SectionCard
              id="dka-criteria"
              title="Diabetic Ketoacidosis (DKA) Criteria"
              icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
              tone="danger"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Stat label="Plasma Glucose" value="> 250 mg/dL" hint="(usually)" />
                <Stat label="Arterial pH" value="< 7.30" hint="Mild: 7.25-7.30, Mod: 7.00-7.24, Severe: <7.00" />
                <Stat label="Bicarbonate" value="< 18 mEq/L" hint="Mild: 15-18, Mod: 10-15, Severe: <10" />
              </div>
              <div className="mt-4 space-y-2">
                <KeyRow k="Ketones" v="Positive (Serum or Urine)" />
                <KeyRow k="Anion Gap" v="> 10 (Mild) or > 12 (Mod/Severe)" />
                <KeyRow k="Mental Status" v="Alert (Mild) to Stupor/Coma (Severe)" />
              </div>
            </SectionCard>

            <SectionCard
              id="dka-severity"
              title="Severity Grading (ADA)"
              icon={<ClipboardList className="h-5 w-5" />}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold">Variable</th>
                      <th className="py-2 pr-4 font-semibold text-success">Mild</th>
                      <th className="py-2 pr-4 font-semibold text-warning">Moderate</th>
                      <th className="py-2 pr-4 font-semibold text-destructive">Severe</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 text-muted-foreground">pH</td>
                      <td className="py-2 pr-4">7.25 – 7.30</td>
                      <td className="py-2 pr-4">7.00 – 7.24</td>
                      <td className="py-2 pr-4">&lt; 7.00</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 text-muted-foreground">HCO₃</td>
                      <td className="py-2 pr-4">15 – 18</td>
                      <td className="py-2 pr-4">10 – 15</td>
                      <td className="py-2 pr-4">&lt; 10</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 text-muted-foreground">Anion Gap</td>
                      <td className="py-2 pr-4">&gt; 10</td>
                      <td className="py-2 pr-4">&gt; 12</td>
                      <td className="py-2 pr-4">&gt; 12</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-muted-foreground">Mental Status</td>
                      <td className="py-2 pr-4">Alert</td>
                      <td className="py-2 pr-4">Alert/Drowsy</td>
                      <td className="py-2 pr-4">Stupor/Coma</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </CollapseAllProvider>
        </TabsContent>

        <TabsContent value="hhs" className="mt-6 space-y-4">
          <SectionCard
            id="hhs-criteria"
            title="Hyperosmolar Hyperglycemic State (HHS)"
            icon={<Activity className="h-5 w-5 text-warning" />}
            tone="warning"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label="Plasma Glucose" value="> 600 mg/dL" />
              <Stat label="Arterial pH" value="> 7.30" />
              <Stat label="Bicarbonate" value="> 18 mEq/L" />
            </div>
            <div className="mt-4 space-y-2">
              <KeyRow k="Serum Osmolality" v="> 320 mOsm/kg (Effective)" />
              <KeyRow k="Ketones" v="Small / Absent" />
              <KeyRow k="Mental Status" v="Stupor / Coma common" />
            </div>
            <Callout tone="info" title="Effective Osmolality Calculation">
              2[Na⁺(mEq/L)] + [Glucose(mg/dL) / 18]
            </Callout>
          </SectionCard>
        </TabsContent>

        <TabsContent value="new-criteria" className="mt-6 space-y-4">
          <SectionCard
            id="jbds-2023"
            title="New International/JBDS 2023 Criteria"
            icon={<FlaskConical className="h-5 w-5" />}
          >
            <p className="text-sm text-muted-foreground mb-4">
              Modern guidelines emphasize Beta-Hydroxybutyrate (BOHB) over urine ketones and pH.
            </p>
            <div className="space-y-3">
              <div className="rounded-md border border-border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <Pill tone="primary">DKA Diagnosis (Triad)</Pill>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                  <li><strong>Hyperglycemia:</strong> Glucose &gt; 11 mmol/L (200 mg/dL) OR known Diabetes</li>
                  <li><strong>Ketonaemia:</strong> BOHB ≥ 3.0 mmol/L OR Urine ketones ++</li>
                  <li><strong>Acidosis:</strong> Bicarbonate &lt; 15 mmol/L OR Venous pH &lt; 7.3</li>
                </ul>
              </div>
              
              <Callout tone="warning" title="Note on Venous pH">
                Venous pH is now widely accepted for diagnosis and monitoring instead of arterial pH, except in specific respiratory cases.
              </Callout>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="euglycemic" className="mt-6 space-y-4">
          <SectionCard
            id="euglycemic-dka"
            title="Euglycemic DKA (euDKA)"
            icon={<Info className="h-5 w-5 text-info" />}
            tone="info"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Pill tone="danger">Glucose {"<"} 250 mg/dL</Pill>
                <span className="text-sm">with high Anion Gap Acidosis & Ketosis</span>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Common Triggers</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                    <li>SGLT-2 Inhibitor use (most common modern cause)</li>
                    <li>Pregnancy</li>
                    <li>Starvation / Low carb diet</li>
                    <li>Heavy alcohol intake</li>
                    <li>Partial insulin treatment before presentation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">SGLT-2i Caveat</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    SGLT-2i promotes glycosuria, lowering plasma glucose while the lack of insulin action still triggers ketogenesis. 
                    <strong> Always check ketones in a sick patient on SGLT-2i, regardless of glucose level.</strong>
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="management" className="mt-6 space-y-4">
          <SectionCard
            id="management-phases"
            title="Management Protocol (The 5 Pillars)"
            icon={<LifeBuoy className="h-5 w-5" />}
          >
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">1</span>
                      Fluids (Volume First)
                    </h4>
                    <p className="text-xs text-muted-foreground">Initial: 1-1.5 L normal saline over 1st hour. Adjust based on Na+ and cardiac status.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">2</span>
                      Insulin (Shut off Ketones)
                    </h4>
                    <p className="text-xs text-muted-foreground">Continuous infusion: 0.1 U/kg/hr. Goal: decrease BOHB by 0.5 mmol/L/hr or increase HCO₃ by 3 mEq/L/hr.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">3</span>
                      Potassium (The Silent Killer)
                    </h4>
                    <p className="text-xs text-muted-foreground">If K+ &lt; 3.3, <strong>HOLD insulin</strong> and replete. If 3.3-5.2, add 20-30 mEq K+ to each liter of fluid. If {">"} 5.2, no K+ needed initially.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">4</span>
                      Glucose (The Safety Bridge)
                    </h4>
                    <p className="text-xs text-muted-foreground">Add Dextrose (D5 or D10) when glucose falls &lt; 200-250 mg/dL. Don't stop insulin until acidosis resolves.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">5</span>
                      Monitoring & Resolution
                    </h4>
                    <p className="text-xs text-muted-foreground">Check VBG, K+, Glucose every 1-2 hours. Resolution: pH &gt; 7.3, Bicarb ≥ 15, Anion Gap &lt; 12.</p>
                  </div>
                </div>
              </div>

              <Callout tone="danger" title="Transition to SC Insulin">
                Overlap IV and SC insulin by 1-2 hours to prevent rebound ketosis. Start long-acting insulin before stopping infusion.
              </Callout>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
