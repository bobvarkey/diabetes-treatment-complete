import { Activity, Footprints, ShieldCheck } from "lucide-react";
import { ImageViewerTrigger } from "@/components/ImageViewer";
import wagnerAsset from "@/assets/wagner-ulcer-classification.png.asset.json";
import wifiAsset from "@/assets/wifi-classification.png.asset.json";
import { Callout, KeyRow, SectionCard } from "./shared";
import {
  iwgdfRiskCategories,
  iwgdfRiskInputs,
  padAssessment,
  wagnerGrades,
} from "./footUlcerGuidance";

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
      subtitle="Categorical classification after assessment for LOPS, PAD, deformity, and prior foot events — assign the highest qualifying category"
      icon={<ShieldCheck className="h-5 w-5" />}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {iwgdfRiskInputs.map((item) => (
          <span
            key={item.id}
            className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs"
            title={item.detail}
          >
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground"> · yes / no / unknown</span>
          </span>
        ))}
      </div>

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

      <div className="mt-4">
        <Callout tone="info" title="LOPS assessment">
          Assess protective sensation with a 10-g monofilament plus at least one additional neurologic test, such as vibration perception, pinprick, temperature, or ankle reflexes.
        </Callout>
      </div>

      <div
        id={`${idPrefix}pad-assessment`}
        className="mt-4 space-y-4 rounded-md border border-border bg-muted/20 p-4"
      >
        <div>
          <h4 className="font-semibold">PAD assessment</h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {padAssessment.sources.join(" · ")}
          </p>
        </div>

        <ul className="list-disc space-y-1 pl-5 text-sm">
          {padAssessment.initialAssessment.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>

        <div className="rounded-md border border-primary/25 bg-background/60 p-3">
          <h5 className="text-sm font-semibold">{padAssessment.toePressure.title}</h5>
          <p className="mt-2 text-sm leading-relaxed">{padAssessment.toePressure.rationale}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-semibold">Zone</th>
                  <th className="py-2 pr-4 font-semibold">Toe pressure</th>
                  <th className="py-2 font-semibold">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {padAssessment.toePressure.zones.map((row) => (
                  <tr key={row.label} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-4 font-medium whitespace-nowrap">{row.label}</td>
                    <td className="py-2 pr-4 font-mono whitespace-nowrap">{row.criterion}</td>
                    <td className="py-2 text-muted-foreground">{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h5 className="mb-2 text-sm font-semibold">Resting ABI (ACC/AHA)</h5>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-semibold">Criterion</th>
                  <th className="py-2 font-semibold">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {padAssessment.restingAbi.map((row) => (
                  <tr key={row.criterion} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-4 font-medium whitespace-nowrap">{row.criterion}</td>
                    <td className="py-2 text-muted-foreground">{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-md border border-border bg-background/60 p-3">
            <h5 className="text-sm font-semibold">TBI</h5>
            <KeyRow k="ACC/AHA abnormal" v={padAssessment.tbi.accAhaAbnormal} />
            <KeyRow k="IWGDF abnormal" v={padAssessment.tbi.iwgdfAbnormal} />
            <p className="text-xs leading-relaxed text-muted-foreground">{padAssessment.tbi.interpretation}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{padAssessment.tbi.boundaryNote}</p>
          </div>
          <div className="space-y-2 rounded-md border border-border bg-background/60 p-3">
            <h5 className="text-sm font-semibold">Pedal Doppler</h5>
            <p className="text-xs text-muted-foreground">Abnormal findings that suggest PAD:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {padAssessment.pedalDopplerAbnormal.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-md border border-border bg-background/60 p-3">
          <h5 className="text-sm font-semibold">PAD less likely (IWGDF)</h5>
          <p className="mt-1 text-xs text-muted-foreground">When all of the following are present:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {padAssessment.padLessLikely.findings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {padAssessment.padLessLikely.limitation}
          </p>
        </div>

        <div className="space-y-2">
          <h5 className="text-sm font-semibold">Additional testing</h5>
          {padAssessment.additionalTesting.map((item) => (
            <KeyRow key={item.label} k={item.label} v={item.detail} />
          ))}
        </div>

        <Callout tone="warning" title="Classification safeguards">
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
            {padAssessment.safeguards.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Callout>
      </div>

      <div className="mt-4 space-y-3">
        <Callout tone="warning" title="Unknown inputs">
          Do not finalize an IWGDF category if an unknown input (especially LOPS or PAD) could change the classification. Record unresolved PAD as unknown, not absent.
        </Callout>

        <Callout tone="danger" title="Active disease is not routine screening">
          An active ulcer, infection, ischemic rest pain, gangrene, Charcot changes, or a hot swollen foot needs prompt assessment and treatment rather than waiting for the next scheduled screening visit. Screening intervals are based on expert opinion.
        </Callout>
      </div>
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
