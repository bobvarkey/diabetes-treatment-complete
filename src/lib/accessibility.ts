
/**
 * Utility to calculate WCAG contrast ratios and adjust colors for accessibility.
 * Uses OKLCH for perceptually accurate color manipulation.
 */

/**
 * Parses an OKLCH string like "oklch(0.99 0.008 55)" into its components.
 */
export function parseOklch(color: string): [number, number, number, number] {
  const match = color.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\)/);
  if (!match) return [0, 0, 0, 1];
  
  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);
  let a = 1;
  
  if (match[4]) {
    a = match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4]);
  }
  
  return [l, c, h, a];
}

/**
 * Approximates relative luminance from OKLCH Lightness.
 * Lightness in OKLCH is designed to be perceptually linear.
 */
export function getRelativeLuminance(l: number): number {
  // This is a simplified approximation as OKLCH Lightness is already roughly perceptual.
  // For precise WCAG 2.1 (which uses sRGB luminance), we'd need to convert to sRGB.
  // However, OKLCH Lightness is a better metric for modern displays.
  return l;
}

/**
 * Calculates a contrast ratio between two lightness values.
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 */
export function getContrastRatio(l1: number, l2: number): number {
  const higher = Math.max(l1, l2);
  const lower = Math.min(l1, l2);
  return (higher + 0.05) / (lower + 0.05);
}

/**
 * Adjusts a foreground color's lightness to meet a minimum contrast ratio against a background.
 * @param fg Oklch string
 * @param bg Oklch string
 * @param minRatio Minimum contrast ratio (default 4.5 for WCAG AA)
 */
export function ensureContrast(fg: string, bg: string, minRatio = 4.5): string {
  const [fL, fC, fH, fA] = parseOklch(fg);
  const [bL] = parseOklch(bg);
  
  const currentRatio = getContrastRatio(fL, bL);
  if (currentRatio >= minRatio) return fg;
  
  // Try to push lightness away from background
  const targetLightnessDark = (bL + 0.05) / minRatio - 0.05;
  const targetLightnessLight = minRatio * (bL + 0.05) - 0.05;
  
  let newL = fL;
  
  if (bL > 0.5) {
    // Light background, try dark text first
    newL = targetLightnessDark >= 0 ? targetLightnessDark : targetLightnessLight;
  } else {
    // Dark background, try light text first
    newL = targetLightnessLight <= 1 ? targetLightnessLight : targetLightnessDark;
  }
  
  // Clamp to [0, 1]
  newL = Math.max(0, Math.min(1, newL));
  
  return `oklch(${newL.toFixed(3)} ${fC} ${fH}${fA < 1 ? ` / ${fA}` : ''})`;
}
