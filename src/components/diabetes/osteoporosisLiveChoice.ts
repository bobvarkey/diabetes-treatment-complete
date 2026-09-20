import type { TriState } from "./osteoporosisAlgorithm";

export const TRI_PILL_OPTIONS: { value: TriState; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export type VertebralBand = "unknown" | "none" | "one" | "at_least_2";

export const VERTEBRAL_PILL_OPTIONS: { value: VertebralBand; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "none", label: "None" },
  { value: "one", label: "One" },
  { value: "at_least_2", label: "At least 2" },
];

export function vertebralCountToBand(count: string | undefined): VertebralBand {
  if (count == null || String(count).trim() === "") return "unknown";
  const n = Number(count);
  if (!Number.isFinite(n)) return "unknown";
  if (n <= 0) return "none";
  if (n === 1) return "one";
  return "at_least_2";
}

export function vertebralBandToCount(band: VertebralBand, previous?: string): string {
  if (band === "unknown") return "";
  if (band === "none") return "0";
  if (band === "one") return "1";
  const prev = previous != null && previous.trim() !== "" ? Number(previous) : NaN;
  if (Number.isFinite(prev) && prev >= 2) return String(Math.trunc(prev));
  return "2";
}
