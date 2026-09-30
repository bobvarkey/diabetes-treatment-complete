import { describe, expect, it } from "vitest";
import { migrateLegacyOsteoporosisIntake } from "./migrateLegacy";

describe("migrateLegacyOsteoporosisIntake", () => {
  it("preserves fracture, lowest DXA, steroid, CKD, therapy and secondary-cause data", () => {
    const result = migrateLegacyOsteoporosisIntake({
      age: "72",
      sex: "female",
      postmenopausal: true,
      fragilityFractureTypes: ["hip", "vertebral"],
      vertebralFractureCount: "2",
      femoralNeckTScore: "-2.7",
      lumbarSpineTScore: "-3.6",
      prednisoneEquivalentMgPerDay: "10",
      steroidDurationMonths: "6",
      ckdQualifier: "g4",
      crcl: "28",
      currentDrug: "denosumab",
      lastDenosumabDate: "2026-01-01",
      secondaryCauseFlags: ["Type 2 diabetes", "CKD"],
    });

    expect(result.fragility_fracture).toBe("multiple_vertebral");
    expect(result.lowest_valid_t_score).toBe(-3.6);
    expect(result.systemic_glucocorticoids).toBe("yes");
    expect(result.advanced_ckd_ckd_mbd_dialysis).toBe("yes_or_suspected");
    expect(result.current_therapy).toBe("denosumab");
    expect(result.bone_loss_conditions).toEqual(expect.arrayContaining(["type_2_diabetes", "ckd"]));
  });

  it("keeps unknown values unknown and never invents a negative", () => {
    const result = migrateLegacyOsteoporosisIntake({});
    expect(result.fragility_fracture).toBe("unknown");
    expect(result.dxa_status).toBe("unknown");
    expect(result.systemic_glucocorticoids).toBe("unknown");
    expect(result.advanced_ckd_ckd_mbd_dialysis).toBe("unknown");
  });
});