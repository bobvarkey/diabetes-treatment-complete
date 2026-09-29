import { describe, expect, it } from "vitest";
import {
  convertCortisolInput,
  convertUfcInput,
  cortisolToNmolPerL,
  formatCortisolCutoff,
  ufcToNmolPer24h,
} from "./adrenalUnits";

describe("adrenal cortisol units", () => {
  it("converts serum and salivary cortisol between µg/dL and nmol/L", () => {
    expect(cortisolToNmolPerL(1.8, "µg/dL")).toBeCloseTo(49.662, 3);
    expect(convertCortisolInput("50", "nmol/L", "µg/dL")).toBe("1.81");
    expect(convertCortisolInput("1.81", "µg/dL", "nmol/L")).toBe("49.9");
  });

  it("uses the mass conversion for 24-hour urinary free cortisol", () => {
    expect(ufcToNmolPer24h(100, "µg/dL")).toBeCloseTo(275.9, 3);
    expect(convertUfcInput("275.9", "nmol/L", "µg/dL")).toBe("100");
  });

  it("formats decision thresholds in the selected unit", () => {
    expect(formatCortisolCutoff(50, "nmol/L")).toBe("50 nmol/L");
    expect(formatCortisolCutoff(50, "µg/dL")).toBe("1.81 µg/dL");
    expect(formatCortisolCutoff(415, "µg/dL")).toBe("15.04 µg/dL");
  });
});