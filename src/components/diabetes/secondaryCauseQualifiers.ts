/**
 * Clinically useful qualifiers for each ticked secondary-cause flag.
 *
 * Algorithm v2.0 does not classify from individual labels or these details:
 * it consumes assessmentItemStatus.secondary_causes, hasSecondaryCause,
 * glucocorticoid dose/duration, and the existing advanced-CKD special scenario.
 * Qualifiers are stored for the live form, session, and Jev compact intake.
 * Map only onto flags the engine / FRAX overlay already understand — do not
 * invent a FRAX multiplier.
 */

import {
  CKD_SECONDARY_CAUSE_FLAG,
  GLUCOCORTICOID_SECONDARY_CAUSE_FLAG,
  RA_SECONDARY_CAUSE_FLAG,
  SECONDARY_CAUSE_OPTIONS,
  type SecondaryCauseOption,
} from "./secondaryCauses";
import { ckdQualifierLabel, type CkdQualifier } from "./ckdQualifier";

export const SECONDARY_CAUSE_QUALIFIER_KEYS = {
  "Type 2 diabetes": "t2d",
  "Type 1 diabetes": "t1d",
  "Chronic glucocorticoids": "glucocorticoids",
  "Hypogonadism / early menopause": "hypogonadism",
  "Hyperthyroidism / over-replacement": "hyperthyroid",
  "Primary hyperparathyroidism": "phpt",
  "CKD": "ckd",
  "Chronic liver disease": "liver",
  "Malabsorption / IBD / bariatric": "malabsorption",
  "Multiple myeloma / MGUS": "myeloma",
  "Aromatase inhibitor / ADT": "aiAdt",
  "Chronic PPI / anticonvulsants / heparin": "ppiOther",
  "Alcohol > 3 U/d or smoker": "alcoholSmoking",
  "Rheumatoid arthritis": "ra",
} as const satisfies Record<SecondaryCauseOption, string>;

export type SecondaryCauseQualifierKey =
  (typeof SECONDARY_CAUSE_QUALIFIER_KEYS)[SecondaryCauseOption];

const LABEL_BY_KEY = Object.fromEntries(
  Object.entries(SECONDARY_CAUSE_QUALIFIER_KEYS).map(([label, key]) => [key, label]),
) as Record<SecondaryCauseQualifierKey, SecondaryCauseOption>;

export function qualifierKeyForLabel(label: string): SecondaryCauseQualifierKey | null {
  if ((SECONDARY_CAUSE_OPTIONS as readonly string[]).includes(label)) {
    return SECONDARY_CAUSE_QUALIFIER_KEYS[label as SecondaryCauseOption];
  }
  return null;
}

export function labelForQualifierKey(key: SecondaryCauseQualifierKey): SecondaryCauseOption {
  return LABEL_BY_KEY[key];
}

const UNKNOWN = "unknown" as const;

export type DiabetesContext = "unknown" | "known" | "screening";
export type GlucocorticoidStatus = "unknown" | "current" | "past";
export type HypogonadismPhenotype =
  | "unknown"
  | "early_menopause"
  | "hypogonadism_male"
  | "other";
export type MenopauseOnset = "unknown" | "spontaneous" | "surgical";
export type HyperthyroidStatus = "unknown" | "untreated" | "treated" | "over_replacement";
export type PhptStatus = "unknown" | "active" | "post_op";
export type LiverPattern = "unknown" | "cirrhosis" | "cholestatic" | "other";
export type MalabsorptionKind = "unknown" | "ibd" | "celiac" | "bariatric" | "other";
export type MyelomaStatus = "unknown" | "mgus" | "active_myeloma";
export type AiAdtAgent = "unknown" | "ai" | "adt";
export type ExposureStatus = "unknown" | "current" | "past";
export type PpiOtherAgent = "unknown" | "ppi" | "anticonvulsant" | "heparin";
export type SmokingStatus = "unknown" | "never" | "past" | "current";
export type AlcoholBand = "unknown" | "none" | "under_3" | "over_3";
export type RaActivity = "unknown" | "active" | "remission";

