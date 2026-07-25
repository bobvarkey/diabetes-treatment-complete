import { useState } from "react";
import { BookOpen, Calculator, FlaskConical, Stethoscope } from "lucide-react";
import { SectionCard, KeyRow, Pill, Callout, Stat } from "./shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

/* ---------------- Overview ---------------- */

function Overview() {
  return (
    <SectionCard
      id="adrenal-overview"
      title="Adrenal Axis Evaluator"
      subtitle="Cushing syndrome & adrenal insufficiency — screening, dynamic testing, next steps"
      icon={<BookOpen className="h-5 w-5" />}
      tone="info"
    >
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          Cutoffs are guideline-based but <b>assay- and lab-specific</b>. Always override with local reference
          ranges. Designed for adult patients; pediatric adaptations differ.
        </p>
        <div className="grid gap-1">
          <KeyRow k="Serum / salivary cortisol" v="nmol/L" />
          <KeyRow k="Urinary free cortisol" v="nmol/24h" />
          <KeyRow k="ACTH" v="pg/mL" />
          <KeyRow k="Sodium / potassium / glucose" v="mmol/L" />
        </div>
        <Callout tone="warning" title="Safety">
          If adrenal crisis is suspected — hypotension, vomiting, hyponatremia, hyperkalemia, hypoglycemia in
          a patient with possible AI — <b>do not delay treatment</b> for testing. Give IV hydrocortisone
          100&nbsp;mg + fluids, then confirm biochemically once stable.
        </Callout>
      </div>
    </SectionCard>
  );
}

/* ---------------- First-line tests to order ---------------- */

function FirstLineTests() {
  return (
    <SectionCard
      id="adrenal-first-line"
      title="First-line tests — order these to rule in / rule out"
      subtitle="Complete the screening triad (Cushing) or morning cortisol ± ACTH stim (AI) before referral"
      icon={<FlaskConical className="h-5 w-5" />}
      tone="info"
    >
      <div className="space-y-4 text-sm">
        {/* Cushing */}
        <div>
          <h4 className="mb-2 font-semibold">Suspected Cushing syndrome — order ≥2 of 3 screens</h4>
          <div className="grid gap-1">
            <KeyRow k="1. 1 mg overnight DST" v="1 mg dexamethasone at 23:00 → 08:00 cortisol. Suppression ≤50 nmol/L rules out." />
            <KeyRow k="2. Late-night salivary cortisol (×2)" v="23:00–24:00 saliva on 2 separate nights. ≤2.25 nmol/L rules out; ≥6.73 suggests." />
            <KeyRow k="3. 24 h urinary free cortilol (×2)" v="Two collections with creatinine. Normal on both rules out; > ULN on both suggests." />
            <KeyRow k="If ≥2 positive → confirmed" v="Then add 08:00 ACTH to classify ACTH-dependent vs -independent." />
            <KeyRow k="If all 3 negative → excluded" v="No further endocrine testing unless the picture changes." />
          </div>
          <Callout tone="warning" title="Pre-test pitfalls">
            <ul className="list-disc pl-5 space-y-1">
              <li>Avoid DST if on estrogens (↑CBG → false positive) — stop OCP/HRT 6 weeks prior.</li>
              <li>Enzyme inducers (phenytoin, rifampicin, carbamazepine) → false-positive DST (↑dex clearance).</li>
              <li>Shift workers, severe depression, alcohol excess, uncontrolled DM → false positives (pseudo-Cushing).</li>
              <li>Do not screen during acute illness, pregnancy (use UFC), or with exogenous steroid use.</li>
              <li><b>Random morning cortisol is not recommended</b> for screening of Cushing syndrome — it is too nonspecific (overlap with normal physiology, stress, and CBG changes).</li>
            </ul>
          </Callout>
        </div>

        {/* Addison */}
        <div>
          <h4 className="mb-2 font-semibold">Suspected adrenal insufficiency — stepwise</h4>
          <div className="grid gap-1">
            <KeyRow k="1. 08:00 serum cortisol" v="<100 nmol/L confirms · >415 nmol/L excludes · 100–415 → proceed to stim." />
            <KeyRow k="2. Plasma ACTH (paired, 08:00)" v="Draw with the cortisol. Classifies primary (↑↑) vs central (↓/normal)." />
            <KeyRow k="3. 250 µg Synacthen (ACTH) stim" v="Baseline + 30/60 min cortisol. Peak ≥ assay cutoff (typically 400–500 nmol/L) rules out." />
            <KeyRow k="4. Electrolytes, glucose, renin, aldosterone" v="Hyponatremia, hyperkalemia, ↑renin, ↓aldo → primary AI." />
            <KeyRow k="5. Etiology after confirmation" v="21-OH antibodies (autoimmune); if negative → adrenal CT, TB screen, VLCFA in men." />
          </div>
          <Callout tone="danger" title="If unstable — do not wait for tests">
            Draw a random cortisol + ACTH, then give IV hydrocortisone 100 mg and 0.9% saline immediately.
            Confirm biochemically after the patient is stable (hydrocortisone does not cross-react with modern
            cortisol assays; dexamethasone can be used pre-test if delay is unavoidable).
          </Callout>
          <Callout tone="info" title="Central AI caveat">
            The short Synacthen test can be falsely normal within 4–6 weeks of pituitary insult (chronic
            adrenal atrophy has not yet developed). Use insulin tolerance test or glucagon stim if recent
            pituitary surgery / apoplexy is suspected.
          </Callout>
        </div>
      </div>
    </SectionCard>
  );
}

