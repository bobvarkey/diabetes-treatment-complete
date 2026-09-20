import { describe, expect, it } from "vitest";
import {
  SECONDARY_CAUSE_NONE,
  actualSecondaryCauseFlags,
  hasSecondaryCause,
  isFraxSecondaryOsteoporosis,
  isRheumatoidArthritisFlag,
  secondaryCausesReviewed,
  selectedSecondaryCauseSummary,
  toggleSecondaryCauseFlags,
} from "./secondaryCauses";

describe("toggleSecondaryCauseFlags", () => {
  it("allows none selected", () => {
    expect(toggleSecondaryCauseFlags(["Type 1 diabetes"], "Type 1 diabetes")).toEqual([]);
  });

  it("is multi-select for pathologic flags", () => {
    const once = toggleSecondaryCauseFlags([], "Type 1 diabetes");
    const twice = toggleSecondaryCauseFlags(once, "Rheumatoid arthritis");
    expect(twice).toEqual(["Type 1 diabetes", "Rheumatoid arthritis"]);
  });

  it("treats none-identified as mutually exclusive with causes", () => {
    const none = toggleSecondaryCauseFlags(["Type 1 diabetes"], SECONDARY_CAUSE_NONE);
    expect(none).toEqual([SECONDARY_CAUSE_NONE]);
    expect(toggleSecondaryCauseFlags(none, "CKD")).toEqual(["CKD"]);
    expect(toggleSecondaryCauseFlags(none, SECONDARY_CAUSE_NONE)).toEqual([]);
  });
});

describe("secondary-cause derived flags", () => {
  it("does not treat none-identified as a pathologic cause", () => {
    expect(hasSecondaryCause([SECONDARY_CAUSE_NONE])).toBe(false);
    expect(actualSecondaryCauseFlags([SECONDARY_CAUSE_NONE, "CKD"])).toEqual(["CKD"]);
    expect(secondaryCausesReviewed([SECONDARY_CAUSE_NONE])).toBe(true);
    expect(secondaryCausesReviewed([])).toBe(false);
  });

  it("maps FRAX secondary osteoporosis and RA separately", () => {
    expect(isFraxSecondaryOsteoporosis(["Type 1 diabetes"])).toBe(true);
    expect(isFraxSecondaryOsteoporosis(["Type 2 diabetes"])).toBe(false);
    expect(isFraxSecondaryOsteoporosis(["Rheumatoid arthritis"])).toBe(false);
    expect(isRheumatoidArthritisFlag(["Rheumatoid arthritis"])).toBe(true);
  });

  it("summarises selected labels", () => {
    expect(selectedSecondaryCauseSummary([]).text).toBe("None selected");
    expect(selectedSecondaryCauseSummary([SECONDARY_CAUSE_NONE]).text).toBe("None identified");
    expect(selectedSecondaryCauseSummary(["CKD"]).text).toBe("1 selected: CKD");
  });
});
