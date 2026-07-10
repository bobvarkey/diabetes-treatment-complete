import { SectionCard, Callout, Pill } from "./shared";
import { Syringe } from "lucide-react";

const types = [
  { cat: "Rapid-acting", onset: "10–20 min", peak: "1–2 h", duration: "3–5 h", agents: "Lispro, Aspart, Glulisine, Faster Aspart (Fiasp), Lispro-aabc (Lyumjev)" },
  { cat: "Short (Regular)", onset: "30 min", peak: "2–3 h", duration: "5–8 h", agents: "Humulin R, Novolin R, Actrapid" },
  { cat: "Intermediate (NPH)", onset: "1–2 h", peak: "4–8 h", duration: "12–16 h", agents: "Humulin N, Novolin N, Insulatard" },
  { cat: "Long-acting", onset: "1–2 h", peak: "flat", duration: "20–24 h", agents: "Glargine U-100 (Lantus, Basaglar), Detemir (Levemir)" },
  { cat: "Ultra-long", onset: "1 h", peak: "flat", duration: "> 24–42 h", agents: "Glargine U-300 (Toujeo), Degludec (Tresiba), Icodec (Awiqli — weekly)" },
  { cat: "Premixed", onset: "30 min", peak: "biphasic", duration: "10–16 h", agents: "70/30, 75/25, 50/50 (Humalog Mix, NovoMix, Mixtard)" },
];

const brands = [
  ["Rapid", "Lispro", "Humalog", "Huminsulin R (Lilly India)"],
  ["Rapid", "Aspart", "NovoLog / NovoRapid", "NovoRapid"],
  ["Rapid", "Glulisine", "Apidra", "Apidra"],
  ["Rapid+", "Faster Aspart", "Fiasp", "Fiasp"],
  ["Short", "Regular", "Humulin R / Novolin R", "Actrapid, Huminsulin R"],
  ["Intermediate", "NPH", "Humulin N / Novolin N", "Insulatard, Huminsulin N"],
  ["Long", "Glargine U-100", "Lantus / Basaglar / Semglee", "Lantus, Basalog, Glaritus"],
  ["Long", "Detemir", "Levemir", "Levemir"],
  ["Ultra-long", "Glargine U-300", "Toujeo", "Toujeo"],
  ["Ultra-long", "Degludec", "Tresiba", "Tresiba"],
  ["Weekly", "Icodec", "Awiqli", "—"],
  ["Premix", "70/30 (NPH/Reg)", "Humulin 70/30", "Mixtard 30, Huminsulin 30/70"],
  ["Premix", "75/25 (NPL/Lispro)", "Humalog Mix 75/25", "Humalog Mix25"],
  ["Premix", "70/30 (Aspart Protamine/Aspart)", "NovoLog Mix 70/30", "NovoMix 30"],
];

export default function InsulinGuide() {
  return (
    <div className="space-y-5">
      <SectionCard title="Insulin categories" icon={<Syringe className="h-5 w-5" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">Category</th><th className="p-2">Onset</th><th className="p-2">Peak</th><th className="p-2">Duration</th><th className="p-2">Agents</th></tr>
            </thead>
            <tbody>
              {types.map((r) => (
                <tr key={r.cat} className="border-t border-border">
                  <td className="p-2 font-medium">{r.cat}</td>
                  <td className="p-2 font-mono">{r.onset}</td>
                  <td className="p-2 font-mono">{r.peak}</td>
                  <td className="p-2 font-mono">{r.duration}</td>
                  <td className="p-2 text-muted-foreground">{r.agents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Brand reference (US & India)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-2">Class</th><th className="p-2">Molecule</th><th className="p-2">US brand</th><th className="p-2">Indian brand</th></tr>
            </thead>
            <tbody>
              {brands.map((r) => (
                <tr key={r[1]} className="border-t border-border">
                  <td className="p-2"><Pill tone="primary">{r[0]}</Pill></td>
                  <td className="p-2 font-medium">{r[1]}</td>
                  <td className="p-2 text-muted-foreground">{r[2]}</td>
                  <td className="p-2 text-muted-foreground">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="30/70 premixed insulin guide" tone="info">
        <ul className="list-disc space-y-1 pl-5">
          <li>30 % short/rapid + 70 % intermediate (NPH or protamine analog).</li>
          <li>Twice-daily dosing: <b>2/3 TDD pre-breakfast, 1/3 pre-dinner</b>, 15–30 min before meals (regular) or immediately (analog premix).</li>
          <li>Reasonable when patient/family cannot manage basal-bolus; predictable meal timing required.</li>
          <li>Cannot flex meals; higher risk of late-morning and nocturnal hypoglycemia.</li>
          <li>Convert basal-bolus → premix: same TDD, split 2/3 AM : 1/3 PM.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Mixing NPH + regular insulin" tone="warning">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Wash hands. Gently roll NPH vial (do <b>not</b> shake).</li>
          <li>Inject air equal to NPH dose into NPH vial — do <b>not</b> withdraw.</li>
          <li>Inject air equal to regular dose into regular vial, invert, withdraw regular dose.</li>
          <li>Return to NPH vial, invert, withdraw NPH dose (total = regular + NPH).</li>
          <li><b>Clear before cloudy</b> — regular first, then NPH. Inject within 5 min.</li>
          <li>Never mix glargine, detemir, or degludec with other insulins.</li>
        </ol>
      </SectionCard>

      <Callout tone="danger" title="High-alert medication">
        Insulin is a top-5 medication error class. Always write units in full (never "U"), use insulin-specific syringes,
        double-check dose in critical care, and never share pens between patients.
      </Callout>
    </div>
  );
}
