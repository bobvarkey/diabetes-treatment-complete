import { describe, expect, it } from "vitest";
import { assessTaperEligibility, buildTaperSchedule, clinicalResponse, interpretMorningCortisol, prednisoneEquivalent } from "./steroidTaperLogic";

describe("steroid taper eligibility", () => {
  it("blocks tapering until disease control and dose need are confirmed", () => {
    expect(assessTaperEligibility({ durationWeeks: 12, diseaseControlled: false, currentDoseNoLongerRequired: true, excludedScenario: false, adrenalCrisisConcern: false, repeatedRecentCourses: false }).status).toBe("blocked");
  });
  it("does not generate an HPA-protection taper for an uncomplicated short course", () => {
    expect(assessTaperEligibility({ durationWeeks: 2, diseaseControlled: true, currentDoseNoLongerRequired: true, excludedScenario: false, adrenalCrisisConcern: false, repeatedRecentCourses: false }).status).toBe("short-course");
  });
  it("treats repeated recent courses as taper-relevant", () => {
    expect(assessTaperEligibility({ durationWeeks: 2, diseaseControlled: true, currentDoseNoLongerRequired: true, excludedScenario: false, adrenalCrisisConcern: false, repeatedRecentCourses: true }).status).toBe("taper");
  });
  it("blocks a schedule when crisis is suspected", () => {
    expect(assessTaperEligibility({ durationWeeks: 20, diseaseControlled: true, currentDoseNoLongerRequired: true, excludedScenario: false, adrenalCrisisConcern: true, repeatedRecentCourses: false }).title).toMatch(/Emergency/);
  });
});

describe("phase-based taper schedule", () => {
  it("converts supported glucocorticoids to prednisone equivalent", () => {
    expect(prednisoneEquivalent("Hydrocortisone", 20)).toBe(5);
    expect(prednisoneEquivalent("Dexamethasone", 0.75)).toBe(5);
  });
  it("uses all dose phases from high dose to physiologic recovery", () => {
    const phases = new Set(buildTaperSchedule("Prednisolone", 50, 0, "standard").map((step) => step.phase));
    expect([...phases]).toEqual(["High dose", "Moderate dose", "Low dose", "Physiologic / recovery"]);
  });
  it("reduces more slowly from 10 to 5 mg than at high dose", () => {
    const schedule = buildTaperSchedule("Prednisolone", 45, 4, "standard");
    expect(schedule.find((step) => step.prednisoneEquivalentMg === 40)?.holdWeeks).toBe(1);
    expect(schedule.find((step) => step.prednisoneEquivalentMg === 9)?.holdWeeks).toBe(3);
  });
  it("applies faster and slower pace modifiers", () => {
    const faster = buildTaperSchedule("Prednisone", 20, 17.5, "faster")[0];
    const slower = buildTaperSchedule("Prednisone", 20, 17.5, "slower")[0];
    expect(faster?.holdWeeks).toBe(1);
    expect(slower?.holdWeeks).toBe(4);
  });
});

describe("HPA and symptom branches", () => {
  it("classifies the requested cortisol boundaries", () => {
    expect(interpretMorningCortisol(2.9, "µg/dL")?.level).toBe("low");
    expect(interpretMorningCortisol(3, "µg/dL")?.level).toBe("indeterminate");
    expect(interpretMorningCortisol(15, "µg/dL")?.level).toBe("indeterminate");
    expect(interpretMorningCortisol(15.1, "µg/dL")?.level).toBe("recovered");
  });
  it("supports nmol/L interpretation", () => {
    expect(interpretMorningCortisol(82, "nmol/L")?.level).toBe("low");
    expect(interpretMorningCortisol(415, "nmol/L")?.level).toBe("recovered");
  });
  it("prioritizes crisis and flare over milder symptom branches", () => {
    expect(clinicalResponse({ diseaseFlare: true, withdrawalSymptoms: true, adrenalSymptoms: true, crisisSymptoms: true }).title).toMatch(/crisis/i);
    expect(clinicalResponse({ diseaseFlare: true, withdrawalSymptoms: true, adrenalSymptoms: true, crisisSymptoms: false }).title).toMatch(/flare/i);
  });
});