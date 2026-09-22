import { describe, expect, it } from "vitest";
import {
  alcoholBandFromUnits,
  earlyMenopauseImpliesPostmenopausal,
  intakePatchFromSecondaryCauseQualifiers,
  lifestylePatchFromAlcoholSmoking,
  normalizeSecondaryCauseQualifiers,
  qualifierSnippet,
  qualifiersForSelectedFlags,
  qualifierKeyForLabel,
  labelForQualifierKey,
  seedQualifiersForFlags,
  selectedSecondaryCauseQualifiedSummary,
} from "./secondaryCauseQualifiers";
import { isFraxSecondaryOsteoporosis } from "./secondaryCauses";

describe("qualifier key mapping", () => {
  it("round-trips labels to compact keys", () => {
    expect(qualifierKeyForLabel("Chronic PPI / anticonvulsants / heparin")).toBe("ppiOther");
    expect(labelForQualifierKey("ppiOther")).toBe("Chronic PPI / anticonvulsants / heparin");
    expect(qualifierKeyForLabel("None identified")).toBeNull();
  });
});

describe("normalizeSecondaryCauseQualifiers", () => {
  it("drops junk and fills known keys", () => {
    expect(normalizeSecondaryCauseQualifiers(null)).toEqual({});
    expect(normalizeSecondaryCauseQualifiers({ invented: { foo: 1 } })).toEqual({});
    const q = normalizeSecondaryCauseQualifiers({
      hypogonadism: { phenotype: "early_menopause", menopauseAgeYears: "38", menopauseOnset: "surgical" },
      phpt: { status: "not-a-status" },
    });
    expect(q.hypogonadism).toEqual({
      phenotype: "early_menopause",
      menopauseAgeYears: "38",
      menopauseOnset: "surgical",
    });
    expect(q.phpt).toEqual({ status: "unknown" });
  });

  it("round-trips through session JSON", () => {
    const stored = {
      ppiOther: { agent: "ppi", status: "current", durationMonths: "24", highDosePpi: true },
      alcoholSmoking: { smoking: "current", alcohol: "over_3", alcoholUnitsPerDay: "5" },
    };
    const raw = JSON.stringify(stored);
    expect(normalizeSecondaryCauseQualifiers(JSON.parse(raw))).toEqual(stored);
  });
});

describe("qualifiersForSelectedFlags", () => {
  it("keeps only ticked causes for Jev compact state", () => {
    const all = normalizeSecondaryCauseQualifiers({
      t1d: { context: "known" },
      myeloma: { status: "mgus" },
      ra: { activity: "active" },
    });
    expect(qualifiersForSelectedFlags(["Type 1 diabetes"], all)).toEqual({ t1d: { context: "known" } });
    expect(qualifiersForSelectedFlags(["None identified"], all)).toEqual({});
  });
});

