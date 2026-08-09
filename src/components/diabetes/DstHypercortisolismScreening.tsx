import { useMemo, useState } from "react";
import { FlaskConical, Copy, Printer } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";

type Tone = "success" | "warning" | "danger" | "info";

interface Outcome {
  node: string;
  conclusion: string;
  tone: Tone;
  recs: string[];
}

export default function DstHypercortisolismScreening() {
  const [adult, setAdult] = useState(true);
  const [a1c, setA1c] = useState("");
  const [agents, setAgents] = useState("");
  const [cortisol, setCortisol] = useState("");
  const [cortisolUnit, setCortisolUnit] = useState<"ug/dL" | "nmol/L">("ug/dL");
  const [dex, setDex] = useState("");
  const [dexCutoff, setDexCutoff] = useState("140");
  const [confirmAbnormal, setConfirmAbnormal] = useState(0);

  const a1cN = parseFloat(a1c);
  const agentsN = parseInt(agents, 10);
  const eligible = adult && a1cN > 7.5 && agentsN >= 2;

  // normalise cortisol to µg/dL
  const cortRaw = parseFloat(cortisol);
  const cort = isFinite(cortRaw) ? (cortisolUnit === "nmol/L" ? cortRaw / 27.59 : cortRaw) : NaN;
  const dexN = parseFloat(dex);
  const dexThresh = parseFloat(dexCutoff);
  const cutoff = isFinite(dexThresh) ? dexThresh : 140;
  const dexMeasured = isFinite(dexN);

  const notMeasuredRec =
    "Serum dexamethasone was NOT measured — a non-suppressed cortisol may be a false positive from non-adherence, wrong timing, malabsorption or CYP3A4 induction. Add a dexamethasone level (reflex on the same sample) before acting.";

  const outcome: Outcome | null = useMemo(() => {
    if (!eligible || !isFinite(cort)) return null;
    if (dexMeasured && dexN < cutoff) {
      return {
        node: "Inadequate dexamethasone level",
        conclusion: `DST is uninterpretable — serum dexamethasone ${dexN} ng/dL is below the adequacy cut-off (${cutoff} ng/dL).`,
        tone: "warning",
        recs: [
          "Do not interpret the cortisol result.",
          "Review adherence, timing (23:00–24:00 dose) and malabsorption.",
          "Check CYP3A4 inducers (phenytoin, carbamazepine, rifampicin, St John's wort) and OCP/oestrogen (raises CBG → false positive).",
          "Repeat the 1-mg overnight DST after correcting the cause; consider supervised or inpatient dosing.",
        ],
      };
    }

    if (cort <= 1.8) {
      return {
        node: "Hypercortisolism excluded",
        conclusion: "Post-DST cortisol ≤ 1.8 µg/dL (50 nmol/L) — normal suppression.",
        tone: "success",
        recs: [
          "Endogenous hypercortisolism effectively excluded.",
          "Optimise glucose-lowering therapy, weight and adherence.",
          "Re-screen only if new features (proximal myopathy, easy bruising, striae, rapid weight gain, resistant hypertension/hypokalaemia).",
        ],
      };
    }
    if (cort <= 5) {
      const conf: Outcome = {
        node: "Indeterminate — possible mild autonomous cortisol secretion",
        conclusion: `Post-DST cortisol ${cort.toFixed(1)} µg/dL (1.9–5.0) — non-suppression, confirmatory testing required.`,
        tone: "warning",
        recs: [
          "Order ≥ 2 confirmatory tests: late-night salivary cortisol ×2, 24-h urine free cortisol ×2, ± repeat 1-mg DST.",
          "Measure plasma ACTH once hypercortisolism is confirmed (ACTH-dependent vs independent).",
          "Exclude physiological (pseudo-)Cushing: poor glycaemic control, obesity, OSA, depression, alcohol.",
          "Refer to endocrinology if ≥ 2 tests abnormal.",
        ],
      };
      if (confirmAbnormal >= 2) {
        conf.node = "Confirmed hypercortisolism";
        conf.conclusion = "Non-suppressed DST plus ≥ 2 abnormal confirmatory tests — hypercortisolism confirmed.";
        conf.tone = "danger";
        conf.recs = [
          "Refer to endocrinology (urgent if severe hypokalaemia, psychosis, or rapid onset).",
          "Plasma ACTH → pituitary MRI (ACTH-dependent) or adrenal CT (ACTH-independent).",
          "Continue intensified diabetes therapy; expect improvement once cortisol excess is treated.",
          "Screen for hypertension, osteoporosis, VTE risk, infection.",
        ];
      } else if (confirmAbnormal === 1) {
        conf.recs = ["Only 1 abnormal confirmatory test — repeat/complete the second test before concluding.", ...conf.recs];
      }
      return conf;
    }
    return {
      node: "Highly suggestive of hypercortisolism",
      conclusion: `Post-DST cortisol ${cort.toFixed(1)} µg/dL (> 5.0) — marked non-suppression.`,
      tone: "danger",
      recs: [
        "Refer to endocrinology promptly.",
        "Confirm with late-night salivary cortisol and/or 24-h UFC, then plasma ACTH.",
        "Imaging directed by ACTH result: pituitary MRI vs adrenal CT.",
        "Manage hypertension, hypokalaemia, hyperglycaemia and thromboprophylaxis risk in parallel.",
      ],
    };
  }, [eligible, cort, dexN, dexMeasured, cutoff, confirmAbnormal]);

  const finalOutcome: Outcome | null =
    outcome && !dexMeasured && cort > 1.8
      ? { ...outcome, recs: [notMeasuredRec, ...outcome.recs] }
      : outcome;

  const summary = () =>
    [
      "DST-based hypercortisolism screening in difficult-to-control T2D",
      `Entry: adult=${adult ? "yes" : "no"}, HbA1c=${a1c || "?"}%, glucose-lowering agents=${agents || "?"} → ${eligible ? "ELIGIBLE" : "not eligible"}`,
      `1-mg overnight DST: cortisol ${cortisol || "?"} ${cortisolUnit}${isFinite(cort) ? ` (${cort.toFixed(1)} µg/dL)` : ""}, dexamethasone ${dex || "not measured"} ng/dL`,
      finalOutcome ? `Result: ${finalOutcome.node} — ${finalOutcome.conclusion}` : "Result: incomplete input",
      finalOutcome ? finalOutcome.recs.map((r) => `• ${r}`).join("\n") : "",
    ]
      .filter(Boolean)
      .join("\n");

  return (
    <SectionCard
      id="dst-hypercortisolism"
      title="Hypercortisolism screening in difficult-to-control T2D"
      subtitle="1-mg overnight dexamethasone suppression test pathway"
      icon={<FlaskConical className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <Callout tone="info" title="Entry criteria">
          Adult with type 2 diabetes, HbA1c &gt; 7.5 % despite ≥ 2 glucose-lowering agents (or on insulin with resistant
          hypertension / unexplained osteoporosis / cushingoid features).
        </Callout>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="dst-a1c">HbA1c (%)</Label>
            <Input id="dst-a1c" inputMode="decimal" value={a1c} onChange={(e) => setA1c(e.target.value)} placeholder="8.6" />
          </div>
          <div>
            <Label htmlFor="dst-agents">Glucose-lowering agents (n)</Label>
            <Input id="dst-agents" inputMode="numeric" value={agents} onChange={(e) => setAgents(e.target.value)} placeholder="3" />
          </div>
          <div className="flex items-end gap-2 pb-2">
            <Checkbox id="dst-adult" checked={adult} onCheckedChange={(v) => setAdult(v === true)} />
            <Label htmlFor="dst-adult" className="text-sm">Adult (≥ 18 y)</Label>
          </div>
        </div>

        <div className={eligible ? "" : "opacity-60"}>
          <div className="mb-2 flex items-center gap-2">
            <Pill tone={eligible ? "success" : "warning"}>{eligible ? "Eligible — proceed to DST" : "Entry criteria not met"}</Pill>
          </div>
          <Callout tone="info" title="How to perform the 1-mg overnight DST">
            <KeyRow k="Dexamethasone" v="1 mg PO between 23:00–24:00" />
            <KeyRow k="Blood draw" v="08:00 next morning — serum cortisol + serum dexamethasone" />
            <KeyRow k="Validity (optional but recommended)" v={`Serum dexamethasone ≥ ${cutoff} ng/dL confirms adequate exposure — lab-specific (commonly 140–200 ng/dL)`} />
          </Callout>

          <Callout tone="info" title="Qualifier — is serum dexamethasone mandatory?">
            <p className="text-sm">
              Serum dexamethasone is an <b>adjunct</b>, not a universal requirement. It reduces false-positive screens by
              proving the 1-mg dose was actually taken, absorbed and not over-metabolised. Older guidelines do not mandate
              it; current practice increasingly does, especially in difficult-to-control diabetes screening programmes and
              adrenal incidentaloma / suspected Cushing services. Many large labs (Quest, Labcorp, Mayo) offer a reflex
              profile: cortisol first, dexamethasone automatically added on the same sample if cortisol exceeds the cut-off.
            </p>
            <ul className="ml-4 mt-1 list-disc text-sm">
              <li><b>Adequate level</b> → the cortisol result stands.</li>
              <li><b>Low level</b> → reclassify the test as <i>invalid</i>, not positive; repeat with supervised dosing.</li>
              <li><b>Not measured</b> → the algorithm still runs, but a non-suppressed cortisol is flagged "unverified"; confirm with LNSC / 24-h UFC before referral.</li>
            </ul>
          </Callout>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="dst-cort">08:00 cortisol</Label>
              <Input id="dst-cort" inputMode="decimal" value={cortisol} onChange={(e) => setCortisol(e.target.value)} placeholder="2.4" />
            </div>
            <div>
              <Label htmlFor="dst-unit">Cortisol unit</Label>
              <select
                id="dst-unit"
                value={cortisolUnit}
                onChange={(e) => setCortisolUnit(e.target.value as "ug/dL" | "nmol/L")}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="ug/dL">µg/dL</option>
                <option value="nmol/L">nmol/L</option>
              </select>
            </div>
            <div>
              <Label htmlFor="dst-dex">08:00 dexamethasone (ng/dL)</Label>
              <Input id="dst-dex" inputMode="decimal" value={dex} onChange={(e) => setDex(e.target.value)} placeholder="180" />
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Stat label="Cortisol (µg/dL)" value={isFinite(cort) ? cort.toFixed(1) : "—"} hint="≤1.8 normal · 1.9–5.0 indeterminate · >5.0 marked" />
            <div>
              <Label htmlFor="dst-conf">Abnormal confirmatory tests (0–3)</Label>
              <Input
                id="dst-conf"
                inputMode="numeric"
                value={String(confirmAbnormal)}
                onChange={(e) => setConfirmAbnormal(Math.max(0, Math.min(3, parseInt(e.target.value, 10) || 0)))}
              />
            </div>
            <div>
              <Label htmlFor="dst-cut">Lab dexamethasone cut-off (ng/dL)</Label>
              <Input id="dst-cut" inputMode="decimal" value={dexCutoff} onChange={(e) => setDexCutoff(e.target.value)} placeholder="140" />
            </div>
            <div className="flex items-end text-xs text-muted-foreground">
              LNSC ×2, 24-h UFC ×2, repeat DST — ≥ 2 abnormal confirms
            </div>
          </div>
        </div>

        {!eligible && (a1c || agents) && (
          <Callout tone="warning" title="Screening not indicated by these criteria">
            Optimise adherence, titrate therapy and reassess. Screen anyway if cushingoid features, resistant
            hypertension with hypokalaemia, or unexplained fragility fracture.
          </Callout>
        )}

        {finalOutcome && (
          <Callout tone={finalOutcome.tone} title={finalOutcome.node}>
            <p className="text-sm">{finalOutcome.conclusion}</p>
            {!dexMeasured && cort > 1.8 && (
              <div className="mt-1"><Pill tone="warning">Unverified — dexamethasone not measured</Pill></div>
            )}
            <ul className="ml-4 mt-1 list-disc text-sm">
              {finalOutcome.recs.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </Callout>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { navigator.clipboard.writeText(summary()); toast.success("Summary copied"); }}
          >
            <Copy className="mr-1 h-3.5 w-3.5" /> Copy summary
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 h-3.5 w-3.5" /> Print
          </Button>
        </div>

        <Callout tone="warning" title="Caveats">
          <ul className="ml-4 list-disc text-sm">
            <li>False positives: oestrogen/OCP, pregnancy, CYP3A4 inducers, acute illness, depression, alcohol, OSA, poor glycaemic control.</li>
            <li>False negatives: CYP3A4 inhibitors (ritonavir, itraconazole), cyclical Cushing syndrome.</li>
            <li>Do not act on a single abnormal test — confirm before imaging or referral for surgery.</li>
          </ul>
        </Callout>
      </div>
    </SectionCard>
  );
}
