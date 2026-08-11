import { useEffect, useState } from "react";

/**
 * Utility to calculate WCAG contrast ratios and adjust colors for accessibility.
 * Uses OKLCH for perceptually accurate color manipulation.
 */

/**
 * Parses an OKLCH string like "oklch(0.99 0.008 55)" into its components.
 */
export function parseOklch(color: string): [number, number, number, number] {
  if (!color) return [0, 0, 0, 1];
  // Support both oklch(L C H) and oklch(L C H / A)
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

/**
 * Hook to get current theme colors from computed CSS variables.
 * This ensures we handle dark mode transitions and system settings.
 */
export function useThemeColors() {
  const [colors, setColors] = useState({
    background: "oklch(0.99 0.008 55)",
    foreground: "oklch(0.18 0.03 300)",
    mutedForeground: "oklch(0.45 0.03 300)",
    card: "oklch(1 0.003 55)",
    cardForeground: "oklch(0.18 0.03 300)",
    primary: "oklch(0.62 0.22 15)",
    primaryForeground: "oklch(0.99 0.01 55)",
    border: "oklch(0.90 0.015 30)",
  });


  useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement);
      
      const getVal = (prop: string) => {
        const val = style.getPropertyValue(prop).trim();
        return val || "oklch(0.5 0 0)";
      };

      setColors({
        background: getVal('--background'),
        foreground: getVal('--foreground'),
        mutedForeground: getVal('--muted-foreground'),
        card: getVal('--card'),
        cardForeground: getVal('--card-foreground'),
        primary: getVal('--primary'),
        primaryForeground: getVal('--primary-foreground'),
        border: getVal('--border'),
      });

    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

  return colors;
}
