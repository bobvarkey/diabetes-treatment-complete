// Approximate FRAX-style 10-year fracture probability estimator.
// NOT the official FRAX algorithm (which is proprietary and country-calibrated).
// Uses published risk-factor gradients applied to age/sex baseline probabilities.

export type Sex = "female" | "male";

export interface FraxInputs {
  age: number;            // 40-90
  sex: Sex;
  weightKg: number;
  heightCm: number;
  previousFracture: boolean;
  parentHipFracture: boolean;
  currentSmoking: boolean;
  glucocorticoids: boolean;
  rheumatoidArthritis: boolean;
  secondaryOsteoporosis: boolean;
  alcohol3OrMore: boolean;
  femoralNeckTScore?: number | null; // optional
}

export interface FraxResult {
  major: number; // % 10-year major osteoporotic fracture
  hip: number;   // % 10-year hip fracture
  bmi: number | null;
  usedBmd: boolean;
  category: "low" | "moderate" | "high" | "very high";
  notes: string[];
}

export function bmiOf(weightKg: number, heightCm: number): number | null {
  if (!isFinite(weightKg) || !isFinite(heightCm) || weightKg <= 0 || heightCm <= 0) return null;
  return weightKg / Math.pow(heightCm / 100, 2);
}

// Baseline 10-year probabilities (%) at age, no risk factors, average BMI, T-score 0.
function baseline(age: number, sex: Sex): { major: number; hip: number } {
  const a = Math.min(90, Math.max(40, age));
  // Exponential-ish rise with age, women roughly double men.
  const majorF = 2.2 * Math.exp(0.055 * (a - 50));
  const hipF = 0.22 * Math.exp(0.095 * (a - 50));
  const f = sex === "female" ? 1 : 0.5;
  return { major: majorF * f, hip: hipF * f };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function estimateFrax(i: FraxInputs): FraxResult {
  const notes: string[] = [];
  const base = baseline(i.age, i.sex);
  let major = base.major;
  let hip = base.hip;

  const rr = (on: boolean, m: number, h: number) => {
    if (on) { major *= m; hip *= h; }
  };
  rr(i.previousFracture, 1.86, 1.62);
  rr(i.parentHipFracture, 1.54, 2.28);
  rr(i.currentSmoking, 1.28, 1.60);
  rr(i.glucocorticoids, 1.66, 2.13);
  rr(i.rheumatoidArthritis, 1.36, 1.95);
  rr(i.secondaryOsteoporosis, 1.33, 1.60);
  rr(i.alcohol3OrMore, 1.38, 1.68);

  const bmi = bmiOf(i.weightKg, i.heightCm);
  if (bmi != null) {
    // Low BMI increases risk (strongest for hip); high BMI mildly protective for hip.
    const d = 25 - clamp(bmi, 15, 40);
    major *= Math.exp(0.010 * d);
    hip *= Math.exp(0.045 * d);
  } else {
    notes.push("BMI not supplied — estimate uses average body size.");
  }

  const t = i.femoralNeckTScore;
  const usedBmd = typeof t === "number" && isFinite(t);
  if (usedBmd) {
    // Gradient of risk per SD below 0 (femoral neck).
    const sd = clamp(-(t as number), -2, 5);
    major *= Math.pow(1.4, sd);
    hip *= Math.pow(2.0, sd);
  } else {
    notes.push("No femoral-neck T-score — BMD-independent estimate (wider uncertainty).");
  }

  major = clamp(major, 0.1, 95);
  hip = clamp(hip, 0.1, 90);

  const category: FraxResult["category"] =
    major >= 30 || hip >= 4.5 ? "very high"
    : major >= 20 || hip >= 3 ? "high"
    : major >= 10 || hip >= 1.5 ? "moderate"
    : "low";

  notes.push("Approximation for triage only — confirm with the official country-calibrated FRAX tool.");

  return { major: round1(major), hip: round1(hip), bmi: bmi == null ? null : round1(bmi), usedBmd, category, notes };
}

function round1(n: number) { return Math.round(n * 10) / 10; }
