// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { ImageViewerProvider, useImageViewer } from "./ImageViewer";
import {
  DEFAULT_DRAG_THRESHOLD,
  canPan,
  exceedsDragThreshold,
  getDragThreshold,
  setDragThreshold,
} from "./imageViewerGestures";

function Opener() {
  const { open } = useImageViewer();
  return (
    <button type="button" onClick={() => open("/img.png", "Sample sheet")}>
      open viewer
    </button>
  );
}

function renderViewer() {
  return render(
    <ImageViewerProvider>
      <Opener />
    </ImageViewerProvider>,
  );
}

function pointer(type: string, x: number, y: number) {
  const e = new MouseEvent(type === "down" ? "pointerdown" : type === "move" ? "pointermove" : "pointerup", {
    bubbles: true,
    clientX: x,
    clientY: y,
  }) as MouseEvent & { pointerId?: number };
  e.pointerId = 1;
  return e;
}

describe("gesture sensitivity", () => {
  afterEach(() => setDragThreshold(DEFAULT_DRAG_THRESHOLD));

  it("ignores movement below the threshold", () => {
    expect(exceedsDragThreshold(2, 2)).toBe(false);
    expect(exceedsDragThreshold(0, DEFAULT_DRAG_THRESHOLD)).toBe(true);
  });

  it("threshold is configurable", () => {
    setDragThreshold(20);
    expect(getDragThreshold()).toBe(20);
    expect(exceedsDragThreshold(10, 0)).toBe(false);
    expect(exceedsDragThreshold(25, 0)).toBe(true);
  });

  it("pan only allowed when zoomed and pan mode on", () => {
    expect(canPan(true, 1)).toBe(false);
    expect(canPan(false, 3)).toBe(false);
    expect(canPan(true, 1.2)).toBe(true);
  });
});

describe("ImageViewer pan button", () => {
  beforeEach(() => renderViewer());
  afterEach(cleanup);

  it("opens the viewer and disables pan until zoomed", async () => {
    act(() => screen.getByText("open viewer").click());
    const panBtn = screen.getByLabelText("Pan mode") as HTMLButtonElement;
    expect(panBtn.disabled).toBe(true);
    expect(panBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("enables pan mode after zooming in and toggles off/on", () => {
    act(() => screen.getByText("open viewer").click());
    act(() => screen.getByLabelText("Zoom in").click());

    const panBtn = () => screen.getByLabelText("Pan mode") as HTMLButtonElement;
    expect(panBtn().disabled).toBe(false);
    expect(panBtn().getAttribute("aria-pressed")).toBe("true");

    act(() => panBtn().click());
    expect(panBtn().getAttribute("aria-pressed")).toBe("false");

    act(() => panBtn().click());
    expect(panBtn().getAttribute("aria-pressed")).toBe("true");
  });

  it("responds to a pan gesture past the threshold, not to a jitter below it", () => {
    act(() => screen.getByText("open viewer").click());
    act(() => screen.getByLabelText("Zoom in").click());

    const img = screen.getByAltText("Sample sheet") as HTMLImageElement;
    const surface = img.parentElement!;
    // Give the image a size so pan limits allow movement.
    Object.defineProperty(img, "offsetWidth", { value: 2000, configurable: true });
    Object.defineProperty(img, "offsetHeight", { value: 2000, configurable: true });
    Object.defineProperty(surface, "clientWidth", { value: 500, configurable: true });
    Object.defineProperty(surface, "clientHeight", { value: 500, configurable: true });

    const before = img.style.transform;

    // jitter below threshold — no movement
    act(() => {
      surface.dispatchEvent(pointer("down", 100, 100));
      surface.dispatchEvent(pointer("move", 102, 101));
    });
    expect(img.style.transform).toBe(before);

    // real pan — transform updates
    act(() => {
      surface.dispatchEvent(pointer("move", 180, 160));
      surface.dispatchEvent(pointer("up", 180, 160));
    });
    expect(img.style.transform).not.toBe(before);
  });
});
