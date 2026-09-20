/**
 * Secondary osteoporosis causes used by the live risk form, teaching module
 * and FRAX overlay. Algorithm v2.0 does not classify from individual labels:
 * it consumes assessmentItemStatus.secondary_causes (obtained vs unknown) and
 * maps the CKD flag onto the existing advanced-CKD special scenario.
 *
 * Stored values are the clinician-facing labels so existing sessionStorage
 * payloads keep working.
 */

export const SECONDARY_CAUSE_NONE = "None identified";

/** Pathologic / contributing flags (excludes the "none identified" sentinel). */
export const SECONDARY_CAUSE_OPTIONS = [
  "Type 2 diabetes",
  "Type 1 diabetes",
  "Chronic glucocorticoids",
  "Hypogonadism / early menopause",
  "Hyperthyroidism / over-replacement",
  "Primary hyperparathyroidism",
  "CKD",
  "Chronic liver disease",
  "Malabsorption / IBD / bariatric",
  "Multiple myeloma / MGUS",
  "Aromatase inhibitor / ADT",
  "Chronic PPI / anticonvulsants / heparin",
  "Alcohol > 3 U/d or smoker",
  "Rheumatoid arthritis",
] as const;

export type SecondaryCauseOption = (typeof SECONDARY_CAUSE_OPTIONS)[number];

export const CKD_SECONDARY_CAUSE_FLAG: SecondaryCauseOption = "CKD";
export const RA_SECONDARY_CAUSE_FLAG: SecondaryCauseOption = "Rheumatoid arthritis";
export const GLUCOCORTICOID_SECONDARY_CAUSE_FLAG: SecondaryCauseOption = "Chronic glucocorticoids";

/** FRAX "secondary osteoporosis" yes — not RA, smoking, alcohol or glucocorticoids (those are separate FRAX fields). */
export const FRAX_SECONDARY_OSTEOPOROSIS_FLAGS: ReadonlySet<string> = new Set([
  "Type 1 diabetes",
  "Hypogonadism / early menopause",
  "Hyperthyroidism / over-replacement",
  "Primary hyperparathyroidism",
  "CKD",
  "Chronic liver disease",
  "Malabsorption / IBD / bariatric",
  "Multiple myeloma / MGUS",
]);

export function actualSecondaryCauseFlags(flags: readonly string[]): string[] {
  return flags.filter((f) => f !== SECONDARY_CAUSE_NONE);
}

export function hasSecondaryCause(flags: readonly string[]): boolean {
  return actualSecondaryCauseFlags(flags).length > 0;
}

/** Any checklist interaction (including "none identified") counts as a completed secondary-cause review. */
export function secondaryCausesReviewed(flags: readonly string[]): boolean {
  return flags.length > 0;
}

export function isFraxSecondaryOsteoporosis(flags: readonly string[]): boolean {
  return actualSecondaryCauseFlags(flags).some((f) => FRAX_SECONDARY_OSTEOPOROSIS_FLAGS.has(f));
}

export function isRheumatoidArthritisFlag(flags: readonly string[]): boolean {
  return flags.includes(RA_SECONDARY_CAUSE_FLAG);
}

export function toggleSecondaryCauseFlags(current: readonly string[], label: string): string[] {
  if (label === SECONDARY_CAUSE_NONE) {
    return current.includes(SECONDARY_CAUSE_NONE) ? [] : [SECONDARY_CAUSE_NONE];
  }
  const withoutNone = current.filter((x) => x !== SECONDARY_CAUSE_NONE);
  return withoutNone.includes(label)
    ? withoutNone.filter((x) => x !== label)
    : [...withoutNone, label];
}

export function selectedSecondaryCauseSummary(flags: readonly string[]): {
  count: number;
  labels: string[];
  noneIdentified: boolean;
  noneSelected: boolean;
  text: string;
} {
  const noneIdentified = flags.includes(SECONDARY_CAUSE_NONE);
  const labels = SECONDARY_CAUSE_OPTIONS.filter((l) => flags.includes(l));
  const noneSelected = flags.length === 0;
  let text: string;
  if (noneSelected) text = "None selected";
  else if (noneIdentified) text = "None identified";
  else if (labels.length === 1) text = `1 selected: ${labels[0]}`;
  else text = `${labels.length} selected: ${labels.join("; ")}`;
  return { count: labels.length, labels, noneIdentified, noneSelected, text };
}
