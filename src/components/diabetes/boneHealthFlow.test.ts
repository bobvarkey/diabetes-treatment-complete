import { describe, expect, it } from "vitest";
import {
  BONE_HEALTH_VERSION,
  FlowError,
  boneHealthFlow,
  createSession,
  goBack,
  openUrgent,
  renderScreen,
  restartSession,
  selectMatchingVariant,
  selectOption,
  type FlowSession,
  type FlowState,
  type FlowVariant,
} from "./boneHealthFlow";

const groups = [null, "younger", "older"] as const;
const risks = [null, "low", "high", "very_high"] as const;

function state(partial: Partial<FlowState> = {}): FlowState {
  return {
    group: null,
    secondary: false,
    treated: false,
    initial: null,
    ...partial,
  };
}

function at(nodeId: string, partial: Partial<FlowState> = {}): FlowSession {
  return { nodeId, state: state(partial), history: [] };
}

describe("bone health guided flow", () => {
  it("starts with an unset population and no provisional risk", () => {
    const session = createSession();
    expect(BONE_HEALTH_VERSION).toBe("3.1-app");
    expect(session.nodeId).toBe("start");
    expect(session.history).toEqual([]);
    expect(session.state).toEqual({
      group: null,
      secondary: false,
      treated: false,
      initial: null,
    });
    expect(renderScreen(session).title).toBe("Which pathway applies?");
  });

  it("records a younger-adult choice and restores it on Back", () => {
    const start = createSession();
    const younger = selectOption(start, "start__1");
    expect(younger.nodeId).toBe("young_assess");
    expect(younger.state.group).toBe("younger");
    expect(start.state.group).toBeNull();
    expect(start.nodeId).toBe("start");

    const restored = goBack(younger);
    expect(restored.nodeId).toBe("start");
    expect(restored.state.group).toBeNull();
    expect(restored.history).toEqual([]);
  });

  it("keeps provisional very-high risk out of the low-risk final choices", () => {
    const screen = renderScreen(at("final", { group: "older", initial: "very_high" }));
    expect(screen.options.map((option) => option.id)).toEqual(["final__1", "final__2"]);
    expect(() => selectOption(at("final", { group: "older", initial: "very_high" }), "final__3")).toThrow(
      FlowError,
    );
  });

  it("offers untreated low risk only when the clinician has not already selected high or very high", () => {
    expect(renderScreen(at("final", { group: "older", initial: "low" })).options.map((option) => option.label)).toContain(
      "Low: untreated prevention",
    );
    expect(renderScreen(at("final", { group: "older", initial: null })).options.map((option) => option.label)).toContain(
      "Low: untreated prevention",
    );
    expect(
      renderScreen(at("final", { group: "older", initial: "high" })).options.map((option) => option.label),
    ).not.toContain("Low: untreated prevention");
  });

  it("sends younger and older glucocorticoid reviews back to their own pathways", () => {
    const younger = renderScreen(at("steroids", { group: "younger" }));
    const older = renderScreen(at("steroids", { group: "older", initial: "high" }));
    expect(younger.options[0]?.next_node_id).toBe("young_assess");
    expect(older.options[0]?.next_node_id).toBe("history");
    expect(younger.body.join(" ")).toContain("younger adults");
  });

  it("adds the younger-adult caution on treatment review", () => {
    const younger = renderScreen(at("review", { group: "younger", treated: true }));
    const older = renderScreen(at("review", { group: "older", treated: true, initial: "high" }));
    expect(younger.body.at(-1)).toMatch(/Younger adults require individualized specialist interpretation/);
    expect(older.body.join(" ")).not.toMatch(/Younger adults require individualized/);
  });

  it("restores provisional risk and the previous screen together", () => {
    let session = createSession();
    session = selectOption(session, "start__2");
    session = selectOption(session, "history__3");
    session = selectOption(session, "screen__2");
    expect(session.nodeId).toBe("initial");
    session = selectOption(session, "initial__1");
    expect(session.nodeId).toBe("modifiers");
    expect(session.state.initial).toBe("very_high");

    const restored = goBack(session);
    expect(restored.nodeId).toBe("initial");
    expect(restored.state.initial).toBeNull();
    expect(restored.state.group).toBe("older");
    expect(restored.state.treated).toBe(false);
  });

  it("opens urgent assessment without changing clinical context, and Back returns", () => {
    const older = selectOption(createSession(), "start__2");
    const urgent = openUrgent(older);
    const screen = renderScreen(urgent);
    expect(urgent.nodeId).toBe("urgent");
    expect(urgent.state.group).toBe("older");
    expect(screen.terminal).toBe(true);
    expect(screen.options).toEqual([]);
    expect(screen.body[0]).toMatch(/acute fracture/);

    const restored = goBack(urgent);
    expect(restored.nodeId).toBe("history");
    expect(restored.state.group).toBe("older");
  });

  it("restarts from the initial screen and rejects Back on an empty history", () => {
    const moved = selectOption(createSession(), "start__3");
    expect(moved.state.secondary).toBe(true);
    const fresh = restartSession();
    expect(fresh).toEqual(createSession());
    expect(() => goBack(fresh)).toThrow(FlowError);
  });

  it("rejects an unrecognised provisional risk instead of treating it as low", () => {
    const broken = at("final", { initial: "medium" as FlowState["initial"] });
    expect(() => renderScreen(broken)).toThrow(/not defaulted to low/);
  });

  it("rejects zero or several matching variants", () => {
    const variants: FlowVariant[] = [
      { when: { always: false }, title: "Hidden", body: [], options: [] },
      {
        when: { field: "initial", equals: "low" },
        title: "Low",
        body: [],
        options: [],
      },
    ];
    expect(() => selectMatchingVariant(variants, state())).toThrow(FlowError);
    expect(() =>
      selectMatchingVariant(
        [
          { when: { always: true }, title: "A", body: [], options: [] },
          { when: { always: true }, title: "B", body: [], options: [] },
        ],
        state(),
      ),
    ).toThrow(/found 2/);
  });

  it("resolves exactly one variant for every screen and recorded state", () => {
    for (const node of boneHealthFlow.nodes) {
      for (const group of groups) {
        for (const initial of risks) {
          for (const secondary of [false, true]) {
            for (const treated of [false, true]) {
              const screen = renderScreen(at(node.id, { group, initial, secondary, treated }));
              expect(screen.title.length).toBeGreaterThan(0);
              expect(screen.options.every((option) => option.id && option.next_node_id)).toBe(true);
            }
          }
        }
      }
    }
  });
});
