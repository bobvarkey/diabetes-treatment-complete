import { useMemo, useState } from "react";
import { Eye, Copy, Printer } from "lucide-react";
import { SectionCard, Callout, Pill, KeyRow } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXAM_TIMING = [
  "Completed within the previous 12 months",
  "Completed more than 12 months ago",
  "Scheduled before GLP-1RA initiation",
  "Not yet scheduled",
  "Not applicable / non-diabetic low-risk patient",
] as const;

const DISC_AT_RISK = [
  "No",
  "Yes - confirmed by eye-care clinician",
  "Indeterminate / needs specialist assessment",
] as const;

const YNU = ["No", "Yes", "Unknown"] as const;

const GLAUCOMA = [
  "No known glaucoma / glaucoma suspicion",
  "Glaucoma suspect",
  "Established glaucoma - stable",
  "Established glaucoma - unstable or untreated",
  "Unknown / not assessed",
] as const;

const OCT = [
  "Normal / no structural concern",
  "Borderline RNFL or ganglion-cell-complex thinning",
  "Definite RNFL or ganglion-cell-complex thinning",
  "Not performed",
  "Indeterminate",
] as const;

const FIELDS = [
  "Normal",
  "Glaucomatous defect",
  "Optic-neuropathy pattern",
  "Non-specific defect",
  "Not performed",
] as const;

const RISK_FACTORS = [
  "Diabetes",
  "Hypertension",
  "Dyslipidaemia",
  "Obstructive sleep apnoea",
  "Smoking",
  "Chronic kidney disease",
  "No known factors",
] as const;

type Form = {
  examTiming: string;
  discDate: string;
  cdrRV: string;
  cdrLV: string;
  cdrRH: string;
  cdrLH: string;
  discAtRisk: string;
  previousNaion: string;
  discOedema: string;
  iopR: string;
  iopL: string;
  glaucoma: string;
  oct: string;
  fields: string;
  risks: string[];
};

const initial: Form = {
  examTiming: "",
  discDate: "",
  cdrRV: "",
  cdrLV: "",
  cdrRH: "",
  cdrLH: "",
  discAtRisk: "",
  previousNaion: "",
  discOedema: "",
  iopR: "",
  iopL: "",
  glaucoma: "",
  oct: "",
  fields: "",
  risks: [],
};

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type Verdict = {
  level: "stop" | "defer" | "caution" | "proceed" | "incomplete";
  label: string;
  reasons: string[];
  actions: string[];
};