/* ---------------- Cushing evaluator ---------------- */

const CUSHING_FEATURES = [
  "central_obesity", "moon_face", "buffalo_hump", "proximal_muscle_weakness",
  "easy_bruising", "striae_rubrae", "hypertension", "diabetes_or_glucose_intolerance",
  "osteoporosis_or_fractures", "hirsutism_acne", "menstrual_irregularity", "psychiatric_symptoms",
] as const;

function num(s: string): number | null {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

function CushingCalc() {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [dst, setDst] = useState("");            // post-DST 8am cortisol nmol/L
  const [lnsc, setLnsc] = useState("");          // late-night salivary cortisol nmol/L
  const [ufc, setUfc] = useState("");            // 24h UFC nmol/24h
  const [uln, setUln] = useState("");            // ULN for UFC
  const [acth, setActh] = useState("");          // 08h ACTH pg/mL
  const [k, setK] = useState("");                // potassium

  const featCount = Object.values(features).filter(Boolean).length;

  const dstV = num(dst), lnscV = num(lnsc), ufcV = num(ufc), ulnV = num(uln), acthV = num(acth), kV = num(k);

  const dstPos = dstV !== null && dstV > 50;
  const lnscPos = lnscV !== null && lnscV >= 6.73;
  const lnscExcl = lnscV !== null && lnscV <= 2.25;
  const ufcPos = ufcV !== null && ulnV !== null && ufcV > ulnV;

  const positives = [dstPos, lnscPos, ufcPos].filter(Boolean).length;
  const screenPositive = positives >= 2;
  const hyperLikely = screenPositive && featCount >= 3;

  let etiology: "ACTH-dependent" | "ACTH-independent" | "Indeterminate" | "—" = "—";
  if (hyperLikely && acthV !== null) {
    if (acthV < 5) etiology = "ACTH-independent";
    else if (acthV > 15) etiology = "ACTH-dependent";
    else etiology = "Indeterminate";
  }

  // Probability score 0-10
  let score = 0;
  score += Math.min(3, featCount);
  if (dstPos) score += 2;
  if (lnscPos) score += 2;
  if (ufcPos) score += 2;
  if (kV !== null && kV < 3.5) score += 1;

  return (
    <SectionCard
      id="adrenal-cushing"
      title="Cushing syndrome evaluator"
      subtitle="Screening triad (DST, LNSC, UFC) + ACTH classification"
      icon={<Calculator className="h-5 w-5" />}
    >
      <div className="space-y-4 text-sm">
        {/* Clinical features */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Clinical features</Label>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {CUSHING_FEATURES.map((f) => (
              <label key={f} className="flex cursor-pointer items-center gap-2 rounded border border-border/60 px-2 py-1.5 hover:bg-accent/40">
                <Checkbox
                  checked={!!features[f]}
                  onCheckedChange={(v) => setFeatures((p) => ({ ...p, [f]: v === true }))}
                />
                <span className="text-[13px] capitalize">{f.replaceAll("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Screening inputs */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-dst">Post-1&nbsp;mg DST cortisol 08:00 (nmol/L)</Label>
            <Input id="ac-dst" inputMode="decimal" value={dst} onChange={(e) => setDst(e.target.value)} placeholder="e.g. 40" />
            <p className="mt-1 text-xs text-muted-foreground">Normal suppression ≤50 nmol/L (≈1.8 µg/dL).</p>
          </div>
          <div>
            <Label htmlFor="ac-lnsc">Late-night salivary cortisol (nmol/L)</Label>
            <Input id="ac-lnsc" inputMode="decimal" value={lnsc} onChange={(e) => setLnsc(e.target.value)} placeholder="e.g. 3.5" />
            <p className="mt-1 text-xs text-muted-foreground">≥6.73 suggests Cushing · ≤2.25 makes it unlikely.</p>
          </div>
          <div>
            <Label htmlFor="ac-ufc">24 h UFC (nmol/24h)</Label>
            <Input id="ac-ufc" inputMode="decimal" value={ufc} onChange={(e) => setUfc(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ac-uln">Lab ULN for UFC</Label>
            <Input id="ac-uln" inputMode="decimal" value={uln} onChange={(e) => setUln(e.target.value)} placeholder="lab-specific" />
          </div>
          <div>
            <Label htmlFor="ac-acth">08:00 ACTH (pg/mL)</Label>
            <Input id="ac-acth" inputMode="decimal" value={acth} onChange={(e) => setActh(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ac-k">Serum K⁺ (mmol/L)</Label>
            <Input id="ac-k" inputMode="decimal" value={k} onChange={(e) => setK(e.target.value)} placeholder="e.g. 3.6" />
          </div>
        </div>

        {/* Results */}
        <div className="grid gap-2 sm:grid-cols-4">
          <Stat label="Features" value={featCount} hint="of 12 selected" />
          <Stat label="Screens positive" value={`${positives} / 3`} hint="DST · LNSC · UFC" />
          <Stat label="Probability score" value={`${score} / 10`} hint="decision support only" />
          <Stat label="Etiology" value={etiology} hint="ACTH-based" />
        </div>

        <div className="grid gap-1">
          <KeyRow k="DST >50 nmol/L" v={dstV === null ? "—" : <Pill tone={dstPos ? "warning" : "success"}>{dstPos ? "Positive" : "Suppressed"}</Pill>} />
          <KeyRow k="LNSC ≥6.73 nmol/L" v={lnscV === null ? "—" : <Pill tone={lnscPos ? "warning" : lnscExcl ? "success" : "default"}>{lnscPos ? "Suggestive" : lnscExcl ? "Excludes" : "Indeterminate"}</Pill>} />
          <KeyRow k="UFC > ULN" v={(ufcV === null || ulnV === null) ? "—" : <Pill tone={ufcPos ? "warning" : "success"}>{ufcPos ? "Elevated" : "Normal"}</Pill>} />
          <KeyRow k="Screen positive (≥2)" v={<Pill tone={screenPositive ? "danger" : "default"}>{screenPositive ? "Yes" : "No"}</Pill>} />
          <KeyRow k="Hypercortisolism likely" v={<Pill tone={hyperLikely ? "danger" : "default"}>{hyperLikely ? "Yes" : "No"}</Pill>} />
        </div>

        {hyperLikely && (
          <Callout tone="warning" title="Next steps — Cushing pathway">
            <ul className="list-disc pl-5 space-y-1">
              <li>Refer to endocrinology for confirmatory testing and etiology workup.</li>
              <li>Classify with 08:00 ACTH: &lt;5 pg/mL → ACTH-independent (adrenal); &gt;15–20 pg/mL → ACTH-dependent.</li>
              <li>If ACTH-dependent: pituitary MRI ± CRH/desmopressin test; consider IPSS if MRI equivocal.</li>
              <li>If ACTH-independent: adrenal CT/MRI (unilateral adenoma vs bilateral disease).</li>
              <li>If ACTH high and pituitary MRI negative → search for ectopic source (chest/abdomen/pelvis CT, ⁶⁸Ga-DOTATATE).</li>
            </ul>
          </Callout>
        )}
        {!screenPositive && positives === 0 && featCount < 2 && (
          <Callout tone="info" title="Low suspicion">
            Consider alternative causes for symptoms (obesity, depression, alcohol excess, poorly controlled
            diabetes). No further endocrine testing unless the clinical picture changes.
          </Callout>
        )}
      </div>
    </SectionCard>
  );
}

/* ---------------- Adrenal insufficiency evaluator ---------------- */

const ADDISON_FEATURES = [
  "weight_loss", "fatigue", "anorexia", "nausea_vomiting", "abdominal_pain",
  "salt_craving", "postural_dizziness", "hyperpigmentation", "hypotension",
  "hyponatremia", "hyperkalemia", "hypoglycemia",
] as const;

type Assay = "generic" | "Abbott_60min" | "Abbott_30min" | "Roche_Elecsys_30min" | "Access_30min" | "LC_MSMS_30min";

const ASSAY_CUTOFF: Record<Assay, number> = {
  generic: 500,
  Abbott_60min: 405,
  Abbott_30min: 365,
  Roche_Elecsys_30min: 405,
  Access_30min: 408,
  LC_MSMS_30min: 400,
};

function AIcalc() {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [cort8, setCort8] = useState("");        // 08h cortisol
  const [acth, setActh] = useState("");
  const [na, setNa] = useState("");
  const [k, setK] = useState("");
  const [glu, setGlu] = useState("");
  const [sbp, setSbp] = useState("");
  const [stimDone, setStimDone] = useState(false);
  const [assay, setAssay] = useState<Assay>("generic");
  const [peak, setPeak] = useState("");

  const featCount = Object.values(features).filter(Boolean).length;
  const cortV = num(cort8), acthV = num(acth), naV = num(na), kV = num(k), gluV = num(glu), sbpV = num(sbp), peakV = num(peak);

  const cutoff = ASSAY_CUTOFF[assay];
  const stimBelow = stimDone && peakV !== null && peakV < cutoff;
  const cortLow = cortV !== null && cortV < 100;
  const cortHigh = cortV !== null && cortV > 415; // excludes AI
  const hypoNa = naV !== null && naV < 135;
  const hyperK = kV !== null && kV > 5.0;
  const hypoglu = gluV !== null && gluV < 3.9;
  const shock = sbpV !== null && sbpV < 90;

  const aiLikely = stimBelow || (cortLow && featCount >= 2);

  let primaryVsCentral: "Primary" | "Central" | "Indeterminate" | "—" = "—";
  if (aiLikely && acthV !== null) {
    if (acthV > 100 || hyperK) primaryVsCentral = "Primary";
    else if (acthV < 20 && !hyperK) primaryVsCentral = "Central";
    else primaryVsCentral = "Indeterminate";
  }

  const crisis = (shock || hypoNa || hyperK || hypoglu) && (aiLikely || featCount >= 3);

  // Probability score 0-10
  let score = 0;
  score += Math.min(3, featCount);
  if (cortLow) score += 2;
  if (stimBelow) score += 3;
  if (hypoNa || hyperK) score += 1;
  if (shock || hypoglu) score += 1;

  return (
    <SectionCard
      id="adrenal-ai"
      title="Adrenal insufficiency evaluator"
      subtitle="Morning cortisol · ACTH stimulation · primary vs central"
      icon={<Stethoscope className="h-5 w-5" />}
      tone={crisis ? "danger" : "default"}
    >
      <div className="space-y-4 text-sm">
        {crisis && (
          <Callout tone="danger" title="⚠ Possible adrenal crisis — treat empirically NOW">
            IV hydrocortisone 100&nbsp;mg bolus, then 50&nbsp;mg IV q6h (or 200&nbsp;mg/24h infusion). Give
            0.9% saline 1&nbsp;L rapidly, correct hypoglycemia with dextrose, identify and treat precipitant.
            Do not delay treatment for confirmatory testing.
          </Callout>
        )}

        {/* Features */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Clinical features</Label>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {ADDISON_FEATURES.map((f) => (
              <label key={f} className="flex cursor-pointer items-center gap-2 rounded border border-border/60 px-2 py-1.5 hover:bg-accent/40">
                <Checkbox
                  checked={!!features[f]}
                  onCheckedChange={(v) => setFeatures((p) => ({ ...p, [f]: v === true }))}
                />
                <span className="text-[13px] capitalize">{f.replaceAll("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="ai-cort">08:00 cortisol (nmol/L)</Label>
            <Input id="ai-cort" inputMode="decimal" value={cort8} onChange={(e) => setCort8(e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">&lt;100 suggests AI · &gt;415 excludes.</p>
          </div>
          <div>
            <Label htmlFor="ai-acth">08:00 ACTH (pg/mL)</Label>
            <Input id="ai-acth" inputMode="decimal" value={acth} onChange={(e) => setActh(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ai-sbp">SBP (mmHg)</Label>
            <Input id="ai-sbp" inputMode="decimal" value={sbp} onChange={(e) => setSbp(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ai-na">Na⁺ (mmol/L)</Label>
            <Input id="ai-na" inputMode="decimal" value={na} onChange={(e) => setNa(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ai-k">K⁺ (mmol/L)</Label>
            <Input id="ai-k" inputMode="decimal" value={k} onChange={(e) => setK(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ai-glu">Glucose (mmol/L)</Label>
            <Input id="ai-glu" inputMode="decimal" value={glu} onChange={(e) => setGlu(e.target.value)} />
          </div>
        </div>

        {/* Stim test */}
        <div className="rounded-md border border-border p-3">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={stimDone} onCheckedChange={(v) => setStimDone(v === true)} />
            <span className="font-medium">ACTH stimulation test performed</span>
          </label>
          {stimDone && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Assay</Label>
                <Select value={assay} onValueChange={(v) => setAssay(v as Assay)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic (≥500 nmol/L)</SelectItem>
                    <SelectItem value="Abbott_60min">Abbott — 60 min (405)</SelectItem>
                    <SelectItem value="Abbott_30min">Abbott — 30 min (365)</SelectItem>
                    <SelectItem value="Roche_Elecsys_30min">Roche Elecsys — 30 min (405)</SelectItem>
                    <SelectItem value="Access_30min">Access — 30 min (408)</SelectItem>
                    <SelectItem value="LC_MSMS_30min">LC-MS/MS — 30 min (400)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ai-peak">Peak cortisol (nmol/L)</Label>
                <Input id="ai-peak" inputMode="decimal" value={peak} onChange={(e) => setPeak(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Cutoff: {cutoff} nmol/L</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="grid gap-2 sm:grid-cols-4">
          <Stat label="Features" value={featCount} hint="of 12 selected" />
          <Stat label="Probability" value={`${score} / 10`} hint="decision support only" />
          <Stat label="AI likely" value={aiLikely ? "Yes" : "No"} />
          <Stat label="Primary vs central" value={primaryVsCentral} />
        </div>

        <div className="grid gap-1">
          <KeyRow k="Morning cortisol" v={cortV === null ? "—" : <Pill tone={cortLow ? "danger" : cortHigh ? "success" : "default"}>{cortLow ? "Very low" : cortHigh ? "Excludes AI" : "Indeterminate"}</Pill>} />
          {stimDone && (
            <KeyRow k={`ACTH-stim peak vs ${cutoff}`} v={peakV === null ? "—" : <Pill tone={stimBelow ? "danger" : "success"}>{stimBelow ? "Below cutoff → AI" : "Adequate"}</Pill>} />
          )}
          <KeyRow k="Na⁺ / K⁺ / Glucose" v={<>{hypoNa && <Pill tone="warning">Hypo-Na</Pill>} {hyperK && <Pill tone="warning">Hyper-K</Pill>} {hypoglu && <Pill tone="warning">Hypo-glu</Pill>} {!hypoNa && !hyperK && !hypoglu && "—"}</>} />
        </div>

        {aiLikely && (
          <Callout tone="warning" title="Next steps — Addison pathway">
            <ul className="list-disc pl-5 space-y-1">
              <li>If unstable → treat as crisis (hydrocortisone + fluids) before further tests.</li>
              <li>Confirm with 250 µg ACTH stimulation test if patient stable and diagnosis unclear.</li>
              <li>Measure ACTH, renin, aldosterone to classify primary vs central.</li>
              <li>Primary AI: 21-hydroxylase antibodies; if negative, screen for TB, adrenal metastases, adrenoleukodystrophy in men.</li>
              <li>Central AI: pituitary MRI + full anterior pituitary axis workup (TSH+fT4, IGF-1, LH/FSH, prolactin).</li>
              <li>Educate on sick-day rules and prescribe emergency hydrocortisone injection kit.</li>
            </ul>
          </Callout>
        )}
        {!aiLikely && featCount >= 3 && (
          <Callout tone="info" title="Symptoms suggestive but tests inconclusive">
            Repeat 08:00 cortisol; if intermediate (100–415 nmol/L), proceed to ACTH stimulation. Consider
            central AI if pituitary disease, prior surgery/radiation, or long-term exogenous glucocorticoids.
          </Callout>
        )}
      </div>
    </SectionCard>
  );
}

/* ---------------- Reference tables ---------------- */

function References() {
  return (
    <SectionCard
      id="adrenal-refs"
      title="Cutoff quick reference"
      subtitle="Guideline-based; verify with local assay"
      icon={<FlaskConical className="h-5 w-5" />}
    >
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="mb-1 font-semibold">Cushing screening</h4>
          <div className="grid gap-1">
            <KeyRow k="1 mg overnight DST — normal suppression" v="Cortisol ≤50 nmol/L (≈1.8 µg/dL)" />
            <KeyRow k="Late-night salivary cortisol" v="≥6.73 suggests · ≤2.25 excludes (nmol/L)" />
            <KeyRow k="24 h UFC" v="> lab ULN on ≥2 collections" />
            <KeyRow k="ACTH classification" v="<5 pg/mL independent · >15–20 pg/mL dependent" />
          </div>
        </div>
        <div>
          <h4 className="mb-1 font-semibold">Adrenal insufficiency</h4>
          <div className="grid gap-1">
            <KeyRow k="08:00 cortisol" v="<100 nmol/L suggests · >415 excludes" />
            <KeyRow k="ACTH stim peak — generic" v="≥500 nmol/L excludes AI" />
            <KeyRow k="Abbott / Roche / LC-MS/MS" v="~350–410 nmol/L (assay-specific)" />
            <KeyRow k="Primary AI" v="↑ ACTH · ↓Na · ↑K · ↑renin · ↓aldo" />
            <KeyRow k="Central AI" v="↓/normal ACTH · normal K · normal renin/aldo" />
          </div>
        </div>
        <Callout tone="info" title="Sources">
          Endocrine Society CPGs (Cushing 2008/2015; Primary AI 2016), ESE 2020, and manufacturer assay
          inserts. Values shown are typical adult cutoffs and must be reconciled with the reporting
          laboratory before clinical decisions.
        </Callout>
      </div>
    </SectionCard>
  );
}

/* ---------------- Root ---------------- */

export default function AdrenalApp() {
  return (
    <div className="space-y-4">
      <Overview />
      <FirstLineTests />
      <CushingCalc />
      <AIcalc />
      <References />
    </div>
  );
}
