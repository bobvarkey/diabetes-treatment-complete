import { describe, expect, it } from "vitest";
import {
  OSTEO_MANAGEMENT_ALGO_ALT,
  OSTEO_MED_TABLE_ALT,
} from "./OsteoporosisManagementCharts";

describe("osteoporosis management algorithm figure", () => {
  it("alt text names the three pathway branches and the foundational intakes", () => {
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/Low-Moderate Fracture Risk/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/High-Very High Fracture Risk/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/Secondary Prevention in Older Adults/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/calcium 1000-1200 mg\/day/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/vitamin D 800-1000 IU\/day/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/OARS/i);
  });

  it("alt text keeps the denosumab rebound warning and the reassessment interval", () => {
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/do not stop without alternative antiresorptive/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/rebound vertebral fractures/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/reassess in 2-4 years/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/drug holiday after 3-5 years/i);
  });

  it("alt text maps each secondary-prevention fracture type to a drug", () => {
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/vertebral fracture recommend teriparatide/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/hip fracture recommend romosozumab/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/non-vertebral fracture recommend teriparatide or denosumab/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/multiple \(2 or more\) fractures recommend teriparatide or romosozumab/i);
    expect(OSTEO_MANAGEMENT_ALGO_ALT).toMatch(/high risk features recommend denosumab or romosozumab/i);
  });
});

describe("osteoporosis medication table figure", () => {
  it("alt text names every drug class with its dose and route", () => {
    expect(OSTEO_MED_TABLE_ALT).toMatch(/alendronate.*10 mg daily or 70 mg weekly/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/zoledronic acid.*5 mg IV yearly/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/denosumab.*60 mg subcutaneously every 6 months/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/teriparatide.*20 micrograms/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/abaloparatide.*80 micrograms/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/romosozumab.*210 mg subcutaneously monthly for 12 months/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/raloxifene.*60 mg daily/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/tibolone.*2\.5 mg daily/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/calcitonin.*200 IU/i);
  });

  it("alt text carries the renal cut-off and the follow-on therapy rules", () => {
    expect(OSTEO_MED_TABLE_ALT).toMatch(/eGFR below 35/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/do not stop without alternative antiresorptive/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/then an antiresorptive/i);
    expect(OSTEO_MED_TABLE_ALT).toMatch(/black box/i);
  });
});