function assess(f: Form): Verdict {
  const reasons: string[] = [];
  const actions: string[] = [];

  const missing: string[] = [];
  if (!f.examTiming) missing.push("eye examination status");
  if (!f.discAtRisk) missing.push("disc-at-risk anatomy");
  if (!f.previousNaion) missing.push("previous NAION");
  if (!f.discOedema) missing.push("current disc oedema");
  if (!f.glaucoma) missing.push("glaucoma status");
  if (missing.length) {
    return {
      level: "incomplete",
      label: "Incomplete — required fields missing",
      reasons: [`Complete: ${missing.join(", ")}.`],
      actions: ["Obtain the missing ophthalmic data before making a GLP-1 RA decision."],
    };
  }

  // Hard stops
  if (f.discOedema === "Yes") {
    reasons.push("Current optic-disc oedema / unexplained optic neuropathy.");
    actions.push("Do not start or continue GLP-1 RA until the optic neuropathy is characterised.");
    actions.push("Same-day/urgent neuro-ophthalmology referral; exclude giant-cell arteritis (ESR, CRP, platelets) if age ≥50.");
  }
  if (f.previousNaion === "Yes") {
    reasons.push("Previous NAION in either eye — highest-risk group for fellow-eye events.");
    actions.push("Avoid semaglutide; discuss alternative agents (tirzepatide, SGLT2i, other classes) and document shared decision-making.");
  }
  if (reasons.length) {
    return {
      level: "stop",
      label: f.discOedema === "Yes" ? "Do not initiate — active optic neuropathy" : "Avoid / specialist decision only",
      reasons,
      actions,
    };
  }

  // Deferrals
  const cdrs = [num(f.cdrRV), num(f.cdrLV)].filter((n): n is number => n !== null);
  const maxCdr = cdrs.length ? Math.max(...cdrs) : null;
  const iops = [num(f.iopR), num(f.iopL)].filter((n): n is number => n !== null);
  const maxIop = iops.length ? Math.max(...iops) : null;

  const defer: string[] = [];
  if (f.glaucoma === "Established glaucoma - unstable or untreated")
    defer.push("Established glaucoma that is unstable or untreated.");
  if (maxIop !== null && maxIop >= 22) defer.push(`Raised intraocular pressure (max ${maxIop} mmHg).`);
  if (f.examTiming === "Not yet scheduled")
    defer.push("No comprehensive dilated eye examination scheduled.");
  if (f.examTiming === "Completed more than 12 months ago")
    defer.push("Dilated eye examination is more than 12 months old.");
  if (defer.length) {
    return {
      level: "defer",
      label: "Defer initiation until eye care is arranged / stabilised",
      reasons: defer,
      actions: [
        "Arrange comprehensive dilated examination with optic-disc assessment and IOP before starting.",
        "Treat and stabilise raised IOP or untreated glaucoma first.",
        "Re-run this assessment once the eye review is complete.",
      ],
    };
  }

  // Caution
  const caution: string[] = [];
  if (f.discAtRisk === "Yes - confirmed by eye-care clinician")
    caution.push("Crowded optic disc (disc-at-risk) confirmed by an eye-care clinician.");
  if (f.discAtRisk === "Indeterminate / needs specialist assessment")
    caution.push("Disc anatomy indeterminate — specialist structural assessment pending.");
  if (maxCdr !== null && maxCdr <= 0.2)
    caution.push(`Small vertical cup-to-disc ratio (max ${maxCdr}) — supportive of a crowded disc.`);
  if (maxCdr !== null && maxCdr >= 0.7)
    caution.push(`Large vertical cup-to-disc ratio (max ${maxCdr}) — glaucomatous cupping should be excluded.`);
  if (f.oct === "Definite RNFL or ganglion-cell-complex thinning")
    caution.push("Definite RNFL / GCC thinning on OCT.");
  if (f.oct === "Borderline RNFL or ganglion-cell-complex thinning")
    caution.push("Borderline RNFL / GCC thinning on OCT.");
  if (f.fields === "Glaucomatous defect" || f.fields === "Optic-neuropathy pattern")
    caution.push(`Visual field abnormality: ${f.fields.toLowerCase()}.`);
  if (f.glaucoma === "Glaucoma suspect") caution.push("Glaucoma suspect.");
  if (f.glaucoma === "Unknown / not assessed") caution.push("Glaucoma status not assessed.");
  const vascular = f.risks.filter((r) => r !== "No known factors");
  if (vascular.length >= 3)
    caution.push(`Multiple NAION-associated vascular risk factors (${vascular.length}): ${vascular.join(", ")}.`);

  if (caution.length) {
    return {
      level: "caution",
      label: "Proceed with caution — heightened NAION surveillance",
      reasons: caution,
      actions: [
        "Document explicit counselling on NAION: sudden painless loss of vision or a fixed field defect in one eye → seek same-day ophthalmology review, hold the drug.",
        "Prefer slow dose escalation; avoid rapid A1c drops (also mitigates early worsening of retinopathy).",
        "Optimise vascular risk: BP, lipids, smoking cessation, OSA treatment (avoid nocturnal hypotension).",
        "Baseline optic-nerve OCT/RNFL and visual fields if not already done; repeat eye review at 6–12 months.",
      ],
    };
  }

  return {
    level: "proceed",
    label: "No optic-nerve contraindication identified",
    reasons: [
      "Recent dilated examination, no disc-at-risk anatomy, no prior NAION, no disc oedema, normal IOP and glaucoma status.",
    ],
    actions: [
      "Proceed with GLP-1 RA per standard escalation.",
      "Counsel on sudden monocular vision loss as a stop-and-review symptom.",
      "Continue annual dilated eye examination (more often if retinopathy present).",
    ],
  };
}

