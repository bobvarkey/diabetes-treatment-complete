import { describe, it, expect } from "vitest";
import {
  stratify,
  checkDxaSite,
  discordanceGuidance,
  type StratifyInput,
} from "./osteoporosisLogic";

const base: StratifyInput = {
  fractureType: "none",
  priorHipOrVertebral: false,
  tScore: "",
  fraxMajor: "",
  fraxHip: "",
  recentMultiple: false,
  multipleVertebral: false,
  glucocorticoid: false,
  advancedAge: false,
  highFallRisk: false,
};

describe("stratify — index-site T-score only", () => {
  it("uses the femoral-neck T-score (–2.6) → high risk", () => {
    const r = stratify({ ...base, tScore: -2.6 });
    expect(r.risk).toBe("high");
    expect(r.reasons.join(" ")).toMatch(/-2.6/);
  });

  it("does NOT upgrade risk if only the fracture-site (radius) T-score is low but femoral neck is normal", () => {
    // Simulate the mistake: user entered –0.5 (correct femoral neck) — even if
    // the radius was –3.0, the calculator must not see it.
    const r = stratify({ ...base, tScore: -0.5, fractureType: "distal radius" });
    expect(r.risk).toBe("moderate");
    expect(r.reasons.join(" ")).not.toMatch(/-3/);
  });

  it("does NOT use maximum (best) T-score — a low femoral neck still stratifies as high", () => {
    // If someone wrongly took max across sites (–0.8), risk would be moderate.
    // The correct femoral neck (–2.7) must yield high.
    const wrongMax = stratify({ ...base, tScore: -0.8 });
    const correctIndex = stratify({ ...base, tScore: -2.7 });
    expect(wrongMax.risk).toBe("moderate");
    expect(correctIndex.risk).toBe("high");
  });

  it("very-low BMD (T ≤ –3) → very high", () => {
    expect(stratify({ ...base, tScore: -3.1 }).risk).toBe("veryHigh");
  });

  it("FRAX major ≥ 20 or hip ≥ 3 → high", () => {
    expect(stratify({ ...base, fraxMajor: 22 }).risk).toBe("high");
    expect(stratify({ ...base, fraxHip: 3.5 }).risk).toBe("high");
  });
});

describe("checkDxaSite — index-site validator", () => {
  it("accepts femoral neck", () => {
    expect(checkDxaSite("femoral neck").severity).toBe("ok");
  });
  it("accepts total hip", () => {
    expect(checkDxaSite("total hip").severity).toBe("ok");
  });
  it("rejects lumbar spine with an error", () => {
    const r = checkDxaSite("lumbar spine");
    expect(r.severity).toBe("error");
    expect(r.message).toMatch(/NOT a FRAX index site/i);
  });
  it("rejects distal radius (fracture-site trap) with an error", () => {
    const r = checkDxaSite("distal radius");
    expect(r.severity).toBe("error");
    expect(r.message).toMatch(/peripheral DXA/i);
  });
  it("warns when no site selected (invalid input)", () => {
    const r = checkDxaSite("");
    expect(r.severity).toBe("warning");
    expect(r.ok).toBe(false);
  });
});

describe("discordanceGuidance — spine–hip", () => {
  it("flags spine ≥ 1 SD lower and recommends up-adjustment without swapping FRAX input", () => {
    const r = discordanceGuidance(-1.8, -3.0);
    expect(r.discordant).toBe(true);
    expect(r.upAdjust).toBe(true);
    expect(r.message).toMatch(/Do NOT swap/i);
  });
  it("no adjustment when hip is the lower site", () => {
    const r = discordanceGuidance(-3.0, -1.5);
    expect(r.upAdjust).toBe(false);
    expect(r.message).toMatch(/no additional up-adjustment/i);
  });
  it("no discordance when within 1 SD", () => {
    const r = discordanceGuidance(-2.0, -2.5);
    expect(r.discordant).toBe(false);
  });
  it("handles missing inputs gracefully", () => {
    const r = discordanceGuidance(NaN, -2.0);
    expect(r.discordant).toBe(false);
    expect(r.message).toMatch(/Enter both/);
  });
});
