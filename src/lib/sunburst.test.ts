import { describe, expect, it } from "vitest";
import { arcPath, buildSunburst } from "./sunburst";

describe("buildSunburst", () => {
  const items = [
    { id: "a", label: "A", group: "G1", keywords: "x y z" },
    { id: "b", label: "B", group: "G2", keywords: "x" },
    { id: "c", label: "C", group: "G1", keywords: "" },
  ];
  it("groups in order, keeps every leaf, covers the full circle", () => {
    const g = buildSunburst(items, ["G1", "G2", "Empty"], 0);
    expect(g.map((x) => x.name)).toEqual(["G1", "G2"]);
    expect(g.flatMap((x) => x.children.map((c) => c.id))).toEqual(["a", "c", "b"]);
    expect(g[1]!.end).toBeCloseTo(Math.PI * 2);
  });
  it("only keyword-rich leaves become outliers", () => {
    const leaves = buildSunburst(items, ["G1", "G2"]).flatMap((g) => g.children);
    expect(leaves.find((l) => l.id === "a")!.weight).toBe(1);
    expect(leaves.find((l) => l.id === "c")!.weight).toBe(0);
  });
  it("arcPath yields a closed path", () => {
    expect(arcPath(10, 20, 0, 1)).toMatch(/^M.*Z$/);
  });
});