const LEVEL_STYLE: Record<Verdict["level"], { tone: "danger" | "warning" | "success" | "info"; pill: "danger" | "warning" | "success" | "info" }> = {
  stop: { tone: "danger", pill: "danger" },
  defer: { tone: "warning", pill: "warning" },
  caution: { tone: "warning", pill: "warning" },
  proceed: { tone: "success", pill: "success" },
  incomplete: { tone: "info", pill: "info" },
};

function NumField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 0.01,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  hint?: string;
}) {
  const n = num(value);
  const invalid = n !== null && (n < min || n > max);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {unit ? <span className="text-muted-foreground"> ({unit})</span> : null}
      </Label>
      <Input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
      />
      {invalid ? (
        <p className="text-xs text-destructive">Must be between {min} and {max}.</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SelField({
  label,
  value,
  onChange,
  options,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-auto min-h-10 text-left">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function OpticNerveNaionApp() {
  const [f, setF] = useState<Form>(initial);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const verdict = useMemo(() => assess(f), [f]);
  const style = LEVEL_STYLE[verdict.level];

  const summary = useMemo(() => {
    const lines = [
      "Optic nerve / glaucoma / NAION risk assessment (GLP-1 RA)",
      `Result: ${verdict.label}`,
      "",
      "Findings:",
      ...verdict.reasons.map((r) => `- ${r}`),
      "",
      "Recommended actions:",
      ...verdict.actions.map((a) => `- ${a}`),
      "",
      "Data:",
      `- Eye exam status: ${f.examTiming || "—"}`,
      `- Optic disc exam date: ${f.discDate || "—"}`,
      `- Vertical CDR R/L: ${f.cdrRV || "—"} / ${f.cdrLV || "—"}`,
      `- Horizontal CDR R/L: ${f.cdrRH || "—"} / ${f.cdrLH || "—"}`,
      `- Disc-at-risk: ${f.discAtRisk || "—"}`,
      `- Previous NAION: ${f.previousNaion || "—"}`,
      `- Disc oedema / unexplained optic neuropathy: ${f.discOedema || "—"}`,
      `- IOP R/L: ${f.iopR || "—"} / ${f.iopL || "—"} mmHg`,
      `- Glaucoma status: ${f.glaucoma || "—"}`,
      `- OCT / RNFL: ${f.oct || "—"}`,
      `- Visual fields: ${f.fields || "—"}`,
      `- NAION vascular risk factors: ${f.risks.length ? f.risks.join(", ") : "—"}`,
    ];
    return lines.join("\n");
  }, [f, verdict]);

  return (
    <div className="space-y-5">
      <SectionCard
        id="onaion-intake"
        title="Optic nerve / glaucoma / NAION risk assessment"
        subtitle="Pre-GLP-1 RA ophthalmic screening"
        icon={<Eye className="h-5 w-5" />}
      >
        <Callout tone="info" title="Who completes this">
          Complete by an ophthalmologist or optometrist. CDR values are supportive screening data, not
          stand-alone diagnoses.
        </Callout>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelField
            label="Comprehensive dilated eye examination status"
            required
            value={f.examTiming}
            onChange={(v) => set("examTiming", v)}
            options={EXAM_TIMING}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Optic disc examination date</Label>
            <Input type="date" value={f.discDate} onChange={(e) => set("discDate", e.target.value)} />
          </div>

          <NumField label="Vertical cup-to-disc ratio: right eye" unit="ratio" min={0} max={1} value={f.cdrRV} onChange={(v) => set("cdrRV", v)} />
          <NumField label="Vertical cup-to-disc ratio: left eye" unit="ratio" min={0} max={1} value={f.cdrLV} onChange={(v) => set("cdrLV", v)} />
          <NumField label="Horizontal cup-to-disc ratio: right eye (optional)" unit="ratio" min={0} max={1} value={f.cdrRH} onChange={(v) => set("cdrRH", v)} />
          <NumField label="Horizontal cup-to-disc ratio: left eye (optional)" unit="ratio" min={0} max={1} value={f.cdrLH} onChange={(v) => set("cdrLH", v)} />

          <SelField
            label="Crowded optic disc / disc-at-risk anatomy"
            required
            value={f.discAtRisk}
            onChange={(v) => set("discAtRisk", v)}
            options={DISC_AT_RISK}
            hint="Record the clinician's structural impression; do not infer disc crowding solely from a numeric CDR."
          />
          <SelField
            label="Previous NAION (either eye)"
            required
            value={f.previousNaion}
            onChange={(v) => set("previousNaion", v)}
            options={YNU}
          />
          <SelField
            label="Current optic-disc oedema or unexplained optic neuropathy"
            required
            value={f.discOedema}
            onChange={(v) => set("discOedema", v)}
            options={YNU}
          />
          <SelField
            label="Glaucoma status"
            required
            value={f.glaucoma}
            onChange={(v) => set("glaucoma", v)}
            options={GLAUCOMA}
          />

          <NumField label="Intraocular pressure: right eye" unit="mmHg" min={0} max={60} step={1} value={f.iopR} onChange={(v) => set("iopR", v)} />
          <NumField label="Intraocular pressure: left eye" unit="mmHg" min={0} max={60} step={1} value={f.iopL} onChange={(v) => set("iopL", v)} />

          <SelField label="Optic nerve OCT / RNFL status" value={f.oct} onChange={(v) => set("oct", v)} options={OCT} />
          <SelField label="Visual field status, if tested" value={f.fields} onChange={(v) => set("fields", v)} options={FIELDS} />
        </div>

        <fieldset className="mt-2 rounded-md border border-border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">
            NAION-associated systemic risk factors
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {RISK_FACTORS.map((r) => {
              const checked = f.risks.includes(r);
              return (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const on = c === true;
                      setF((p) => {
                        if (r === "No known factors")
                          return { ...p, risks: on ? ["No known factors"] : [] };
                        const next = on
                          ? [...p.risks.filter((x) => x !== "No known factors"), r]
                          : p.risks.filter((x) => x !== r);
                        return { ...p, risks: next };
                      });
                    }}
                  />
                  <span>{r}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setF(initial)}>
            Reset
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        id="onaion-result"
        title="Result"
        subtitle="Auto-updates as data is entered"
        tone={style.tone}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={style.pill}>{verdict.label}</Pill>
        </div>

        <div>
          <h4 className="mt-3 text-sm font-semibold">Findings</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {verdict.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mt-3 text-sm font-semibold">Recommended actions</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {verdict.actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void navigator.clipboard?.writeText(summary)}
          >
            <Copy className="mr-1.5 h-4 w-4" /> Copy summary
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </div>
      </SectionCard>

      <SectionCard id="onaion-ref" title="Interpretation thresholds & counselling" defaultOpen={false}>
        <div className="space-y-1">
          <KeyRow k="Absolute hold" v="Current disc oedema / unexplained optic neuropathy" />
          <KeyRow k="Avoid semaglutide" v="Previous NAION in either eye" />
          <KeyRow k="Defer" v="Untreated/unstable glaucoma, IOP ≥22 mmHg, or no dilated exam arranged" />
          <KeyRow k="Disc-at-risk surrogate" v="Vertical CDR ≤0.2 (crowded disc) — clinician impression overrides" mono />
          <KeyRow k="Glaucoma suspicion" v="Vertical CDR ≥0.7, RNFL/GCC thinning, or field defect" mono />
          <KeyRow k="Re-review" v="6–12 months if any caution flag; otherwise annual dilated exam" />
        </div>
        <Callout tone="warning" title="Patient counselling script">
          "If you suddenly lose vision or part of your field of vision in one eye — painlessly, often noticed on
          waking — stop the injection and seek eye assessment the same day."
        </Callout>
        <p className="text-xs text-muted-foreground">
          Screening aid only; ophthalmic diagnosis and treatment decisions rest with the eye-care clinician.
        </p>
      </SectionCard>
    </div>
  );
}
