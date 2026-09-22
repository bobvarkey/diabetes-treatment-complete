import { describe, expect, it } from "vitest";
import { RAT_BD_ALT } from "./RatBdTeachingFigure";

describe("RAT vs BD teaching figure", () => {
  it("alt text names both mnemonics and the clinical metaphor", () => {
    expect(RAT_BD_ALT).toMatch(/romosozumab/i);
    expect(RAT_BD_ALT).toMatch(/abaloparatide/i);
    expect(RAT_BD_ALT).toMatch(/teriparatide/i);
    expect(RAT_BD_ALT).toMatch(/bisphosphonate/i);
    expect(RAT_BD_ALT).toMatch(/denosumab/i);
    expect(RAT_BD_ALT).toMatch(/anabolic/i);
    expect(RAT_BD_ALT).toMatch(/antiresorptive/i);
  });
});
