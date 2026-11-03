<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Endocrine Rx

Bedside clinical reference: interactive calculators and algorithms for diabetes, obesity, bone and endocrine care. TanStack Start + React + Tailwind v4 + shadcn/ui, synced with Lovable.

## Structure
- `src/routes/index.tsx` — the app shell: sidebar nav, header, and `SECTIONS` (one entry per tool). Tools are lazy-loaded.
- `src/components/diabetes/` — one `*App.tsx` per tool, plus pure logic modules (`*Logic.ts`) with colocated tests.
- `src/components/diabetes/shared.tsx` — `SectionCard`, `Callout`, `Stat`, `KeyRow`, `ExportBar`, `CollapseAllProvider`.
- `src/components/InfoTip.tsx` — the one way to show an explanation (hover, focus, tap).
- `src/components/osteo/`, `src/lib/osteo/` — osteoporosis four-gate engine (fail-closed) and its controls.
- `src/components/ui/` — shadcn primitives; do not edit casually.

## Add a tool
1. Create `src/components/diabetes/FooApp.tsx`; keep clinical math in a pure `fooLogic.ts` with a `*.test.ts`.
2. In `src/routes/index.tsx`: add a `lazy()` import, a `SectionId`, a `SECTIONS` entry (`label`, `blurb` — shown as tooltip, `group`, `keywords` for search), and a render line.

## Commands
`bun install` · `bun run dev` · `bun run build` · `bun run test` · `bun run lint` · `bun run knip` · `npx tsc --noEmit`

## Design rules
- Simple purpose, simple layout. No taglines, hero subtitles, helper paragraphs, secondary labels or decorative badges.
- Explanations go in `InfoTip` (or `SectionCard subtitle` / osteo `Field hint` / `Gate purpose`, which render as InfoTip). Never as on-screen helper text.
- If a screen needs helper text to make sense, fix the layout: clear headings, grouping, units as input suffixes, sensible defaults.
- Always keep on screen: units, normal ranges, cutoffs, doses, results/interpretation, citations, safety warnings and disclaimers.
- Never change clinical logic or numbers as part of UI work. Copied-result text formats are a contract.

## Clinical notes
- Adrenal cortisol decisions normalize internally to nmol/L; UI may display and accept either nmol/L or µg/dL.
- The Osteoporosis screen uses the fail-closed four-gate engine in `src/lib/osteo`; legacy clinical modules remain as supporting sections so specialist protocols and detailed intake data are preserved.
- Embed uploaded reference charts as zoomable figures: `ImageViewerTrigger` with a full `alt` description plus a short `title` (mirrored as `data-title` on the `img`) so the viewer toolbar stays readable, and a light card so small print stays legible in dark mode.
