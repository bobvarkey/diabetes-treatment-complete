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
 * IWGDF risk categories and screening intervals (IWGDF 2023 Prevention Guideline).
 * Categorical classification, not an additive score. Assign the highest qualifying category (evaluate 3 → 0).
 * Risk 0 yearly; risk 1 every 6–12 months; risk 2 every 3–6 months; risk 3 every 1–3 months.
 */
export const iwgdfRiskCategories = [
  {
    risk: "0",
    label: "Very low risk",
    criteria:
      "LOPS confirmed absent and PAD confirmed absent. Do not assign this category if either finding is unknown.",
    frequency: "Once a year",
    tone: "border-success/30 bg-success/5",
  },
  {
    risk: "1",
    label: "Low risk",
    criteria: "LOPS or PAD present, and category 2 or 3 criteria are not met.",
    frequency: "Once every 6 to 12 months",
    tone: "border-info/30 bg-info/5",
  },
  {
    risk: "2",
    label: "Moderate risk",
    criteria:
      "LOPS + PAD, LOPS + foot deformity, or PAD + foot deformity, and category 3 criteria are not met.",
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

/** Inputs used for IWGDF preventive foot-risk classification. */
export const iwgdfRiskInputs = [
  { id: "LOPS", label: "LOPS", detail: "Loss of protective sensation" },
  { id: "PAD", label: "PAD", detail: "Peripheral artery disease" },
  { id: "foot_deformity", label: "Foot deformity", detail: "Structural foot deformity" },
  { id: "previous_foot_ulcer", label: "Prior foot ulcer", detail: "History of foot ulcer" },
  {
    id: "previous_lower_extremity_amputation",
    label: "Prior amputation",
    detail: "Minor or major lower-extremity amputation",
  },
  { id: "end_stage_renal_disease", label: "ESRD", detail: "End-stage renal disease" },
] as const;

/**
 * PAD assessment for diabetic foot risk classification.
 * Sources: ACC/AHA 2024 Lower Extremity PAD Guideline; IWGDF 2023 Intersocietal PAD Guideline;
 * IWGDF 2023 Prevention Guideline.
 */
export const padAssessment = {
  title: "PAD assessment and IWGDF diabetic foot risk classification",
  sources: [
    "ACC/AHA 2024 Lower Extremity PAD Guideline",
    "IWGDF 2023 Intersocietal PAD Guideline",
    "IWGDF 2023 Prevention Guideline",
  ],
  initialAssessment: [
    "Assess vascular symptoms and palpate pedal pulses.",
    "If PAD is suspected in a person with diabetes, combine ABI, TBI, and pedal Doppler waveforms.",
  ],
  restingAbi: [
    {
      criterion: "ABI ≤ 0.90",
      interpretation: "Abnormal; supports diagnosis of PAD",
    },
    {
      criterion: "0.90 < ABI < 1.00",
      interpretation: "Borderline",
    },
    {
      criterion: "1.00 ≤ ABI ≤ 1.40",
      interpretation: "Normal range; does not exclude PAD in diabetes",
    },
    {
      criterion: "ABI > 1.40",
      interpretation: "Noncompressible arteries — measure toe pressure/TBI with waveforms",
    },
  ],
  toePressure: {
    title: "Toe pressure: the most reliable metric in diabetes",
    rationale:
      "In diabetes, larger ankle arteries often calcify and become rigid (noncompressible), which falsely elevates ankle pressure and ABI. Small digital arteries in the toes are generally spared, so toe pressure is more sensitive and accurate than ankle pressure for diagnosing PAD and tracking healing potential.",
    zones: [
      {
        label: "Normal target",
        criterion: "70–100 mmHg",
        interpretation: "Typical healthy toe-pressure range.",
      },
      {
        label: "Healing probability zone",
        criterion: "≥ 30 mmHg",
        interpretation:
          "Increases the probability that a foot ulcer will heal without revascularization by up to about 30%.",
      },
      {
        label: "Severe ischemia zone",
        criterion: "< 30 mmHg",
        interpretation:
          "Raises the pre-test probability of major lower-extremity amputation by roughly 20%.",
      },
    ],
  },
  tbi: {
    accAhaAbnormal: "TBI ≤ 0.70",
    iwgdfAbnormal: "TBI < 0.70",
    interpretation:
      "Supports PAD diagnosis, particularly with ABI > 1.40 and suggestive clinical findings.",
    boundaryNote:
      "Guidelines differ at exactly 0.70; interpret alongside waveforms and clinical findings.",
  },
  pedalDopplerAbnormal: ["Monophasic waveform", "Absent signal"],
  padLessLikely: {
    findings: [
      "ABI 0.90–1.30",
      "TBI ≥ 0.70",
      "Biphasic or triphasic pedal Doppler waveforms",
    ],
    limitation: "No single test or threshold reliably excludes PAD in diabetes.",
  },
  additionalTesting: [
    {
      label: "Exercise ABI",
      detail:
        "Persistent exertional nonjoint-related leg symptoms with resting ABI > 0.90 and ≤ 1.40.",
    },
    {
      label: "Unresolved suspicion",
      detail: "Further vascular assessment; consider arterial duplex imaging.",
    },
  ],
  safeguards: [
    "Palpable pulses alone do not exclude PAD.",
    "An elevated ABI alone does not establish occlusive PAD.",
    "Record unresolved PAD status as unknown, not absent.",
  ],
} as const;
