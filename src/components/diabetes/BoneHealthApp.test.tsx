/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import BoneHealthApp from "./BoneHealthApp";

afterEach(() => {
  cleanup();
});

describe("BoneHealthApp", () => {
  it("walks a younger-adult choice and restores the start screen", async () => {
    const user = userEvent.setup();
    render(<BoneHealthApp />);

    expect(screen.getByTestId("bone-health-title").textContent).toBe("Which pathway applies?");
    expect(screen.getByTestId("bone-health-context").textContent).toContain("Population not selected");
    expect(screen.getByTestId("bone-health-context").textContent).toContain("Provisional risk not selected");
    expect((screen.getByTestId("bone-health-back") as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByTestId("bone-health-option-start__1"));
    expect(screen.getByTestId("bone-health-title").textContent).toBe("Younger adult: check clinical risk");
    expect(screen.getByTestId("bone-health-context").textContent).toContain("Premenopausal / under 50");
    expect(screen.getByTestId("bone-health-context").textContent).not.toContain("Provisional low risk");

    await user.click(screen.getByTestId("bone-health-back"));
    expect(screen.getByTestId("bone-health-title").textContent).toBe("Which pathway applies?");
    expect(screen.getByTestId("bone-health-context").textContent).toContain("Population not selected");
  });

  it("opens urgent assessment and returns to the previous screen", async () => {
    const user = userEvent.setup();
    render(<BoneHealthApp />);

    await user.click(screen.getByTestId("bone-health-option-start__2"));
    await user.click(screen.getByTestId("bone-health-urgent"));
    expect(screen.getByTestId("bone-health-title").textContent).toBe("Urgent clinical assessment");
    expect(screen.queryByTestId(/bone-health-option-/)).toBeNull();

    await user.click(screen.getByTestId("bone-health-back"));
    expect(screen.getByTestId("bone-health-title").textContent).toBe(
      "Older-adult pathway: establish treatment history",
    );
    expect(screen.getByTestId("bone-health-context").textContent).toContain("Postmenopausal / 50+");
  });

  it("restarts after a secondary-context choice", async () => {
    const user = userEvent.setup();
    render(<BoneHealthApp />);

    await user.click(screen.getByTestId("bone-health-option-start__3"));
    expect(screen.getByTestId("bone-health-context").textContent).toContain("Secondary context");

    await user.click(screen.getByTestId("bone-health-restart"));
    expect(screen.getByTestId("bone-health-title").textContent).toBe("Which pathway applies?");
    expect(screen.getByTestId("bone-health-context").textContent).not.toContain("Secondary context");
  });
});
