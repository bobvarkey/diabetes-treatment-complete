import { useMemo, useState } from "react";
import { arcPath, buildSunburst, type SunburstLeafInput } from "@/lib/sunburst";

type Props = {
  items: SunburstLeafInput[];
  groupOrder: string[];
  onNavigate: (id: string) => void;
};

const R_CENTER = 62,
  R_INNER = 112,
  R_OUTER = 150,
  OUTLIER = 46;

export function ExploreToolsSunburst({ items, groupOrder, onNavigate }: Props) {
  const groups = useMemo(() => buildSunburst(items, groupOrder), [items, groupOrder]);
  const pages = groups.reduce((n, g) => n + g.children.length, 0);
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const show = (label: string) => (e: React.MouseEvent | React.FocusEvent) => {
    const box = (
      e.currentTarget as SVGElement
    ).ownerSVGElement?.parentElement?.getBoundingClientRect();
    const src = "clientX" in e ? e : (e.currentTarget as SVGElement).getBoundingClientRect();
    const cx = "clientX" in src ? src.clientX : (src as DOMRect).x + (src as DOMRect).width / 2;
    const cy = "clientY" in src ? src.clientY : (src as DOMRect).y;
    if (box) setHover({ label, x: cx - box.left, y: cy - box.top });
  };
  const keyNav = (id: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(id);
    }
  };

  return (
    <section
      aria-labelledby="explore-tools-heading"
      className="rounded-3xl border border-white/10 bg-[#0b0b0d] p-4 text-white shadow-sm sm:p-6"
    >
      <h2 id="explore-tools-heading" className="font-display text-base font-semibold sm:text-lg">
        Explore all tools
      </h2>

      <div className="relative mx-auto mt-2 w-full max-w-[460px]">
        <svg
          viewBox="-205 -205 410 410"
          className="h-auto w-full"
          role="img"
          aria-label={`Clinical tools map: ${pages} pages in ${groups.length} sections`}
          onMouseLeave={() => setHover(null)}
        >
          {groups.map((g) => (
            <g key={g.name}>
              <path
                d={arcPath(R_CENTER + 4, R_INNER - 3, g.start, g.end)}
                fill={g.color}
                stroke="#0b0b0d"
                strokeWidth={1.5}
                role="button"
                tabIndex={0}
                aria-label={`${g.name} section, ${g.children.length} pages`}
                className="cursor-pointer outline-none transition-opacity hover:opacity-85 focus-visible:opacity-70"
                onClick={() => g.children[0] && onNavigate(g.children[0].id)}
                onKeyDown={g.children[0] ? keyNav(g.children[0].id) : undefined}
                onMouseMove={show(`${g.name} · ${g.children.length}`)}
                onFocus={show(g.name)}
                onBlur={() => setHover(null)}
              />
              {g.children.map((c) => (
                <path
                  key={c.id}
                  d={arcPath(R_INNER, R_OUTER + c.weight * OUTLIER, c.start, c.end)}
                  fill={c.color}
                  stroke="#0b0b0d"
                  strokeWidth={1.5}
                  role="link"
                  tabIndex={0}
                  aria-label={`${c.label} (${g.name})`}
                  className="cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:opacity-60"
                  onClick={() => onNavigate(c.id)}
                  onKeyDown={keyNav(c.id)}
                  onMouseMove={show(c.label)}
                  onFocus={show(c.label)}
                  onBlur={() => setHover(null)}
                />
              ))}
            </g>
          ))}
          <circle r={R_CENTER} fill="#111114" stroke="#2a2a30" strokeWidth={2} />
          <text y={-18} textAnchor="middle" fontSize={11} fill="#c9c9d1">
            Clinical Tools
          </text>
          <text y={10} textAnchor="middle" fontSize={26} fontWeight={700} fill="#fff">
            {pages}
          </text>
          <text y={30} textAnchor="middle" fontSize={9.5} fill="#a1a1aa">
            pages · {groups.length} sections
          </text>
        </svg>
        {hover && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-md bg-white px-2 py-1 text-xs font-medium text-black shadow"
            style={{ left: hover.x, top: hover.y }}
          >
            {hover.label}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setListOpen((v) => !v)}
        aria-expanded={listOpen}
        aria-controls="explore-tools-list"
        className="mt-2 flex items-center gap-1.5 text-sm text-white/90 hover:text-white"
      >
        <span
          aria-hidden
          className={
            listOpen
              ? "inline-block rotate-90 transition-transform"
              : "inline-block transition-transform"
          }
        >
          ▶
        </span>
        List view
      </button>
      {listOpen && (
        <div id="explore-tools-list" className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.name}>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: g.color }}
                />
                {g.name}
              </h3>
              <ul className="mt-1 space-y-0.5 pl-4.5">
                {g.children.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(c.id);
                      }}
                      className="text-sm text-white/80 underline-offset-2 hover:text-white hover:underline"
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
