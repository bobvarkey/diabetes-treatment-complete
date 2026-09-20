import { describe, expect, it } from "vitest";
import { vertebralBandToCount, vertebralCountToBand } from "./osteoporosisLiveChoice";

describe("vertebral fracture pill mapping", () => {
  it("maps empty and non-numeric counts to unknown", () => {
    expect(vertebralCountToBand("")).toBe("unknown");
    expect(vertebralCountToBand(undefined)).toBe("unknown");
    expect(vertebralCountToBand("n/a")).toBe("unknown");
  });

  it("maps 0 / 1 / ≥2 onto None / One / At least 2 without inventing extra counts", () => {
    expect(vertebralCountToBand("0")).toBe("none");
    expect(vertebralCountToBand("1")).toBe("one");
    expect(vertebralCountToBand("2")).toBe("at_least_2");
    expect(vertebralCountToBand("3")).toBe("at_least_2");
  });

  it("writes bands back onto the existing string count field", () => {
    expect(vertebralBandToCount("unknown")).toBe("");
    expect(vertebralBandToCount("none")).toBe("0");
    expect(vertebralBandToCount("one")).toBe("1");
    expect(vertebralBandToCount("at_least_2")).toBe("2");
    expect(vertebralBandToCount("at_least_2", "4")).toBe("4");
  });
});