export interface T2dQualifier {
  context: DiabetesContext;
}
export interface T1dQualifier {
  context: Exclude<DiabetesContext, "screening">;
}
export interface GlucocorticoidQualifier {
  status: GlucocorticoidStatus;
}
export interface HypogonadismQualifier {
  phenotype: HypogonadismPhenotype;
  menopauseAgeYears: string;
  menopauseOnset: MenopauseOnset;
}
export interface HyperthyroidQualifier {
  status: HyperthyroidStatus;
  tsh: string;
}
export interface PhptQualifier {
  status: PhptStatus;
}
export interface LiverQualifier {
  pattern: LiverPattern;
}
export interface MalabsorptionQualifier {
  kind: MalabsorptionKind;
}
export interface MyelomaQualifier {
  status: MyelomaStatus;
}
export interface AiAdtQualifier {
  agent: AiAdtAgent;
  status: ExposureStatus;
  durationMonths: string;
}
export interface PpiOtherQualifier {
  agent: PpiOtherAgent;
  status: ExposureStatus;
  durationMonths: string;
  highDosePpi: boolean;
}
export interface AlcoholSmokingQualifier {
  smoking: SmokingStatus;
  alcohol: AlcoholBand;
  alcoholUnitsPerDay: string;
}
export interface RaQualifier {
  activity: RaActivity;
}

export interface SecondaryCauseQualifiers {
  t2d?: T2dQualifier;
  t1d?: T1dQualifier;
  glucocorticoids?: GlucocorticoidQualifier;
  hypogonadism?: HypogonadismQualifier;
  hyperthyroid?: HyperthyroidQualifier;
  phpt?: PhptQualifier;
  liver?: LiverQualifier;
  malabsorption?: MalabsorptionQualifier;
  myeloma?: MyelomaQualifier;
  aiAdt?: AiAdtQualifier;
  ppiOther?: PpiOtherQualifier;
  alcoholSmoking?: AlcoholSmokingQualifier;
  ra?: RaQualifier;
}

export const DEFAULT_SECONDARY_CAUSE_QUALIFIERS: SecondaryCauseQualifiers = {};

const DIABETES_CONTEXTS: readonly DiabetesContext[] = ["unknown", "known", "screening"];
const T1D_CONTEXTS: readonly T1dQualifier["context"][] = ["unknown", "known"];
const GC_STATUSES: readonly GlucocorticoidStatus[] = ["unknown", "current", "past"];
const HYPO_PHENOTYPES: readonly HypogonadismPhenotype[] = [
  "unknown",
  "early_menopause",
  "hypogonadism_male",
  "other",
];
const MENOPAUSE_ONSETS: readonly MenopauseOnset[] = ["unknown", "spontaneous", "surgical"];
const HYPERTHYROID_STATUSES: readonly HyperthyroidStatus[] = [
  "unknown",
  "untreated",
  "treated",
  "over_replacement",
];
const PHPT_STATUSES: readonly PhptStatus[] = ["unknown", "active", "post_op"];
const LIVER_PATTERNS: readonly LiverPattern[] = ["unknown", "cirrhosis", "cholestatic", "other"];
const MALABSORPTION_KINDS: readonly MalabsorptionKind[] = [
  "unknown",
  "ibd",
  "celiac",
  "bariatric",
  "other",
];
const MYELOMA_STATUSES: readonly MyelomaStatus[] = ["unknown", "mgus", "active_myeloma"];
const AI_ADT_AGENTS: readonly AiAdtAgent[] = ["unknown", "ai", "adt"];
const EXPOSURE_STATUSES: readonly ExposureStatus[] = ["unknown", "current", "past"];
const PPI_AGENTS: readonly PpiOtherAgent[] = ["unknown", "ppi", "anticonvulsant", "heparin"];
const SMOKING_STATUSES: readonly SmokingStatus[] = ["unknown", "never", "past", "current"];
const ALCOHOL_BANDS: readonly AlcoholBand[] = ["unknown", "none", "under_3", "over_3"];
const RA_ACTIVITIES: readonly RaActivity[] = ["unknown", "active", "remission"];

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function bool(value: unknown): boolean {
  return value === true;
}

