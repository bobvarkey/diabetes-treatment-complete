import { describe, expect, it } from "vitest";
import { OSTEO_DRUG_CLASSES_ALT } from "./OsteoporosisInfographic";

describe("osteoporosis drug-class teaching chart", () => {
  it("alt text names all three drug-class columns", () => {
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/antiresorptive/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/anabolic/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/dual-action/i);
  });

  it("alt text names every key agent shown in the chart", () => {
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/alendronate/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/zoledronic acid/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/denosumab/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/raloxifene/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/teriparatide/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/abaloparatide/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/romosozumab/i);
  });

  it("alt text states each column's mechanism", () => {
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/osteoclast/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/PTH1 receptor/i);
    expect(OSTEO_DRUG_CLASSES_ALT).toMatch(/sclerostin/i);
  });
});
