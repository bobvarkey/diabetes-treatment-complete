/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ThemeProvider } from "@/lib/theme";
import { CollapseAllProvider } from "./shared";
import OsteoporosisLiveRiskApp from "./OsteoporosisLiveRiskApp";
import type { NavigatorIntake } from "./osteoporosisAlgorithmMap";
import type { JevCallResult } from "@/lib/jev/types";

function completeIntake(): NavigatorIntake {
  return {
    age: "68",
    sex: "female",
    postmenopausal: true,
    fragilityFractureTypes: [],
    fractureHistoryComplete: "yes",
    fractureHistory: [],
    femoralNeckTScore: "-2.7",
    totalHipTScore: "-2.1",
    lumbarSpineTScore: "-2.2",
    fraxAboveNationalThreshold: "no",
    fallsInPast12Months: "0",
    injuriousFallInPast12Months: "no",
    clinicianIdentifiedHighFallsRisk: "no",
    prednisoneEquivalentMgPerDay: "0",
    steroidDurationMonths: "0",
    currentDrug: "none",
    lastDenosumabDate: "",
    denosumabDurationYears: "",
    lastTeriparatideDate: "",
    crcl: "80",
    secondaryCauseFlags: [],
    clinicalReviewComplete: true,
    hipFracture: "no",
    vertebralFractureCount: "0",
    otherFragilityFracture: "no",
    recentFragilityFracture: "no",
    recentVertebralFracture: "no",
    fractureOnTreatment: "no",
    advancedCkdOrCkdMbd: "no",
    frequentFalls: "no",
  };
}

function Harness({
  askJev,
  initial,
}: {
  askJev?: (payload: unknown, signal?: AbortSignal) => Promise<JevCallResult>;
  initial?: NavigatorIntake;
}) {
  const [input, setInput] = useState<NavigatorIntake>(initial ?? completeIntake());
  return (
    <ThemeProvider>
      <CollapseAllProvider pageId="test-osteo">
        <OsteoporosisLiveRiskApp
          input={input}
          onChange={(key, value) => setInput((p) => ({ ...p, [key]: value }))}
          askJev={askJev as never}
        />
      </CollapseAllProvider>
    </ThemeProvider>
  );
}

