import { describe, expect, it } from "vitest";
import {
  applyJevFinalCategory,
  applyJevNoul,
  applyJevScore,
  CLOSED_CATEGORY_ROUTE_MODE,
  gateConfidence,
  JEV_ACT_MIN,
  JEV_ASK_MIN,
} from "./gates";

describe("Jev confidence gates", () => {
  it("acts at ≥ 0.75, asks at 0.50–0.74, reviews below 0.50", () => {
    expect(JEV_ACT_MIN).toBe(0.75);
    expect(JEV_ASK_MIN).toBe(0.5);
    expect(gateConfidence(0.75)).toBe("act");
    expect(gateConfidence(1)).toBe("act");
    expect(gateConfidence(0.74)).toBe("ask");
    expect(gateConfidence(0.5)).toBe("ask");
    expect(gateConfidence(0.49)).toBe("review");
    expect(gateConfidence(0)).toBe("review");
    expect(gateConfidence(null)).toBe("review");
    expect(gateConfidence(Number.NaN)).toBe("review");
  });

  it("REPLACE is the closed-category route mode", () => {
    expect(CLOSED_CATEGORY_ROUTE_MODE).toBe("REPLACE");
  });
});

describe("applyJevFinalCategory", () => {
  const probs = {
    very_high: 0.1,
    high: 0.8,
    below_treatment_threshold: 0.05,
    assessment_incomplete: 0.05,
  };

  it("REPLACE the deterministic category when confidence is ≥ 0.75", () => {
    const r = applyJevFinalCategory({
      deterministic: "high",
      answer: {
        type: "choice",
        choice: "very_high",
        confidence: 0.75,
        probabilities: { ...probs, very_high: 0.82, high: 0.1 },
      },
    });
    expect(r.mode).toBe("replace");
    expect(r.displayed).toBe("very_high");
    expect(r.applied).toBe(true);
    expect(r.reviewFlag).toBe(false);
    expect(r.gate).toBe("act");
  });

  it("shows label + probabilities and asks the clinician at 0.50–0.74", () => {
    const r = applyJevFinalCategory({
      deterministic: "high",
      answer: { type: "choice", choice: "very_high", confidence: 0.62, probabilities: probs },
    });
    expect(r.mode).toBe("ask_clinician");
    expect(r.displayed).toBe("high");
    expect(r.applied).toBe(false);
    expect(r.reviewFlag).toBe(true);
    expect(r.jevChoice).toBe("very_high");
    expect(r.probabilities).toEqual(probs);
    expect(r.clinicianPrompt).toMatch(/very high/i);
  });

  it("keeps the deterministic result with a review flag below 0.50", () => {
    const r = applyJevFinalCategory({
      deterministic: "high",
      answer: { type: "choice", choice: "very_high", confidence: 0.49, probabilities: probs },
    });
    expect(r.mode).toBe("keep_deterministic");
    expect(r.displayed).toBe("high");
    expect(r.applied).toBe(false);
    expect(r.reviewFlag).toBe(true);
  });

  it("rejects undeclared choices even at high confidence", () => {
    const r = applyJevFinalCategory({
      deterministic: "high",
      answer: {
        type: "choice",
        choice: "moderate",
        confidence: 0.99,
        probabilities: { moderate: 1 },
      },
    });
    expect(r.mode).toBe("keep_deterministic");
    expect(r.displayed).toBe("high");
    expect(r.reviewFlag).toBe(true);
  });
});

describe("score and noul gates", () => {
  it("acts on need_specialist only at ≥ 0.75", () => {
    const acted = applyJevScore({
      type: "score",
      score: 2,
      confidence: 0.8,
      legend: { "0": "routine", "1": "consider", "2": "prompt specialist" },
      probabilities: { "0": 0.05, "1": 0.1, "2": 0.85 },
    });
    expect(acted.acted).toBe(true);
    expect(acted.label).toMatch(/prompt specialist/);

    const ask = applyJevScore({
      type: "score",
      score: 1.2,
      confidence: 0.6,
      legend: { "0": "routine", "1": "consider", "2": "prompt specialist" },
      probabilities: { "0": 0.2, "1": 0.5, "2": 0.3 },
    });
    expect(ask.acted).toBe(false);
    expect(ask.gate).toBe("ask");
    expect(ask.clinicianPrompt).toMatch(/ask the clinician/i);
  });

  it("uses noul as confidence when a separate confidence field is absent", () => {
    expect(applyJevNoul({ noul: 0.81 }).gate).toBe("act");
    expect(applyJevNoul({ noul: 0.55 }).gate).toBe("ask");
    expect(applyJevNoul({ noul: 0.2 }).gate).toBe("review");
  });
});
