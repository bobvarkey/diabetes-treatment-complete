# Add risk-stratified osteoporosis management

## Goal
Incorporate the uploaded Endocrine Society/AACE-style risk categories and matched treatment recommendations into the current fail-closed four-gate pathway, while retaining the app’s existing NOGG rules and safety gates.

## Implementation
1. **Expand risk inputs and classification**
   - Add optional numeric FRAX 10-year hip and major osteoporotic fracture probabilities.
   - Add explicit inputs for fracture within 12 months and fracture while receiving osteoporosis therapy, while reusing existing multiple-fracture, falls, glucocorticoid, DXA, and treatment data.
   - Add Low and Moderate categories only when the necessary negative findings and assessment data are explicitly complete; missing data remains Unclassified / incomplete, never assumed low.
   - Preserve existing rules that a confirmed hip or vertebral fragility fracture establishes at least High risk without requiring FRAX, and that FRAX is optional rather than a prerequisite.

2. **Apply uploaded category thresholds safely**
   - High: T-score ≤ −2.5, hip/vertebral fragility fracture, FRAX hip ≥3%, or major osteoporotic fracture ≥20%.
   - Very high: T-score < −3.0, fracture within 12 months, multiple fractures, fracture on therapy, high fall risk, FRAX hip >4.5%, major osteoporotic fracture >30%, plus the pathway’s existing stricter NOGG triggers.
   - Moderate: osteopenic T-score with FRAX below treatment thresholds and no high/very-high evidence.
   - Low: T-score > −1.0, or an explicitly completed low-risk osteopenia assessment, with FRAX below thresholds and no unresolved higher-tier evidence.

3. **Match treatment recommendations to risk**
   - Unclassified: universal bone-health measures and complete the missing assessment; do not choose medication from incomplete data.
   - Low: lifestyle/fall prevention and periodic reassessment without routine pharmacotherapy.
   - Moderate: individualized pharmacotherapy discussion, including appropriate oral bisphosphonate, raloxifene, or menopausal hormone therapy considerations.
   - High: oral/IV bisphosphonate first-line, denosumab alternative with a documented exit plan, and appropriate raloxifene considerations.
   - Very high: specialist-led anabolic or romosozumab first, followed promptly by an antiresorptive.
   - Keep renal, calcium/vitamin D, pregnancy, cardiovascular, malignancy, and drug-label safety gates authoritative over every option.

4. **Update results and report**
   - Show the assigned category, criteria met, category-specific management plan, dosing/review details, sequencing, and unresolved information in the result card.
   - Include all new inputs, rationale, and treatment recommendations in the copyable report.

5. **Verify**
   - Add focused Vitest cases for category thresholds, boundary values, incomplete-data behavior, fracture-without-FRAX classification, treatment matching, and existing safety branches.
   - Check the full pathway and copied report in the live preview on desktop and mobile, including that sex selection remains stable and the app does not collapse.
