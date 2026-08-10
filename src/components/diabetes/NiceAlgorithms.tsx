import { SectionCard, Callout } from "./shared";
import { useImageViewer } from "@/components/ImageViewer";
import { Maximize2 } from "lucide-react";
import step0 from "@/assets/nice2026-6863.jpeg.asset.json";
import step1 from "@/assets/nice2026-6864.jpeg.asset.json";
import steps234 from "@/assets/nice2026-6865.jpeg.asset.json";
import diseaseSpecific from "@/assets/nice2026-6866.jpeg.asset.json";
import masterFlow from "@/assets/nice2026-6867.jpeg.asset.json";

const CARDS: { url: string; title: string; subtitle: string; alt: string }[] = [
  {
    url: masterFlow.url,
    title: "Master flow — whole pathway on one page",
    subtitle: "Assess → category → start → HbA1c above target → DPP-4 → SPI",
    alt: "NICE 2026 diabetes master flow: assess patient, choose category, start metformin + SGLT2 inhibitor with exceptions (ASCVD add semaglutide, obesity or young onset GLP-1/tirzepatide early, frailty metformin alone, CKD depends on eGFR), then add DPP-4 inhibitor, then choose sulfonylurea, pioglitazone or insulin.",
  },
  {
    url: step0.url,
    title: "Step 0 — assess every patient first",
    subtitle: "ASCVD · heart failure · CKD (eGFR) · obesity · frailty · young onset <40",
    alt: "NICE 2026 step 0: before choosing drugs assess cardiovascular disease, heart failure, chronic kidney disease by eGFR, obesity and BMI, frailty, and young onset diabetes under 40 years.",
  },
  {
    url: step1.url,
    title: "Step 1 — choose one category",
    subtitle: "\u201cWhich box does my patient fit into?\u201d — most patients start with M + S",
    alt: "NICE 2026 step 1 table of first choice therapy by patient category: no comorbidity, obesity, CKD, heart failure all metformin plus SGLT2 inhibitor; ASCVD adds semaglutide; young under 40 adds GLP-1 or tirzepatide; frailty metformin alone initially.",
  },
  {
    url: steps234.url,
    title: "Steps 2–4 — metformin intolerance, DPP-4, then SPI",
    subtitle: "SGLT2i alone if no metformin · add DPP-4 · rescue with SPI",
    alt: "NICE 2026 steps 2 to 4: if metformin cannot be used give SGLT2 inhibitor alone except in frailty; if HbA1c still above target add a DPP-4 inhibitor; if DPP-4 cannot be used or is insufficient choose one of sulfonylurea, pioglitazone or insulin (SPI).",
  },
  {
    url: diseaseSpecific.url,
    title: "Disease-specific modifications",
    subtitle: "No comorbidity · obesity · CKD by eGFR band · HF · ASCVD · young onset · frailty",
    alt: "NICE 2026 disease-specific treatment ladders for no comorbidity, obesity, CKD split by eGFR above 30, 20 to 30 and under 20, heart failure (avoid pioglitazone), ASCVD, young-onset diabetes and frailty.",
  },
];

export default function NiceAlgorithms() {
  const { open } = useImageViewer();

  return (
    <div className="space-y-5">
      <SectionCard title="NICE 2026 — treating type 2 diabetes" subtitle="Stepwise visual algorithms · tap any sheet to zoom">
        <Callout tone="info" title="Memory trick">
          <b>&ldquo;Most patients start with MS&rdquo;</b> — <b>M</b>etformin + <b>S</b>GLT2 inhibitor. Only frailty is
          different (metformin alone initially). Next drug for almost every pathway is a DPP-4 inhibitor, then rescue
          with <b>SPI</b> — <b>S</b>ulfonylurea, <b>P</b>ioglitazone or <b>I</b>nsulin.
        </Callout>

        <div className="grid gap-4 sm:grid-cols-2">
          {CARDS.map((c) => (
            <figure key={c.title} className="overflow-hidden rounded-lg border border-border bg-card">
              <button
                type="button"
                onClick={() => open(c.url, c.title)}
                className="block w-full text-left transition hover:opacity-95"
                aria-label={`Open ${c.title} full size`}
              >
                <img src={c.url} alt={c.alt} className="h-auto w-full" loading="lazy" />
              </button>
              <figcaption className="border-t border-border bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{c.title}</span>
                  <Maximize2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.subtitle}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <Callout tone="warning" title="Always individualise">
          These sheets summarise NICE 2026 defaults. Confirm eGFR before SGLT2i (avoid initiation below eGFR 20),
          avoid pioglitazone in heart failure, and use SPI cautiously in frailty because of hypoglycaemia and falls.
          ADA-style organ-protection choices (see the Treatment tab) may override these defaults where CV, HF or renal
          outcome benefit is the priority.
        </Callout>
      </SectionCard>
    </div>
  );
}
