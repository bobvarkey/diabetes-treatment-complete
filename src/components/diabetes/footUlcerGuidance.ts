/** Wagner grades aligned with the bedside classification figure (grades 0–5). */
export const wagnerGrades = [
  {
    grade: "0",
    finding: "Pre-ulcerative lesion",
    detail: "Pre-ulcerative area without an open lesion.",
  },
  {
    grade: "1",
    finding: "Superficial ulcer",
    detail: "Superficial ulcer that may penetrate to the dermal tissue.",
  },
  {
    grade: "2",
    finding: "Deep ulcer",
    detail:
      "Deep ulcer reaching ligaments, tendons, joint capsules, or bone, without abscess or osteomyelitis.",
  },
  {
    grade: "3",
    finding: "Deep ulcer with infection",
    detail: "Deep ulcer complicated by an abscess, osteomyelitis, or joint sepsis.",
  },
  {
    grade: "4",
    finding: "Localized gangrene",
    detail: "Localized gangrene involving part of the toe or heel.",
  },
  {
    grade: "5",
    finding: "Global foot gangrene",
    detail: "Gangrene of the whole foot.",
  },
] as const;

/**
 * IWGDF risk categories and screening intervals.
 * Risk 0 yearly; risk 1 every 6–12 months; risk 2 every 3–6 months; risk 3 every 1–3 months.
 */
export const iwgdfRiskCategories = [
  {
    risk: "0",
    label: "Very low risk",
    criteria: "No loss of protective sensation (LOPS) and no peripheral artery disease (PAD).",
    frequency: "Once a year",
    tone: "border-success/30 bg-success/5",
  },
  {
    risk: "1",
    label: "Low risk",
    criteria: "LOPS or PAD present.",
    frequency: "Once every 6 to 12 months",
    tone: "border-info/30 bg-info/5",
  },
  {
    risk: "2",
    label: "Moderate risk",
    criteria: "LOPS + PAD, LOPS + foot deformity, or PAD + foot deformity.",
    frequency: "Once every 3 to 6 months",
    tone: "border-warning/30 bg-warning/5",
  },
  {
    risk: "3",
    label: "High risk",
    criteria:
      "LOPS or PAD plus one or more of the following: history of a foot ulcer, lower-extremity amputation (minor or major), or end-stage renal disease.",
    frequency: "Once every 1 to 3 months",
    tone: "border-destructive/30 bg-destructive/5",
  },
] as const;
