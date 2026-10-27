import mgmtAlgoImg from "@/assets/osteoporosis-management-algorithm.png.asset.json";
import medTableImg from "@/assets/osteoporosis-medication-table.png.asset.json";
import { ImageViewerTrigger } from "@/components/ImageViewer";

export const OSTEO_MANAGEMENT_ALGO_ALT =
  "Management of Osteoporosis in Postmenopausal Women - flowchart. Top row: (1) Foundational Measures for all risk levels: calcium 1000-1200 mg/day preferably from food, vitamin D 800-1000 IU/day individualized, protein 1.0-1.2 g/kg/day, adequate fibre and bioactive foods, weight-bearing exercise plus balance, avoid smoking and limit alcohol, fall prevention and home safety, vision correction. (2) Comprehensive Risk Assessment: clinical risk factors (age, low BMI, previous fragility fracture, parental hip fracture, glucocorticoid use, smoking or alcohol, falls risk, secondary osteoporosis, comorbidities such as major GI illness, low BMD with other major risk factors, patient preference); bone mineral density (DXA of hip and spine, T-score, use FRAX with or without BMD); patient values and preferences using the OARS framework (open-ended questions, affirmations, reflective listening, summaries; discuss route, frequency, duration, cost and preferences). (3) A graph of 10-year major osteoporotic fracture probability by FRAX against age from 50 to 90, banded low, intermediate, high and very high risk. Below, all postmenopausal women start with lifestyle and nutritional optimization and a country-specific 10-year FRAX estimate, then split three ways: Low-Moderate Fracture Risk without a diagnosis of osteoporosis (low risk reassess in 2-4 years; moderate risk treat or monitor; on bisphosphonate therapy consider a drug holiday after 3-5 years oral or 3 years IV, reassess every 2-4 years, restart if bone loss occurs or risk rises, continue or switch to denosumab or an anabolic if high risk); High-Very High Fracture Risk with osteoporosis or high clinical risk (bisphosphonates: alendronate 10 mg daily or 70 mg weekly, risedronate 5 mg daily or 35 mg weekly or 150 mg monthly, ibandronate 150 mg monthly or 3 mg IV every 3 months, zoledronic acid 5 mg IV yearly; denosumab 60 mg subcutaneously every 6 months, do not stop without alternative antiresorptive therapy because of rebound vertebral fractures; teriparatide 20 micrograms or abaloparatide 80 micrograms subcutaneously daily up to 2 years then follow with an antiresorptive; calcium plus vitamin D as adjunct); if intolerant to or inappropriate for those therapies, under 60 years or within 10 years of menopause with low VTE risk use raloxifene 60 mg or bazedoxifene 20 mg daily when there are no vasomotor symptoms and low breast cancer risk, or menopausal hormone therapy when vasomotor symptoms are present (estrogen alone without a uterus, estrogen plus progestin with a uterus, or tibolone 2.5 mg daily); at 60 years and over consider in order a SERM, MHT or tibolone, calcitonin 200 IU nasal spray daily, then calcium plus vitamin D. Third pathway: Secondary Prevention in Older Adults when a new fracture occurs after at least 12 months of initial osteoporosis treatment - vertebral fracture recommend teriparatide, abaloparatide or romosozumab; hip fracture recommend romosozumab or teriparatide then an antiresorptive; non-vertebral fracture recommend teriparatide or denosumab; multiple (2 or more) fractures recommend teriparatide or romosozumab; high risk features recommend denosumab or romosozumab.";

