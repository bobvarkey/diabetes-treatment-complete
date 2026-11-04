// Pure geometry + hierarchy helpers for the "Explore all tools" sunburst.
// No clinical logic here: the hierarchy is derived from the app's SECTIONS nav config.

export type SunburstLeafInput = {
  id: string;
  label: string;
  group: string;
  blurb?: string;
  keywords?: string;
};

export type SunburstLeaf = {
  id: string;
  label: string;
  blurb?: string;
  start: number;
  end: number; // radians, 0 = 12 o'clock, clockwise
  color: string;
  weight: number; // 0..1 → extra outward length (outlier bars)
};
export type SunburstGroup = {
  name: string;
  start: number;
  end: number;
  color: string;
  children: SunburstLeaf[];
};

/** Group leaves by `group` in `order`, allocate equal angle per leaf, assign rainbow hues. */
export function buildSunburst(
  items: SunburstLeafInput[],
  order: string[],
  gap = 0.004,
): SunburstGroup[] {
  const groups = order
    .map((name) => ({ name, items: items.filter((i) => i.group === name) }))
    .filter((g) => g.items.length > 0);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) return [];
  const per = (Math.PI * 2) / total;
  // Outlier weight: keyword richness relative to the max, only the top ~15% stick out.
  const kw = items.map((i) => (i.keywords ?? "").split(/\s+/).filter(Boolean).length);
  const sorted = [...kw].sort((a, b) => b - a);
  const cutoff = sorted[Math.max(0, Math.ceil(sorted.length * 0.15) - 1)] ?? Infinity;
  const max = sorted[0] || 1;
  let a = 0;
  return groups.map((g, gi) => {
    const hue = Math.round((gi / groups.length) * 360 + 25) % 360;
    const start = a;
    const children = g.items.map((it, ci) => {
      const s = a;
      a += per;
      const k = (it.keywords ?? "").split(/\s+/).filter(Boolean).length;
      const light = 68 + (ci % 4) * 4;
      return {
        id: it.id,
        label: it.label,
        blurb: it.blurb,
        start: s + gap,
        end: a - gap,
        color: `hsl(${hue} 85% ${light}%)`,
        weight: k >= cutoff && k > 0 ? k / max : 0,
      };
    });
    return {
      name: g.name,
      start: start + gap,
      end: a - gap,
      color: `hsl(${hue} 85% 55%)`,
      children,
    };
  });
}

const pt = (r: number, a: number) => [r * Math.sin(a), -r * Math.cos(a)] as const;

/** SVG path for an annular sector centred on (0,0). */
export function arcPath(r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(r1, a0);
  const [x1, y1] = pt(r1, a1);
  const [x2, y2] = pt(r0, a1);
  const [x3, y3] = pt(r0, a0);
  const f = (n: number) => n.toFixed(2);
  return `M${f(x0)},${f(y0)}A${r1},${r1} 0 ${large} 1 ${f(x1)},${f(y1)}L${f(x2)},${f(y2)}A${r0},${r0} 0 ${large} 0 ${f(x3)},${f(y3)}Z`;
}