describe("OsteoporosisLiveRiskApp UI reactivity", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: false, reason: "missing_key", reviewFlag: true }),
      }),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the yellow assessment-incomplete callout until facts are obtained", () => {
    render(
      <Harness
        initial={{
          ...completeIntake(),
          age: "",
          sex: "",
          fractureHistoryComplete: "unknown",
          femoralNeckTScore: "",
          totalHipTScore: "",
          lumbarSpineTScore: "",
          fraxAboveNationalThreshold: "unknown",
          hipFracture: "unknown",
          vertebralFractureCount: "",
          otherFragilityFracture: "unknown",
          clinicalReviewComplete: false,
        }}
      />,
    );
    expect(screen.getByTestId("live-incomplete-banner").textContent).toMatch(
      /assessment incomplete/i,
    );
    expect(screen.getByTestId("live-incomplete-banner").textContent).toMatch(
      /do not auto-prescribe/i,
    );
    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/assessment incomplete/i);
  });

  it("reclassifies on T-score edit without a submit button", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByRole("button", { name: /^submit$/i })).toBeNull();
    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/High risk/i);

    const tscore = screen.getByLabelText("Femoral-neck T-score");
    await user.clear(tscore);
    await user.type(tscore, "-3.6");

    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/Very high risk/i);
  });

  it("shows Jev unavailable when the TypeSafe key is missing and still classifies", async () => {
    render(<Harness />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("jev-status").textContent).toMatch(/Jev unavailable/i);
    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/High risk/i);
  });

  it("asks the clinician and keeps the deterministic category at mid confidence", async () => {
    const askJev = vi.fn().mockResolvedValue({
      available: true,
      answers: {
        final_category: {
          type: "choice",
          choice: "very_high",
          confidence: 0.62,
          probabilities: {
            very_high: 0.55,
            high: 0.4,
            below_treatment_threshold: 0.03,
            assessment_incomplete: 0.02,
          },
        },
        need_specialist: {
          type: "score",
          score: 1.1,
          confidence: 0.6,
          legend: { "0": "routine", "1": "consider specialist", "2": "prompt specialist" },
          probabilities: { "0": 0.2, "1": 0.55, "2": 0.25 },
        },
        needs_judgment: { type: "noul", noul: 0.7, confidence: 0.66 },
      },
    } satisfies JevCallResult);

    const user = userEvent.setup();
    render(<Harness askJev={askJev} />);

    await user.click(screen.getByRole("radio", { name: "Frequent / high falls risk: Yes" }));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 500));
    });

    expect(askJev).toHaveBeenCalled();
    expect(screen.getByTestId("jev-status").textContent).toMatch(/ask clinician/i);
    expect(screen.getByTestId("jev-status").textContent).toMatch(/very high/i);
    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/High risk/i);
  });

  it("ticks secondary causes into live intake and marks assessment obtained", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByTestId("assessment-secondary_causes").textContent).toMatch(/unknown/i);
    expect(screen.getByTestId("secondary-causes-summary").textContent).toMatch(/None selected/i);

    await user.click(screen.getByRole("checkbox", { name: "Type 1 diabetes" }));

    expect(screen.getByTestId("assessment-secondary_causes").textContent).toMatch(/obtained/i);
    expect(screen.getByTestId("secondary-causes-summary").textContent).toMatch(
      /1 selected: Type 1 diabetes/,
    );
    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/High risk/i);
    expect(screen.getByTestId("secondary-cause-qualifier-t1d")).toBeTruthy();

    await user.click(screen.getByRole("checkbox", { name: "None identified on current review" }));
    expect(
      screen.getByRole("checkbox", { name: "Type 1 diabetes" }).getAttribute("aria-checked"),
    ).toBe("false");
    expect(screen.getByTestId("assessment-secondary_causes").textContent).toMatch(/obtained/i);
    expect(screen.getByTestId("secondary-causes-summary").textContent).toMatch(/None identified/i);
  });

  it("maps the CKD qualifier onto the advanced-CKD special scenario", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByTestId("ckd-qualifier-scenario-note")).toBeNull();
    await user.click(screen.getByRole("radio", { name: /CKD G5/i }));

    expect(screen.getByTestId("ckd-qualifier-scenario-note").textContent).toMatch(
      /special-scenario/i,
    );
    expect(screen.getByTestId("assessment-renal_ckd_mbd").textContent).toMatch(/obtained/i);
    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/High risk/i);
    expect(screen.getByText(/Individualize fracture assessment/i)).toBeTruthy();
  });

  it("maps a CFS frailty level onto falls-and-frailty assessment and the frequent-falls scenario", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByTestId("assessment-falls_frailty").textContent).toMatch(/obtained/i);
    expect(screen.queryByTestId("frailty-level-scenario-note")).toBeNull();

    await user.click(screen.getByRole("radio", { name: /CFS 6/i }));

    expect(screen.getByTestId("frailty-level-scenario-note").textContent).toMatch(
      /special-scenario/i,
    );
    expect(screen.getByTestId("assessment-falls_frailty").textContent).toMatch(/obtained/i);
    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/High risk/i);
    expect(screen.getAllByText(/falls assessment and prevention/i).length).toBeGreaterThan(0);
  });

  it("keeps live layout and secondary-causes grid from forcing a 3-col overflow", () => {
    render(<Harness />);
    expect(screen.getByTestId("osteoporosis-live-layout").className).toMatch(/\bmin-w-0\b/);
    expect(screen.getByTestId("secondary-causes-grid").className).toMatch(/\bgrid-cols-1\b/);
    expect(screen.getByTestId("secondary-causes-grid").className).not.toMatch(/grid-cols-3/);
    expect(screen.getByTestId("frailty-level-grid").className).toMatch(/\bgrid-cols-1\b/);
    expect(screen.getByTestId("frailty-level-grid").className).toMatch(/\bmin-w-0\b/);
    expect(screen.getByTestId("frailty-level-grid").className).not.toMatch(/grid-cols-3/);
    expect(screen.getByTestId("live-sex-pills").className).toMatch(/\bflex-wrap\b/);
    expect(screen.getByTestId("live-vert-count-pills").className).toMatch(/\bflex-wrap\b/);
  });

  it("uses magenta/peach choice pills for sex and vertebral count without a submit control", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByRole("button", { name: /^submit$/i })).toBeNull();
    expect(screen.getByTestId("osteoporosis-live-layout").parentElement?.className).toMatch(
      /osteo-live-helper/,
    );
    expect(screen.getByRole("heading", { name: "Secondary causes" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Sex: Female" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(screen.getByRole("radio", { name: "Vertebral fractures: None" }).className).toMatch(
      /is-selected/,
    );

    await user.click(screen.getByRole("radio", { name: "Vertebral fractures: At least 2" }));
    expect(screen.getByTestId("live-risk-category").textContent).toMatch(/Very high risk/i);
  });

  it("shows secondary-cause qualifiers only while that cause is ticked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByLabelText("Age at menopause (years)")).toBeNull();
    await user.click(screen.getByRole("checkbox", { name: "Hypogonadism / early menopause" }));
    expect(screen.getByLabelText("Age at menopause (years)")).toBeTruthy();
    const selectedRow = screen
      .getAllByTestId("secondary-cause-row")
      .find((row) => row.getAttribute("data-selected") === "true");
    expect(selectedRow?.className).toMatch(/\bsm:col-span-2\b/);
    expect(selectedRow?.closest(".osteo-live-helper")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Which hypogonadism?"), "early_menopause");
    await user.type(screen.getByLabelText("Age at menopause (years)"), "40");
    expect(screen.getByTestId("secondary-causes-summary").textContent).toMatch(/age 40 y/);

    await user.click(screen.getByRole("checkbox", { name: "Hypogonadism / early menopause" }));
    expect(screen.queryByLabelText("Age at menopause (years)")).toBeNull();
  });
});