export const OSTEO_MED_TABLE_ALT =
  "Medications for Osteoporosis: Doses, Route, Use and Key Points - table. Bisphosphonates: alendronate (Fosamax) 10 mg daily or 70 mg weekly oral, consider a drug holiday after 5 years in low risk, avoid if eGFR below 35 or significant upper GI disorders; risedronate (Actonel) 5 mg daily, 35 mg weekly or 150 mg monthly oral, drug holiday after 5 years, same renal and GI cautions; ibandronate (Boniva) 150 mg monthly or 3 mg every 3 months oral or IV, drug holiday after 5 years; zoledronic acid (Reclast) 5 mg IV yearly, drug holiday after 3 years in low risk, avoid if eGFR below 35. RANKL inhibitor: denosumab (Prolia) 60 mg subcutaneously every 6 months, continue long term, do not stop without alternative antiresorptive therapy because of rebound fracture risk, black box warning for severe hypocalcaemia in chronic kidney disease. Anabolic agents: teriparatide (Forteo) 20 micrograms subcutaneously daily up to 2 years then follow with an antiresorptive, contraindicated in hyperparathyroidism, prior radiotherapy, bone metastases and open epiphyses; abaloparatide (Tymlos) 80 micrograms subcutaneously daily up to 2 years with similar contraindications; romosozumab (Evenity) 210 mg subcutaneously monthly for 12 months then an antiresorptive, black box warning for myocardial infarction, stroke and cardiovascular death. SERMs: raloxifene (Evista) 60 mg daily oral, reduces vertebral fracture risk, avoid with a history of deep vein thrombosis or pulmonary embolism, postmenopausal women only. Tissue-selective estrogen complex: conjugated estrogens with bazedoxifene (Duavee) 0.45 mg/20 mg daily oral as an alternative in selected postmenopausal women, caution for endometrial cancer risk, cardiovascular disease and dementia. Menopausal hormone therapy: estrogen alone when no uterus, estrogen plus progestin when a uterus is present, various regimens oral or transdermal for symptom control and fracture prevention in selected women, with increased risk of venous thromboembolism, breast cancer, stroke and dementia; tibolone 2.5 mg daily oral as an alternative option. Calcitonin salmon 200 IU in one nostril daily alternating nostrils as a nasal spray, limited efficacy, reserve for short-term use or when others are not suitable. Bottom panels: Monitoring and Reassessment (reassess fracture risk every 2-4 years when low risk and every 1-3 years on therapy, repeat DXA based on risk and therapy typically every 1-3 years, monitor adherence, adverse effects and secondary causes); Lifestyle and Supportive Measures for all risk levels (calcium 1000-1200 mg/day preferably dietary, vitamin D 800-1000 IU/day individualized, protein 1.0-1.2 g/kg/day, weight-bearing and balance exercise at least twice weekly, adequate fibre and bioactive foods, avoid smoking and limit alcohol, fall prevention and home safety, maintain a healthy weight); Key Cautions (bisphosphonates and zoledronic acid avoid if eGFR below 35 or significant upper GI disorders; denosumab do not discontinue without sequential therapy; teriparatide and abaloparatide avoid in hyperparathyroidism, prior radiotherapy or bone metastases; romosozumab avoid in recent myocardial infarction, stroke or high cardiovascular risk; menopausal hormone therapy only in selected women given risk of venous thromboembolism, breast cancer, stroke and dementia).";

const FIGURE_CLASS =
  "overflow-hidden rounded-lg border border-border bg-white text-zinc-900 shadow-sm";
const CAPTION_CLASS =
  "space-y-2 border-t border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-800";
const IMG_CLASS = "w-full rounded-none bg-white";

/**
 * Management-of-osteoporosis pathway chart: foundational measures, risk
 * assessment, FRAX bands, then the low-moderate / high-very-high /
 * secondary-prevention branches with drug dosing.
 * Light card so the small printed text stays readable in dark mode.
 */