export function emptyT2d(): T2dQualifier {
  return { context: UNKNOWN };
}
export function emptyT1d(): T1dQualifier {
  return { context: UNKNOWN };
}
export function emptyGlucocorticoids(): GlucocorticoidQualifier {
  return { status: UNKNOWN };
}
export function emptyHypogonadism(): HypogonadismQualifier {
  return { phenotype: UNKNOWN, menopauseAgeYears: "", menopauseOnset: UNKNOWN };
}
export function emptyHyperthyroid(): HyperthyroidQualifier {
  return { status: UNKNOWN, tsh: "" };
}
export function emptyPhpt(): PhptQualifier {
  return { status: UNKNOWN };
}
export function emptyLiver(): LiverQualifier {
  return { pattern: UNKNOWN };
}
export function emptyMalabsorption(): MalabsorptionQualifier {
  return { kind: UNKNOWN };
}
export function emptyMyeloma(): MyelomaQualifier {
  return { status: UNKNOWN };
}
export function emptyAiAdt(): AiAdtQualifier {
  return { agent: UNKNOWN, status: UNKNOWN, durationMonths: "" };
}
export function emptyPpiOther(): PpiOtherQualifier {
  return { agent: UNKNOWN, status: UNKNOWN, durationMonths: "", highDosePpi: false };
}
export function emptyAlcoholSmoking(): AlcoholSmokingQualifier {
  return { smoking: UNKNOWN, alcohol: UNKNOWN, alcoholUnitsPerDay: "" };
}
export function emptyRa(): RaQualifier {
  return { activity: UNKNOWN };
}

export function normalizeSecondaryCauseQualifiers(raw: unknown): SecondaryCauseQualifiers {
  if (!raw || typeof raw !== "object") return {};
  const src = raw as Record<string, unknown>;
  const out: SecondaryCauseQualifiers = {};

  if (src.t2d && typeof src.t2d === "object") {
    const v = src.t2d as Record<string, unknown>;
    out.t2d = { context: oneOf(v.context, DIABETES_CONTEXTS, UNKNOWN) };
  }
  if (src.t1d && typeof src.t1d === "object") {
    const v = src.t1d as Record<string, unknown>;
    out.t1d = { context: oneOf(v.context, T1D_CONTEXTS, UNKNOWN) };
  }
  if (src.glucocorticoids && typeof src.glucocorticoids === "object") {
    const v = src.glucocorticoids as Record<string, unknown>;
    out.glucocorticoids = { status: oneOf(v.status, GC_STATUSES, UNKNOWN) };
  }
  if (src.hypogonadism && typeof src.hypogonadism === "object") {
    const v = src.hypogonadism as Record<string, unknown>;
    out.hypogonadism = {
      phenotype: oneOf(v.phenotype, HYPO_PHENOTYPES, UNKNOWN),
      menopauseAgeYears: str(v.menopauseAgeYears),
      menopauseOnset: oneOf(v.menopauseOnset, MENOPAUSE_ONSETS, UNKNOWN),
    };
  }
  if (src.hyperthyroid && typeof src.hyperthyroid === "object") {
    const v = src.hyperthyroid as Record<string, unknown>;
    out.hyperthyroid = {
      status: oneOf(v.status, HYPERTHYROID_STATUSES, UNKNOWN),
      tsh: str(v.tsh),
    };
  }
  if (src.phpt && typeof src.phpt === "object") {
    const v = src.phpt as Record<string, unknown>;
    out.phpt = { status: oneOf(v.status, PHPT_STATUSES, UNKNOWN) };
  }
  if (src.liver && typeof src.liver === "object") {
    const v = src.liver as Record<string, unknown>;
    out.liver = { pattern: oneOf(v.pattern, LIVER_PATTERNS, UNKNOWN) };
  }
  if (src.malabsorption && typeof src.malabsorption === "object") {
    const v = src.malabsorption as Record<string, unknown>;
    out.malabsorption = { kind: oneOf(v.kind, MALABSORPTION_KINDS, UNKNOWN) };
  }
  if (src.myeloma && typeof src.myeloma === "object") {
    const v = src.myeloma as Record<string, unknown>;
    out.myeloma = { status: oneOf(v.status, MYELOMA_STATUSES, UNKNOWN) };
  }
  if (src.aiAdt && typeof src.aiAdt === "object") {
    const v = src.aiAdt as Record<string, unknown>;
    out.aiAdt = {
      agent: oneOf(v.agent, AI_ADT_AGENTS, UNKNOWN),
      status: oneOf(v.status, EXPOSURE_STATUSES, UNKNOWN),
      durationMonths: str(v.durationMonths),
    };
  }
  if (src.ppiOther && typeof src.ppiOther === "object") {
    const v = src.ppiOther as Record<string, unknown>;
    out.ppiOther = {
      agent: oneOf(v.agent, PPI_AGENTS, UNKNOWN),
      status: oneOf(v.status, EXPOSURE_STATUSES, UNKNOWN),
      durationMonths: str(v.durationMonths),
      highDosePpi: bool(v.highDosePpi),
    };
  }
  if (src.alcoholSmoking && typeof src.alcoholSmoking === "object") {
    const v = src.alcoholSmoking as Record<string, unknown>;
    out.alcoholSmoking = {
      smoking: oneOf(v.smoking, SMOKING_STATUSES, UNKNOWN),
      alcohol: oneOf(v.alcohol, ALCOHOL_BANDS, UNKNOWN),
      alcoholUnitsPerDay: str(v.alcoholUnitsPerDay),
    };
  }
  if (src.ra && typeof src.ra === "object") {
    const v = src.ra as Record<string, unknown>;
    out.ra = { activity: oneOf(v.activity, RA_ACTIVITIES, UNKNOWN) };
  }

  return out;
}

