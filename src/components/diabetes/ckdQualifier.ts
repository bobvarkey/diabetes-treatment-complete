/**
 * Clinician qualifier for the algorithm v2.0 special scenario
 * "Advanced CKD or suspected CKD-MBD". The engine only consumes a coarse
 * yes / no / unknown flag — these IDs are documented on the form and in Jev
 * compact state, then mapped onto that flag.
 */

import type { TriState } from "./osteoporosisAlgorithm";

export const CKD_QUALIFIER_IDS = [
  "unknown",
  "none",
  "g4",
  "g5",
  "dialysis",
  "advanced_unspecified",
  "ckd_mbd_suspected",
  "ckd_mbd_present",
] as const;

export type CkdQualifier = (typeof CKD_QUALIFIER_IDS)[number];

export const DEFAULT_CKD_QUALIFIER: CkdQualifier = "unknown";

export const CKD_QUALIFIER_OPTIONS: ReadonlyArray<{
  id: CkdQualifier;
  label: string;
  hint: string;
  mapsTo: TriState;
}> = [
  { id: "unknown", label: "Unknown", hint: "Not yet reviewed", mapsTo: "unknown" },
  {
    id: "none",
    label: "Not advanced / no CKD-MBD",
    hint: "eGFR ≥30 and no mineral-bone disorder suspected",
    mapsTo: "no",
  },
  {
    id: "g4",
    label: "CKD G4 (eGFR 15–29)",
    hint: "Advanced CKD",
    mapsTo: "yes",
  },
  {
    id: "g5",
    label: "CKD G5 (eGFR <15)",
    hint: "Advanced CKD",
    mapsTo: "yes",
  },
  { id: "dialysis", label: "Dialysis", hint: "Advanced CKD", mapsTo: "yes" },
  {
    id: "advanced_unspecified",
    label: "Advanced CKD (not staged)",
    hint: "Stage not recorded",
    mapsTo: "yes",
  },
  {
    id: "ckd_mbd_suspected",
    label: "Suspected CKD-MBD",
    hint: "Mineral-bone disorder suspected",
    mapsTo: "yes",
  },
  {
    id: "ckd_mbd_present",
    label: "CKD-MBD present",
    hint: "Mineral-bone disorder documented",
    mapsTo: "yes",
  },
];

const OPTION_BY_ID = Object.fromEntries(CKD_QUALIFIER_OPTIONS.map((o) => [o.id, o])) as Record<
  CkdQualifier,
  (typeof CKD_QUALIFIER_OPTIONS)[number]
>;

export function isCkdQualifier(value: unknown): value is CkdQualifier {
  return typeof value === "string" && (CKD_QUALIFIER_IDS as readonly string[]).includes(value);
}

export function normalizeCkdQualifier(value: unknown): CkdQualifier {
  return isCkdQualifier(value) ? value : DEFAULT_CKD_QUALIFIER;
}

/** Coarse algorithm flag implied by the qualifier. Unknown lets CrCl / CKD ticks still derive. */
export function triStateFromCkdQualifier(qualifier: CkdQualifier | undefined | null): TriState | null {
  const q = normalizeCkdQualifier(qualifier);
  if (q === "unknown") return null;
  return OPTION_BY_ID[q].mapsTo;
}

export function ckdQualifierSetsAdvancedScenario(qualifier: CkdQualifier | undefined | null): boolean {
  return triStateFromCkdQualifier(qualifier) === "yes";
}

export function ckdQualifierLabel(qualifier: CkdQualifier | undefined | null): string {
  return OPTION_BY_ID[normalizeCkdQualifier(qualifier)].label;
}

export function ckdQualifierReviewed(qualifier: CkdQualifier | undefined | null): boolean {
  return normalizeCkdQualifier(qualifier) !== "unknown";
}