export function OsteoporosisManagementAlgorithmFigure() {
  return (
    <figure
      className={FIGURE_CLASS}
      data-teaching-figure="osteoporosis-management-algorithm"
    >
      <ImageViewerTrigger
        src={mgmtAlgoImg.url}
        alt={OSTEO_MANAGEMENT_ALGO_ALT}
        title="Management of osteoporosis in postmenopausal women"
      >
        <img
          src={mgmtAlgoImg.url}
          alt={OSTEO_MANAGEMENT_ALGO_ALT}
          data-title="Management of osteoporosis in postmenopausal women"
          className={IMG_CLASS}
          loading="lazy"
        />
      </ImageViewerTrigger>
      <figcaption className={CAPTION_CLASS}>
        <p className="font-semibold text-zinc-900">
          Management of osteoporosis in postmenopausal women
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Everyone</strong> gets foundational measures first: calcium 1000-1200 mg/day (prefer food),
            vitamin D 800-1000 IU/day, protein 1.0-1.2 g/kg/day, weight-bearing and balance exercise, smoking and
            alcohol review, fall prevention, home safety and vision correction.
          </li>
          <li>
            <strong>Risk assessment</strong> combines clinical risk factors, DXA of hip and spine with T-score and
            FRAX (with or without BMD), and the patient&apos;s own values using the OARS conversation framework -
            route, frequency, duration and cost all discussed.
          </li>
          <li>
            <strong>Low-moderate risk</strong> without an osteoporosis diagnosis: reassess every 2-4 years; on oral
            bisphosphonates consider a drug holiday after 3-5 years (3 years IV) and restart if bone loss or risk
            rises.
          </li>
          <li>
            <strong>High-very high risk</strong>: bisphosphonates, denosumab 60 mg subcutaneously every 6 months,
            or teriparatide/abaloparatide for up to 2 years followed by an antiresorptive. If those are intolerant
            or inappropriate, under 60 a SERM or menopausal hormone therapy is considered; at 60 and over the
            order is SERM, then MHT or tibolone, then calcitonin, then calcium plus vitamin D.
          </li>
          <li>
            <strong>New fracture after 12 months of treatment</strong> shifts to anabolic-first: vertebral -
            teriparatide, abaloparatide or romosozumab; hip - romosozumab or teriparatide then an antiresorptive;
            non-vertebral - teriparatide or denosumab; multiple fractures - teriparatide or romosozumab; high-risk
            features - denosumab or romosozumab.
          </li>
        </ul>
        <p>
          Teaching reference for postmenopausal women. Denosumab must never be stopped without a clinician-led
          sequential plan (rebound vertebral fractures), and anabolics always need antiresorptive consolidation.
          Dosing, eligibility and sequencing here are governed by this app&apos;s own treatment options, safety
          gates and local protocols, not by the chart.
        </p>
      </figcaption>
    </figure>
  );
}

/**
 * Medication quick-reference table: class, drug, dose, route, use and key
 * contraindications, plus monitoring, lifestyle and key-cautions panels.
 */
export function OsteoporosisMedicationTableFigure() {
  return (
    <figure
      className={FIGURE_CLASS}
      data-teaching-figure="osteoporosis-medication-table"
    >
      <ImageViewerTrigger
        src={medTableImg.url}
        alt={OSTEO_MED_TABLE_ALT}
        title="Medications for osteoporosis: doses, route, use and key points"
      >
        <img
          src={medTableImg.url}
          alt={OSTEO_MED_TABLE_ALT}
          data-title="Medications for osteoporosis: doses, route, use and key points"
          className={IMG_CLASS}
          loading="lazy"
        />
      </ImageViewerTrigger>
      <figcaption className={CAPTION_CLASS}>
        <p className="font-semibold text-zinc-900">
          Medications for osteoporosis: doses, route, use and key points
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Bisphosphonates</strong> - alendronate 10 mg daily or 70 mg weekly, risedronate 5 mg daily / 35
            mg weekly / 150 mg monthly, ibandronate 150 mg monthly or 3 mg IV every 3 months, zoledronic acid 5 mg
            IV yearly. Avoid below eGFR 35 and with significant upper GI disease; drug holiday after about 5 years
            oral, 3 years IV in low risk.
          </li>
          <li>
            <strong>Denosumab</strong> 60 mg subcutaneously every 6 months - continue long term and never stop
            without an alternative antiresorptive; severe hypocalcaemia risk in chronic kidney disease.
          </li>
          <li>
            <strong>Anabolics</strong> - teriparatide 20 micrograms and abaloparatide 80 micrograms daily subcutaneously
            up to 2 years, romosozumab 210 mg monthly subcutaneously for 12 months; all require follow-on
            antiresorptive therapy, and romosozumab carries a cardiovascular black-box warning.
          </li>
          <li>
            <strong>Other options</strong> - raloxifene 60 mg daily (avoid with prior VTE), conjugated
            estrogens/bazedoxifene 0.45/20 mg daily, menopausal hormone therapy or tibolone 2.5 mg daily in
            selected women, calcitonin 200 IU nasal spray daily where nothing else suits.
          </li>
          <li>
            <strong>Follow-up</strong> - reassess risk every 2-4 years when low risk and every 1-3 years on therapy,
            repeat DXA typically every 1-3 years, and keep checking adherence, adverse effects and secondary causes.
          </li>
        </ul>
        <p>
          Teaching reference only. The chart&apos;s own headings contain a small printing error
          (&quot;Monitoring and Reassement&quot;); the app&apos;s own dosing quickcards, safety gates and local
          protocols remain the source of truth for prescribing.
        </p>
      </figcaption>
    </figure>
  );
}