/** Compact payload: only qualifiers for currently ticked pathologic flags. */
export function qualifiersForSelectedFlags(
  flags: readonly string[],
  qualifiers: SecondaryCauseQualifiers | undefined | null,
): SecondaryCauseQualifiers {
  const q = normalizeSecondaryCauseQualifiers(qualifiers);
  const out: SecondaryCauseQualifiers = {};
  for (const label of flags) {
    const key = qualifierKeyForLabel(label);
    if (!key || key === "ckd") continue;
    const value = q[key];
    if (value) (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

export function parsedNumber(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** Derive the alcohol band from an entered daily unit count when present. */
export function alcoholBandFromUnits(unitsPerDay: string | undefined, fallback: AlcoholBand): AlcoholBand {
  const n = parsedNumber(unitsPerDay);
  if (n == null) return fallback;
  if (n <= 0) return "none";
  if (n > 3) return "over_3";
  return "under_3";
}

export function resolvedAlcoholBand(q: AlcoholSmokingQualifier | undefined): AlcoholBand {
  if (!q) return UNKNOWN;
  return alcoholBandFromUnits(q.alcoholUnitsPerDay, q.alcohol);
}

/**
 * Map alcohol/smoking qualifiers onto the existing FRAX lifestyle fields.
 * Unknown leaves the current values unchanged (undefined in the patch).
 */
export function lifestylePatchFromAlcoholSmoking(q: AlcoholSmokingQualifier | undefined): {
  currentSmoking?: boolean;
  alcohol3OrMore?: boolean;
} {
  const patch: { currentSmoking?: boolean; alcohol3OrMore?: boolean } = {};
  if (!q) return patch;
  if (q.smoking === "current") patch.currentSmoking = true;
  else if (q.smoking === "never" || q.smoking === "past") patch.currentSmoking = false;
  const band = resolvedAlcoholBand(q);
  if (band === "over_3") patch.alcohol3OrMore = true;
  else if (band === "none" || band === "under_3") patch.alcohol3OrMore = false;
  return patch;
}

export function seedAlcoholSmokingFromLifestyle(seed: {
  currentSmoking?: boolean;
  alcohol3OrMore?: boolean;
}): AlcoholSmokingQualifier {
  return {
    smoking: seed.currentSmoking === true ? "current" : seed.currentSmoking === false ? "never" : UNKNOWN,
    alcohol: seed.alcohol3OrMore === true ? "over_3" : seed.alcohol3OrMore === false ? "under_3" : UNKNOWN,
    alcoholUnitsPerDay: "",
  };
}

/** Early / premature menopause on the form implies postmenopausal — never clears it. */
export function earlyMenopauseImpliesPostmenopausal(
  flags: readonly string[],
  qualifiers: SecondaryCauseQualifiers | undefined | null,
): boolean {
  if (!flags.includes("Hypogonadism / early menopause")) return false;
  const q = normalizeSecondaryCauseQualifiers(qualifiers).hypogonadism;
  if (!q) return false;
  if (q.phenotype === "early_menopause") return true;
  const age = parsedNumber(q.menopauseAgeYears);
  return age != null && age < 45;
}

export interface SecondaryCauseIntakePatch {
  currentSmoking?: boolean;
  alcohol3OrMore?: boolean;
  postmenopausal?: true;
}

export function intakePatchFromSecondaryCauseQualifiers(
  flags: readonly string[],
  qualifiers: SecondaryCauseQualifiers | undefined | null,
): SecondaryCauseIntakePatch {
  const q = normalizeSecondaryCauseQualifiers(qualifiers);
  const patch: SecondaryCauseIntakePatch = {};
  if (flags.includes("Alcohol > 3 U/d or smoker")) {
    Object.assign(patch, lifestylePatchFromAlcoholSmoking(q.alcoholSmoking));
  }
  if (earlyMenopauseImpliesPostmenopausal(flags, q)) {
    patch.postmenopausal = true;
  }
  return patch;
}

/**
 * When a cause is newly ticked, seed its qualifier from existing intake fields
 * so we do not lose smoking / alcohol toggles or leave an empty object.
 * Unticked cause details are kept so re-ticking restores them.
 */
export function seedQualifiersForFlags(args: {
  previousFlags: readonly string[];
  nextFlags: readonly string[];
  qualifiers: SecondaryCauseQualifiers | undefined | null;
  currentSmoking?: boolean;
  alcohol3OrMore?: boolean;
}): SecondaryCauseQualifiers {
  const next = { ...normalizeSecondaryCauseQualifiers(args.qualifiers) };
  const prev = new Set(args.previousFlags);
  for (const label of args.nextFlags) {
    if (prev.has(label)) continue;
    const key = qualifierKeyForLabel(label);
    if (!key || key === "ckd") continue;
    if (next[key]) continue;
    if (key === "alcoholSmoking") {
      next.alcoholSmoking = seedAlcoholSmokingFromLifestyle({
        currentSmoking: args.currentSmoking,
        alcohol3OrMore: args.alcohol3OrMore,
      });
    } else if (key === "t2d") next.t2d = emptyT2d();
    else if (key === "t1d") next.t1d = emptyT1d();
    else if (key === "glucocorticoids") next.glucocorticoids = emptyGlucocorticoids();
    else if (key === "hypogonadism") next.hypogonadism = emptyHypogonadism();
    else if (key === "hyperthyroid") next.hyperthyroid = emptyHyperthyroid();
    else if (key === "phpt") next.phpt = emptyPhpt();
    else if (key === "liver") next.liver = emptyLiver();
    else if (key === "malabsorption") next.malabsorption = emptyMalabsorption();
    else if (key === "myeloma") next.myeloma = emptyMyeloma();
    else if (key === "aiAdt") next.aiAdt = emptyAiAdt();
    else if (key === "ppiOther") next.ppiOther = emptyPpiOther();
    else if (key === "ra") next.ra = emptyRa();
  }
  return next;
}

function snippet(parts: Array<string | null | undefined>): string | null {
  const cleaned = parts.map((p) => p?.trim()).filter((p): p is string => !!p && p !== "Unknown");
  return cleaned.length ? cleaned.join(", ") : null;
}

export function qualifierSnippet(
  label: string,
  qualifiers: SecondaryCauseQualifiers | undefined | null,
  extras?: { ckdQualifier?: CkdQualifier; glucocorticoidDose?: string; glucocorticoidMonths?: string },
): string | null {
  const q = normalizeSecondaryCauseQualifiers(qualifiers);
  switch (label) {
    case "Type 2 diabetes":
      return q.t2d?.context === "known"
        ? "known T2D"
        : q.t2d?.context === "screening"
          ? "found on this work-up"
          : null;
    case "Type 1 diabetes":
      return q.t1d?.context === "known" ? "known T1D" : null;
    case GLUCOCORTICOID_SECONDARY_CAUSE_FLAG: {
      const status =
        q.glucocorticoids?.status === "current"
          ? "current"
          : q.glucocorticoids?.status === "past"
            ? "past"
            : null;
      const dose = extras?.glucocorticoidDose?.trim();
      const months = extras?.glucocorticoidMonths?.trim();
      const exposure =
        dose && months ? `${dose} mg/d × ${months} mo` : dose ? `${dose} mg/d` : months ? `${months} mo` : null;
      return snippet([status, exposure]);
    }
    case "Hypogonadism / early menopause": {
      const ph =
        q.hypogonadism?.phenotype === "early_menopause"
          ? "early menopause"
          : q.hypogonadism?.phenotype === "hypogonadism_male"
            ? "male hypogonadism"
            : q.hypogonadism?.phenotype === "other"
              ? "other hypogonadism"
              : null;
      const onset =
        q.hypogonadism?.menopauseOnset === "surgical"
          ? "surgical"
          : q.hypogonadism?.menopauseOnset === "spontaneous"
            ? "spontaneous"
            : null;
      const age = q.hypogonadism?.menopauseAgeYears?.trim()
        ? `age ${q.hypogonadism.menopauseAgeYears.trim()} y`
        : null;
      return snippet([ph, onset, age]);
    }
    case "Hyperthyroidism / over-replacement": {
      const status =
        q.hyperthyroid?.status === "untreated"
          ? "untreated"
          : q.hyperthyroid?.status === "treated"
            ? "treated"
            : q.hyperthyroid?.status === "over_replacement"
              ? "over-replacement"
              : null;
      const tsh = q.hyperthyroid?.tsh?.trim() ? `TSH ${q.hyperthyroid.tsh.trim()}` : null;
      return snippet([status, tsh]);
    }
    case "Primary hyperparathyroidism":
      return q.phpt?.status === "active" ? "active" : q.phpt?.status === "post_op" ? "post-op" : null;
    case CKD_SECONDARY_CAUSE_FLAG:
      return extras?.ckdQualifier && extras.ckdQualifier !== "unknown"
        ? ckdQualifierLabel(extras.ckdQualifier)
        : "use Advanced CKD / CKD-MBD qualifier";
    case "Chronic liver disease":
      return q.liver?.pattern === "cirrhosis"
        ? "cirrhosis"
        : q.liver?.pattern === "cholestatic"
          ? "cholestatic"
          : q.liver?.pattern === "other"
            ? "other"
            : null;
    case "Malabsorption / IBD / bariatric":
      return q.malabsorption?.kind === "ibd"
        ? "IBD"
        : q.malabsorption?.kind === "celiac"
          ? "coeliac"
          : q.malabsorption?.kind === "bariatric"
            ? "bariatric"
            : q.malabsorption?.kind === "other"
              ? "other malabsorption"
              : null;
    case "Multiple myeloma / MGUS":
      return q.myeloma?.status === "mgus"
        ? "MGUS"
        : q.myeloma?.status === "active_myeloma"
          ? "active myeloma"
          : null;
    case "Aromatase inhibitor / ADT": {
      const agent = q.aiAdt?.agent === "ai" ? "AI" : q.aiAdt?.agent === "adt" ? "ADT" : null;
      const status = q.aiAdt?.status === "current" ? "current" : q.aiAdt?.status === "past" ? "past" : null;
      const dur = q.aiAdt?.durationMonths?.trim() ? `${q.aiAdt.durationMonths.trim()} mo` : null;
      return snippet([agent, status, dur]);
    }
    case "Chronic PPI / anticonvulsants / heparin": {
      const agent =
        q.ppiOther?.agent === "ppi"
          ? "PPI"
          : q.ppiOther?.agent === "anticonvulsant"
            ? "anticonvulsant"
            : q.ppiOther?.agent === "heparin"
              ? "heparin"
              : null;
      const status =
        q.ppiOther?.status === "current" ? "current" : q.ppiOther?.status === "past" ? "past" : null;
      const dur = q.ppiOther?.durationMonths?.trim() ? `${q.ppiOther.durationMonths.trim()} mo` : null;
      const high = q.ppiOther?.highDosePpi ? "high-dose PPI" : null;
      return snippet([agent, status, dur, high]);
    }
    case "Alcohol > 3 U/d or smoker": {
      const smoke =
        q.alcoholSmoking?.smoking === "current"
          ? "current smoker"
          : q.alcoholSmoking?.smoking === "past"
            ? "ex-smoker"
            : q.alcoholSmoking?.smoking === "never"
              ? "never smoked"
              : null;
      const band = resolvedAlcoholBand(q.alcoholSmoking);
      const alcohol =
        band === "over_3"
          ? q.alcoholSmoking?.alcoholUnitsPerDay?.trim()
            ? `${q.alcoholSmoking.alcoholUnitsPerDay.trim()} U/d`
            : "> 3 U/d"
          : band === "under_3"
            ? "≤ 3 U/d"
            : band === "none"
              ? "no alcohol"
              : null;
      return snippet([smoke, alcohol]);
    }
    case RA_SECONDARY_CAUSE_FLAG:
      return q.ra?.activity === "active" ? "active" : q.ra?.activity === "remission" ? "remission" : null;
    default:
      return null;
  }
}

export function selectedSecondaryCauseQualifiedSummary(
  flags: readonly string[],
  qualifiers: SecondaryCauseQualifiers | undefined | null,
  extras?: { ckdQualifier?: CkdQualifier; glucocorticoidDose?: string; glucocorticoidMonths?: string },
): string {
  const labels = SECONDARY_CAUSE_OPTIONS.filter((l) => flags.includes(l));
  if (labels.length === 0) return "";
  const parts = labels.map((label) => {
    const extra = qualifierSnippet(label, qualifiers, extras);
    return extra ? `${label} (${extra})` : label;
  });
  return parts.join("; ");
}
