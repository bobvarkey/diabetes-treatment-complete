/**
 * Clinician qualifier for the algorithm v2.0 "Falls and frailty" assessment
 * item. The engine only consumes a coarse frequentFalls yes / no / unknown
 * flag (special scenario: frequent falls or high falls risk). These Clinical
 * Frailty Scale (CFS) IDs are documented on the form and in Jev compact
 * state, then mapped onto that flag. No Fried phenotype multi-select and no
 * invented FRAX multiplier.
 */

import type { TriState } from "./osteoporosisAlgorithm";

export const FRAILTY_LEVEL_IDS = [
  "unknown",
  "cfs_1",
  "cfs_2",
  "cfs_3",
  "cfs_4",
  "cfs_5",
  "cfs_6",
  "cfs_7",
  "cfs_8",
  "cfs_9",
] as const;

export type FrailtyLevel = (typeof FRAILTY_LEVEL_IDS)[number];

export const DEFAULT_FRAILTY_LEVEL: FrailtyLevel = "unknown";

export const FRAILTY_LEVEL_OPTIONS: ReadonlyArray<{
  id: FrailtyLevel;
  cfs: number | null;
  label: string;
  hint: string;
  mapsTo: TriState;
}> = [
  { id: "unknown", cfs: null, label: "Unknown", hint: "Not yet reviewed", mapsTo: "unknown" },
  {
    id: "cfs_1",
    cfs: 1,
    label: "CFS 1 — Very fit",
    hint: "Robust, active, energetic",
    mapsTo: "no",
  },
  {
    id: "cfs_2",
    cfs: 2,
    label: "CFS 2 — Well",
    hint: "No active disease symptoms limiting activity",
    mapsTo: "no",
  },
  {
    id: "cfs_3",
    cfs: 3,
    label: "CFS 3 — Managing well",
    hint: "Medical problems well controlled",
    mapsTo: "no",
  },
  {
    id: "cfs_4",
    cfs: 4,
    label: "CFS 4 — Vulnerable",
    hint: "Not dependent; slowing or symptom-limited — not frail",
    mapsTo: "no",
  },
  {
    id: "cfs_5",
    cfs: 5,
    label: "CFS 5 — Mildly frail",
    hint: "Need help with IADLs — frail",
    mapsTo: "yes",
  },
  {
    id: "cfs_6",
    cfs: 6,
    label: "CFS 6 — Moderately frail",
    hint: "Need help with all outside activities and housework",
    mapsTo: "yes",
  },
  {
    id: "cfs_7",
    cfs: 7,
    label: "CFS 7 — Severely frail",
    hint: "Completely dependent for personal care",
    mapsTo: "yes",
  },
  {
    id: "cfs_8",
    cfs: 8,
    label: "CFS 8 — Very severely frail",
    hint: "Approaching end of life; would not recover from a minor illness",
    mapsTo: "yes",
  },
  {
    id: "cfs_9",
    cfs: 9,
    label: "CFS 9 — Terminally ill",
    hint: "Life expectancy under 6 months",
    mapsTo: "yes",
  },
];

const OPTION_BY_ID = Object.fromEntries(FRAILTY_LEVEL_OPTIONS.map((o) => [o.id, o])) as Record<
  FrailtyLevel,
  (typeof FRAILTY_LEVEL_OPTIONS)[number]
>;

export function isFrailtyLevel(value: unknown): value is FrailtyLevel {
  return typeof value === "string" && (FRAILTY_LEVEL_IDS as readonly string[]).includes(value);
}

export function normalizeFrailtyLevel(value: unknown): FrailtyLevel {
  return isFrailtyLevel(value) ? value : DEFAULT_FRAILTY_LEVEL;
}

/** Coarse algorithm flag implied by CFS. Unknown lets falls fields still derive. */
export function triStateFromFrailtyLevel(level: FrailtyLevel | undefined | null): TriState | null {
  const q = normalizeFrailtyLevel(level);
  if (q === "unknown") return null;
  return OPTION_BY_ID[q].mapsTo;
}

export function frailtyLevelSetsFallsScenario(level: FrailtyLevel | undefined | null): boolean {
  return triStateFromFrailtyLevel(level) === "yes";
}

export function frailtyLevelLabel(level: FrailtyLevel | undefined | null): string {
  return OPTION_BY_ID[normalizeFrailtyLevel(level)].label;
}

export function frailtyLevelReviewed(level: FrailtyLevel | undefined | null): boolean {
  return normalizeFrailtyLevel(level) !== "unknown";
}

/**
 * Combine documented falls with CFS. Frail (CFS 5–9) sets frequentFalls yes
 * (high falls / frailty risk). Not-frail (CFS 1–4) does not clear a documented
 * frequent-falls yes. Unknown CFS leaves the falls-derived value.
 */
export function combineFallsAndFrailty(
  fromFalls: TriState,
  level: FrailtyLevel | undefined | null,
): TriState {
  const fromFrailty = triStateFromFrailtyLevel(level);
  if (fromFalls === "yes" || fromFrailty === "yes") return "yes";
  if (fromFrailty === "no") return "no";
  return fromFalls;
}
