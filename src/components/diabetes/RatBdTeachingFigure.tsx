import ratBdTeachingImg from "@/assets/rat-bd-osteoporosis-teaching.jpg";
import { ImageViewerTrigger } from "@/components/ImageViewer";

export const RAT_BD_ALT =
  "Cartoon teaching figure: a giant rat labelled RAT stacks bricks onto a creaky leaning apartment building while a BD anti-demolition crew braces it with wooden props. RAT stands for the anabolic agents romosozumab, abaloparatide and teriparatide (bone-forming). BD stands for bisphosphonate and denosumab (antiresorptives that reduce bone resorption).";

/**
 * Teaching figure for very-high vs high osteoporosis pathways.
 * Light card so the cartoon and caption stay readable in dark mode.
 */
export default function RatBdTeachingFigure() {
  return (
    <figure
      className="overflow-hidden rounded-lg border border-border bg-white text-zinc-900 shadow-sm"
      data-teaching-figure="rat-bd"
    >
      <ImageViewerTrigger src={ratBdTeachingImg} alt={RAT_BD_ALT}>
        <img
          src={ratBdTeachingImg}
          alt={RAT_BD_ALT}
          className="w-full rounded-none bg-white"
          loading="lazy"
        />
      </ImageViewerTrigger>
      <figcaption className="space-y-2 border-t border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-800">
        <p className="font-semibold text-zinc-900">RAT vs BD — building vs bracing bone</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The cartoon shows a chaotic scene of a giant <strong>RAT</strong> (Romosozumab, Abaloparatide,
            Teriparatide) stacking bricks onto a creaky leaning apartment building,
          </li>
          <li>
            while the <strong>BD</strong> (Bisphosphonate, Denosumab) Anti-Demolition Team frantically braces
            the building with wooden props to keep it from collapsing.
          </li>
        </ul>
        <p>
          <strong>Clinical teaching:</strong> RAT = anabolic / bone-forming agents (build / add structure).
          BD = antiresorptives (stabilize / reduce demolition = bone resorption). Very-high risk considers
          RAT first, then an antiresorptive; high risk prefers BD if suitable.
        </p>
      </figcaption>
    </figure>
  );
}
