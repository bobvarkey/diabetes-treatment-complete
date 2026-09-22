import { Activity, Footprints, ShieldCheck } from "lucide-react";
import { ImageViewerTrigger } from "@/components/ImageViewer";
import wagnerAsset from "@/assets/wagner-ulcer-classification.png.asset.json";
import wifiAsset from "@/assets/wifi-classification.png.asset.json";
import { Callout, SectionCard } from "./shared";
import { iwgdfRiskCategories, wagnerGrades } from "./footUlcerGuidance";

const wagnerUlcerImg = wagnerAsset.url;
const wifiClassificationImg = wifiAsset.url;

function ClinicalFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="mt-4 overflow-hidden rounded-md border border-border bg-card">
      <ImageViewerTrigger src={src} alt={alt}>
        <img src={src} alt={alt} className="mx-auto h-auto w-full cursor-zoom-in" loading="eager" />
      </ImageViewerTrigger>
      <figcaption className="border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

export function WagnerUlcerGrading({ idPrefix = "" }: { idPrefix?: string }) {
  return (
    <SectionCard
      id={`${idPrefix}wagner-ulcer-grading`}
      title="Wagner diabetic foot ulcer grading"
      subtitle="Depth, infection, and gangrene severity from grade 0 to grade 5"
      icon={<Footprints className="h-5 w-5" />}
    >
      <div className="grid gap-2 md:grid-cols-2">
        {wagnerGrades.map((item) => (
          <div key={item.grade} className="grid grid-cols-[3rem_1fr] gap-3 rounded-md border border-border p-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 font-mono text-lg font-bold text-primary"
              aria-label={`Grade ${item.grade}`}
            >
              {item.grade}
            </div>
            <div>
              <div className="text-sm font-semibold">{item.finding}</div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <ClinicalFigure
        src={wagnerUlcerImg}
        alt="Wagner ulcer classification system for diabetic foot ulcers, grades 0 through 5, from a pre-ulcerative area to global foot gangrene"
        caption="Wagner classification visual reference. Tap or click the image to zoom."
      />

      <Callout tone="warning" title="Urgent escalation">
        Deep infection, suspected osteomyelitis, ischemia, spreading cellulitis, systemic illness, or any gangrene requires urgent multidisciplinary diabetic-foot assessment. Wagner grade alone does not quantify ischemia or infection severity.
      </Callout>
    </SectionCard>
  );
}

export function WifiClassification({ idPrefix = "" }: { idPrefix?: string }) {
  return (
    <SectionCard
      id={`${idPrefix}wifi-classification`}
      title="WIfI limb-threat classification"
      subtitle="Grade wound, ischemia, and foot infection separately from 0 to 3"
      icon={<Activity className="h-5 w-5" />}
      tone="info"
    >
      <ClinicalFigure
        src={wifiClassificationImg}
        alt="WIfI classification of wound, ischemia, and foot infection, each graded from 0 to 3"
        caption="WIfI combines wound, ischemia, and foot-infection grades to support limb-threat assessment. Tap or click to zoom."
      />
      <Callout tone="info" title="Use alongside clinical assessment">
        Record all three components rather than reporting a single isolated grade. ABI may be falsely elevated with medial arterial calcification; toe pressure or TcPO₂ can provide additional perfusion information.
      </Callout>
    </SectionCard>
  );
}

export function IwgdfRiskScreening({ idPrefix = "" }: { idPrefix?: string }) {
  return (
    <SectionCard
      id={`${idPrefix}iwgdf-risk-screening`}
      title="IWGDF risk categories & screening frequency"
      subtitle="Risk-based surveillance after assessment for LOPS, PAD, deformity, and prior foot events"
      icon={<ShieldCheck className="h-5 w-5" />}
    >
      <div className="space-y-3">
        {iwgdfRiskCategories.map((item) => (
          <div
            key={item.risk}
            className={`grid gap-3 rounded-md border p-4 sm:grid-cols-[8.5rem_1fr_11rem] sm:items-center ${item.tone}`}
          >
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Risk {item.risk}</div>
              <div className="font-semibold">{item.label}</div>
            </div>
            <p className="text-sm leading-relaxed">{item.criteria}</p>
            <div className="sm:text-right">
              <div className="text-xs font-medium uppercase text-muted-foreground">Screening frequency</div>
              <div className="font-semibold">{item.frequency}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Callout tone="info" title="LOPS assessment">
          Assess protective sensation with a 10-g monofilament plus at least one additional neurologic test, such as vibration perception, pinprick, temperature, or ankle reflexes.
        </Callout>
        <Callout tone="warning" title="PAD assessment">
          Check pedal pulses and symptoms. If PAD is suspected, obtain vascular testing and interpret ABI cautiously when arterial calcification is likely.
        </Callout>
      </div>

      <Callout tone="danger" title="Active disease is not routine screening">
        An active ulcer, infection, ischemic rest pain, gangrene, Charcot changes, or a hot swollen foot needs prompt assessment and treatment rather than waiting for the next scheduled screening visit.
      </Callout>
    </SectionCard>
  );
}

/** Ulcer grading plus the Wagner and WIfI figures. */
export function UlcerGradingFigures({ idPrefix = "" }: { idPrefix?: string }) {
  return (
    <>
      <WagnerUlcerGrading idPrefix={idPrefix} />
      <WifiClassification idPrefix={idPrefix} />
    </>
  );
}
