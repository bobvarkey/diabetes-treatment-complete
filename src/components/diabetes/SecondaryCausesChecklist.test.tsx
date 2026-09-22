/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ThemeProvider } from "@/lib/theme";
import SecondaryCausesChecklist from "./SecondaryCausesChecklist";
import {
  DEFAULT_SECONDARY_CAUSE_QUALIFIERS,
  type SecondaryCauseQualifiers,
} from "./secondaryCauseQualifiers";

function Harness({
  initialFlags = [],
  initialQualifiers = DEFAULT_SECONDARY_CAUSE_QUALIFIERS,
}: {
  initialFlags?: string[];
  initialQualifiers?: SecondaryCauseQualifiers;
}) {
  const [flags, setFlags] = useState(initialFlags);
  const [qualifiers, setQualifiers] = useState(initialQualifiers);
  const [dose, setDose] = useState("5");
  const [months, setMonths] = useState("6");
  const [smoking, setSmoking] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  return (
    <ThemeProvider>
      <SecondaryCausesChecklist
        flags={flags}
        onChange={setFlags}
        qualifiers={qualifiers}
        onQualifiedChange={(next) => {
          setFlags(next.flags);
          setQualifiers(next.qualifiers);
          if (next.intakePatch.currentSmoking !== undefined) setSmoking(next.intakePatch.currentSmoking);
          if (next.intakePatch.alcohol3OrMore !== undefined) setAlcohol(next.intakePatch.alcohol3OrMore);
        }}
        glucocorticoidDose={dose}
        glucocorticoidMonths={months}
        onGlucocorticoidChange={(d, m) => {
          setDose(d);
          setMonths(m);
        }}
        ckdQualifier="unknown"
        currentSmoking={smoking}
        alcohol3OrMore={alcohol}
      />
      <p data-testid="persisted-json">{JSON.stringify({ flags, qualifiers, dose, months, smoking, alcohol })}</p>
    </ThemeProvider>
  );
}

describe("SecondaryCausesChecklist qualifiers", () => {
  afterEach(() => {
    cleanup();
  });
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
  });

  it("hides qualifier fields until a cause is ticked and shows them under the selected row", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByTestId("secondary-cause-qualifier-hypogonadism")).toBeNull();
    expect(screen.queryByLabelText("Age at menopause (years)")).toBeNull();

    await user.click(screen.getByRole("checkbox", { name: "Hypogonadism / early menopause" }));

    expect(screen.getByTestId("secondary-cause-qualifier-hypogonadism")).toBeTruthy();
    expect(screen.getByLabelText("Age at menopause (years)")).toBeTruthy();
    expect(screen.getByLabelText("Onset (if known)")).toBeTruthy();
  });

  it("collapses qualifier fields when unticked and restores values on re-tick", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("checkbox", { name: "Hypogonadism / early menopause" }));
    await user.selectOptions(screen.getByLabelText("Which hypogonadism?"), "early_menopause");
    await user.type(screen.getByLabelText("Age at menopause (years)"), "38");
    await user.selectOptions(screen.getByLabelText("Onset (if known)"), "surgical");

    expect(screen.getByTestId("persisted-json").textContent).toMatch(/"menopauseAgeYears":"38"/);

    await user.click(screen.getByRole("checkbox", { name: "Hypogonadism / early menopause" }));
    expect(screen.queryByTestId("secondary-cause-qualifier-hypogonadism")).toBeNull();
    expect(screen.getByTestId("persisted-json").textContent).toMatch(/"menopauseAgeYears":"38"/);

    await user.click(screen.getByRole("checkbox", { name: "Hypogonadism / early menopause" }));
    expect((screen.getByLabelText("Age at menopause (years)") as HTMLInputElement).value).toBe("38");
    expect((screen.getByLabelText("Onset (if known)") as HTMLSelectElement).value).toBe("surgical");
    expect((screen.getByLabelText("Which hypogonadism?") as HTMLSelectElement).value).toBe("early_menopause");
  });

  it("qualifies chronic PPI without inventing a FRAX field and maps alcohol amount onto lifestyle flags", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("checkbox", { name: "Chronic PPI / anticonvulsants / heparin" }));
    await user.selectOptions(screen.getByLabelText("Which agent?"), "ppi");
    await user.selectOptions(screen.getByLabelText("Ongoing vs past?"), "current");
    await user.type(screen.getByLabelText("Duration (months, if known)"), "24");
    await user.click(screen.getByRole("checkbox", { name: "High-dose PPI if relevant" }));

    expect(screen.getByTestId("secondary-causes-summary").textContent).toMatch(/PPI/);
    expect(screen.getByTestId("secondary-causes-summary").textContent).toMatch(/high-dose PPI/);

    await user.click(screen.getByRole("checkbox", { name: "Alcohol > 3 U/d or smoker" }));
    await user.selectOptions(screen.getByLabelText("Smoking"), "current");
    await user.type(screen.getByLabelText("Alcohol units/day (if known)"), "5");
    expect((screen.getByLabelText("Alcohol") as HTMLSelectElement).value).toBe("over_3");

    const persisted = JSON.parse(screen.getByTestId("persisted-json").textContent ?? "{}") as {
      smoking: boolean;
      alcohol: boolean;
    };
    expect(persisted.smoking).toBe(true);
    expect(persisted.alcohol).toBe(true);
  });

  it("aligns glucocorticoid dose/duration with existing fields and links CKD to the existing qualifier", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("checkbox", { name: "Chronic glucocorticoids" }));
    const dose = screen.getByLabelText("Prednisolone-equivalent (mg/day)") as HTMLInputElement;
    expect(dose.value).toBe("5");
    await user.clear(dose);
    await user.type(dose, "7.5");
    expect(JSON.parse(screen.getByTestId("persisted-json").textContent ?? "{}").dose).toBe("7.5");

    await user.click(screen.getByRole("checkbox", { name: "CKD" }));
    expect(screen.getByTestId("secondary-cause-qualifier-ckd").textContent).toMatch(
      /Advanced CKD \/ CKD-MBD/,
    );
    expect(screen.queryByRole("radio", { name: /CKD G5/i })).toBeNull();
  });
});
