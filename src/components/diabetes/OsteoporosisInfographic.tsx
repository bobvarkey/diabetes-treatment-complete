import drugClassesImg from "@/assets/osteoporosis-drug-classes.jpeg.asset.json";
import { ImageViewerTrigger } from "@/components/ImageViewer";

export const OSTEO_DRUG_CLASSES_ALT =
  "Teaching chart: Modern pharmacological management of osteoporosis — from monotherapy to sequential and combination approaches in postmenopausal women. Three columns: Antiresorptive Agents (mechanism: inhibition of osteoclast-mediated bone resorption) covering bisphosphonates (alendronate, zoledronic acid), denosumab (anti-RANKL monoclonal antibody) and SERMs (raloxifene); Bone Anabolic Agents (mechanism: direct stimulation of active bone formation through intermittent PTH1 receptor activation) covering parathyroid hormone peptides (teriparatide PTH 1-34, abaloparatide PTHrP analog); and Dual-Action Agents (mechanism: sclerostin inhibition giving uncoupled remodeling through the Wnt/beta-catenin pathway) covering the sclerostin monoclonal antibody romosozumab. Each column lists therapeutic advantages against critical risks and drawbacks.";

/**
 * Drug-class comparison chart (antiresorptive / anabolic / dual-action).
 * Light card so the small printed text stays readable in dark mode.
 */
export default function OsteoporosisInfographic() {
  return (
    <figure
      className="overflow-hidden rounded-lg border border-border bg-white text-zinc-900 shadow-sm"
      data-teaching-figure="osteoporosis-drug-classes"
    >
      <ImageViewerTrigger src={drugClassesImg.url} alt={OSTEO_DRUG_CLASSES_ALT}>
        <img
          src={drugClassesImg.url}
          alt={OSTEO_DRUG_CLASSES_ALT}
          className="w-full rounded-none bg-white"
          loading="lazy"
        />
      </ImageViewerTrigger>
      <figcaption className="space-y-2 border-t border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-800">
        <p className="font-semibold text-zinc-900">
          Modern pharmacological management of osteoporosis: from monotherapy to sequential and combination
          approaches
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Antiresorptive agents</strong> — bisphosphonates (alendronate, zoledronic acid), denosumab
            (anti-RANKL) and SERMs (raloxifene). They suppress osteoclast-mediated resorption; the trade-off is
            plateaus in bone density, oral gut intolerance, and the rare jaw osteonecrosis and atypical femoral
            fracture risks.
          </li>
          <li>
            <strong>Bone anabolic agents</strong> — teriparatide (PTH 1-34) and abaloparatide (PTHrP analog) build
            new bone through intermittent PTH1 receptor activation; the trade-off is daily self-injection and a
            lifetime limit of roughly 18-24 months.
          </li>
          <li>
            <strong>Dual-action agents</strong> — romosozumab neutralises sclerostin, so formation rises while
            resorption falls; the trade-off is a 12-month limit, a contraindication after recent myocardial
            infarction or stroke, and mandatory antiresorptive consolidation to hold the bone gained.
          </li>
        </ul>
        <p>
          Teaching reference only. Some of the chart's printed wording is imperfect; dosing, eligibility and
          sequencing are governed by this app's own treatment options, safety gates and local protocols, not by the
          chart.
        </p>
      </figcaption>
    </figure>
  );
}
