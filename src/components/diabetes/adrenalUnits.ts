export type CortisolUnit = "nmol/L" | "µg/dL";

export const CORTISOL_NMOL_PER_MICROGRAM_DL = 27.59;
export const UFC_NMOL_PER_MICROGRAM = 2.759;

export function cortisolToNmolPerL(value: number | null, unit: CortisolUnit): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return unit === "µg/dL" ? value * CORTISOL_NMOL_PER_MICROGRAM_DL : value;
}

export function ufcToNmolPer24h(value: number | null, unit: CortisolUnit): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return unit === "µg/dL" ? value * UFC_NMOL_PER_MICROGRAM : value;
}

function roundedInput(value: number): string {
  return String(Number(value.toFixed(value < 10 ? 2 : 1)));
}

export function convertCortisolInput(value: string, from: CortisolUnit, to: CortisolUnit): string {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || from === to) return value;
  return roundedInput(from === "µg/dL" ? parsed * CORTISOL_NMOL_PER_MICROGRAM_DL : parsed / CORTISOL_NMOL_PER_MICROGRAM_DL);
}

export function convertUfcInput(value: string, from: CortisolUnit, to: CortisolUnit): string {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || from === to) return value;
  return roundedInput(from === "µg/dL" ? parsed * UFC_NMOL_PER_MICROGRAM : parsed / UFC_NMOL_PER_MICROGRAM);
}

export function concentrationForDisplay(nmolPerL: number, unit: CortisolUnit): number {
  return unit === "µg/dL" ? nmolPerL / CORTISOL_NMOL_PER_MICROGRAM_DL : nmolPerL;
}

export function formatCortisolCutoff(nmolPerL: number, unit: CortisolUnit): string {
  const value = concentrationForDisplay(nmolPerL, unit);
  return `${Number(value.toFixed(unit === "µg/dL" ? 2 : 1))} ${unit}`;
}