describe("mapping onto existing engine / FRAX fields", () => {
  it("maps smoking and alcohol amount onto currentSmoking / alcohol3OrMore", () => {
    expect(
      lifestylePatchFromAlcoholSmoking({
        smoking: "current",
        alcohol: "unknown",
        alcoholUnitsPerDay: "5",
      }),
    ).toEqual({ currentSmoking: true, alcohol3OrMore: true });
    expect(
      lifestylePatchFromAlcoholSmoking({
        smoking: "never",
        alcohol: "under_3",
        alcoholUnitsPerDay: "",
      }),
    ).toEqual({ currentSmoking: false, alcohol3OrMore: false });
    expect(
      lifestylePatchFromAlcoholSmoking({
        smoking: "unknown",
        alcohol: "unknown",
        alcoholUnitsPerDay: "",
      }),
    ).toEqual({});
    expect(alcoholBandFromUnits("0", "unknown")).toBe("none");
    expect(alcoholBandFromUnits("2", "unknown")).toBe("under_3");
    expect(alcoholBandFromUnits("3", "unknown")).toBe("under_3");
    expect(alcoholBandFromUnits("3.5", "unknown")).toBe("over_3");
  });

  it("early menopause implies postmenopausal and does not invent a FRAX multiplier", () => {
    const flags = ["Hypogonadism / early menopause"];
    const q = {
      hypogonadism: {
        phenotype: "early_menopause" as const,
        menopauseAgeYears: "38",
        menopauseOnset: "surgical" as const,
      },
    };
    expect(earlyMenopauseImpliesPostmenopausal(flags, q)).toBe(true);
    expect(intakePatchFromSecondaryCauseQualifiers(flags, q)).toEqual({ postmenopausal: true });
    expect(isFraxSecondaryOsteoporosis(flags)).toBe(true);
  });

  it("does not treat treated hyperthyroidism or MGUS as a new FRAX multiplier", () => {
    expect(isFraxSecondaryOsteoporosis(["Hyperthyroidism / over-replacement"])).toBe(true);
    expect(isFraxSecondaryOsteoporosis(["Multiple myeloma / MGUS"])).toBe(true);
    expect(isFraxSecondaryOsteoporosis(["Type 2 diabetes"])).toBe(false);
    expect(isFraxSecondaryOsteoporosis(["Chronic PPI / anticonvulsants / heparin"])).toBe(false);
    expect(isFraxSecondaryOsteoporosis(["Aromatase inhibitor / ADT"])).toBe(false);
    expect(
      intakePatchFromSecondaryCauseQualifiers(["Hyperthyroidism / over-replacement"], {
        hyperthyroid: { status: "treated", tsh: "0.2" },
      }),
    ).toEqual({});
  });

  it("does not map CKD details onto a second flag (reuse Advanced CKD / CKD-MBD)", () => {
    expect(
      intakePatchFromSecondaryCauseQualifiers(["CKD"], {}),
    ).toEqual({});
    expect(qualifierSnippet("CKD", {}, { ckdQualifier: "g5" })).toBe("CKD G5 (eGFR <15)");
  });
});

describe("seedQualifiersForFlags", () => {
  it("seeds alcohol/smoking from existing lifestyle toggles and restores after re-tick", () => {
    const seeded = seedQualifiersForFlags({
      previousFlags: [],
      nextFlags: ["Alcohol > 3 U/d or smoker"],
      qualifiers: {},
      currentSmoking: true,
      alcohol3OrMore: true,
    });
    expect(seeded.alcoholSmoking).toEqual({
      smoking: "current",
      alcohol: "over_3",
      alcoholUnitsPerDay: "",
    });

    const kept = seedQualifiersForFlags({
      previousFlags: ["Alcohol > 3 U/d or smoker"],
      nextFlags: [],
      qualifiers: {
        alcoholSmoking: { smoking: "current", alcohol: "over_3", alcoholUnitsPerDay: "6" },
      },
    });
    expect(kept.alcoholSmoking?.alcoholUnitsPerDay).toBe("6");

    const restored = seedQualifiersForFlags({
      previousFlags: [],
      nextFlags: ["Alcohol > 3 U/d or smoker"],
      qualifiers: kept,
    });
    expect(restored.alcoholSmoking?.alcoholUnitsPerDay).toBe("6");
  });
});

describe("qualified summary", () => {
  it("appends clinically useful snippets", () => {
    expect(
      selectedSecondaryCauseQualifiedSummary(
        ["Hypogonadism / early menopause", "Chronic PPI / anticonvulsants / heparin"],
        {
          hypogonadism: {
            phenotype: "early_menopause",
            menopauseAgeYears: "38",
            menopauseOnset: "surgical",
          },
          ppiOther: { agent: "ppi", status: "current", durationMonths: "24", highDosePpi: true },
        },
      ),
    ).toBe(
      "Hypogonadism / early menopause (early menopause, surgical, age 38 y); Chronic PPI / anticonvulsants / heparin (PPI, current, 24 mo, high-dose PPI)",
    );
  });
});
