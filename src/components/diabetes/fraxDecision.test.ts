import { describe, it, expect } from "vitest";
import { decideFrax } from "./FraxDecisionFlow";

const noFlags = {
  priorHipOrVertebral: false,
  multipleFractures: false,
  recentFracture: false,
  glucocorticoid: false,
  fallsHighRisk: false,
};

const none = { fraxMajor: NaN, fraxHip: NaN, tScore: NaN };

describe("decideFrax — fracture history drives risk without FRAX", () => {
  it("prior hip/vertebral fracture alone is at least high risk", () => {
    const d = decideFrax({ ...none, flags: { ...noFlags, priorHipOrVertebral: true } });
    expect(d.tier).toBe("high");
    expect(d.drivers.join(" ")).toMatch(/not calculated/i);
  });

  it("vertebral fracture within 2 years is very high risk", () => {
    const d = decideFrax({ ...none, flags: { ...noFlags, priorHipOrVertebral: true, recentVertebralFracture: true } });
    expect(d.tier).toBe("very-high");
  });

  it("two or more vertebral fractures is very high risk regardless of timing", () => {
    const d = decideFrax({ ...none, flags: { ...noFlags, multipleVertebralFractures: true } });
    expect(d.tier).toBe("very-high");
  });

  it("a manually ticked very-high-risk criterion alone forces very high risk with anabolic-first advice", () => {
    const d = decideFrax({ ...none, flags: { ...noFlags, manualVeryHighRisk: true } });
    expect(d.tier).toBe("very-high");
    expect(d.drivers.join(" ")).toMatch(/criterion selected at intake/i);
    expect(d.summary).toMatch(/anabolic/i);
  });

  it("prior fracture plus high-dose glucocorticoids escalates to very high", () => {
    const d = decideFrax({
      ...none,
      flags: { ...noFlags, priorHipOrVertebral: true, glucocorticoid: true, highDoseGlucocorticoid: true },
    });
    expect(d.tier).toBe("very-high");
  });

  it("recent hip fracture is at least high risk", () => {
    const d = decideFrax({ ...none, flags: { ...noFlags, recentHipFracture: true } });
    expect(["high", "very-high"]).toContain(d.tier);
  });

  it("osteopenia without fracture and without FRAX stays intermediate", () => {
    const d = decideFrax({ ...none, tScore: -1.8, flags: noFlags });
    expect(d.tier).toBe("intermediate");
  });
});
