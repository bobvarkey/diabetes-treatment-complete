import { describe, it, expect } from "vitest";
import { bridgingWindow, zoledronatePlan, crClSafety } from "./denosumabLogic";

describe("bridgingWindow — 6/7/9-month schedule", () => {
  it("computes ideal window at 6–7 mo and hard deadline at 9 mo after last dose", () => {
    const w = bridgingWindow("2026-01-15")!;
    expect(w.start.toISOString().slice(0, 10)).toBe("2026-07-15");
    expect(w.end.toISOString().slice(0, 10)).toBe("2026-08-15");
    expect(w.hard.toISOString().slice(0, 10)).toBe("2026-10-15");
  });

  it("handles year rollover correctly (Oct → next April/May/July)", () => {
    const w = bridgingWindow("2026-10-31")!;
    // JS Date month arithmetic normalises overflow; assert the deltas, not the exact day.
    expect(w.start.getFullYear()).toBe(2027);
    expect(w.hard.getFullYear()).toBe(2027);
    expect(w.hard.getTime()).toBeGreaterThan(w.end.getTime());
    expect(w.end.getTime()).toBeGreaterThan(w.start.getTime());
  });

  it("returns null for missing or unparseable input", () => {
    expect(bridgingWindow("")).toBeNull();
    expect(bridgingWindow("not-a-date")).toBeNull();
  });
});

describe("zoledronatePlan — dose selection", () => {
  it("short-duration denosumab, no prior vert fx → single 5 mg IV at 6 mo", () => {
    const p = zoledronatePlan("short", false);
    expect(p.infusions).toBe(1);
    expect(p.doseMg).toBe(5);
    expect(p.monthsAfterLastDose).toEqual([6]);
  });

  it("long-duration (≥2.5 y) → two 5 mg IV infusions at 6 and 12 mo", () => {
    const p = zoledronatePlan("long", false);
    expect(p.infusions).toBe(2);
    expect(p.monthsAfterLastDose).toEqual([6, 12]);
    expect(p.notes.join(" ")).toMatch(/≥ 2\.5 y/);
  });

  it("prior vertebral fracture upgrades short-duration to two infusions", () => {
    const p = zoledronatePlan("short", true);
    expect(p.infusions).toBe(2);
    expect(p.monthsAfterLastDose).toEqual([6, 12]);
    expect(p.notes.join(" ")).toMatch(/vertebral fracture/i);
  });

  it("all plans use 5 mg IV — never a partial dose", () => {
    for (const d of ["short", "long"] as const) {
      for (const fx of [false, true]) {
        expect(zoledronatePlan(d, fx).doseMg).toBe(5);
      }
    }
  });
});

describe("crClSafety — renal branching", () => {
  it("CrCl < 35 blocks zoledronate and recommends oral bisphosphonate", () => {
    const r = crClSafety("zoledronate", 28);
    expect(r.severity).toBe("danger");
    expect(r.allowed).toBe(false);
    expect(r.recommendedPlan).toBe("oral_bp");
    expect(r.messages.join(" ")).toMatch(/contraindicated/i);
  });

  it("CrCl 35–59 allows zoledronate with a caution", () => {
    const r = crClSafety("zoledronate", 45);
    expect(r.severity).toBe("warning");
    expect(r.allowed).toBe(true);
    expect(r.messages.join(" ")).toMatch(/hydrate|25-OH-D/);
  });

  it("CrCl ≥ 60 → zoledronate is safe", () => {
    const r = crClSafety("zoledronate", 80);
    expect(r.severity).toBe("ok");
    expect(r.allowed).toBe(true);
  });

  it("CrCl < 30 also blocks oral bisphosphonate and recommends continuing denosumab", () => {
    const r = crClSafety("oral_bp", 25);
    expect(r.severity).toBe("danger");
    expect(r.allowed).toBe(false);
    expect(r.recommendedPlan).toBe("continue");
  });

  it("oral BP with CrCl 30–60 is acceptable", () => {
    const r = crClSafety("oral_bp", 40);
    expect(r.allowed).toBe(true);
    expect(r.severity).toBe("ok");
  });

  it("continue plan is always safe regardless of CrCl", () => {
    expect(crClSafety("continue", 10).allowed).toBe(true);
    expect(crClSafety("continue", null).allowed).toBe(true);
  });

  it("missing CrCl warns and blocks zoledronate specifically", () => {
    const r = crClSafety("zoledronate", null);
    expect(r.severity).toBe("warning");
    expect(r.allowed).toBe(false);
    expect(r.messages.join(" ")).toMatch(/not entered/i);
  });
});
