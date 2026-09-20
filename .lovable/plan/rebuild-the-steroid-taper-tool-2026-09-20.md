# Rebuild the Steroid Taper Tool

## Goal
Replace the current basic calculator with a parameter-driven adult systemic glucocorticoid withdrawal tool that implements the full clinical framework and produces a complete notes/EHR-ready report.

## What will change

### 1. Structured intake and safety gate
- Capture indication, systemic agent, current dose, treatment duration, target, taper pace, and relevant clinical context.
- Require confirmation that the underlying disease is controlled and the current glucocorticoid dose is no longer required before displaying a taper schedule.
- Identify short exposure under 3–4 weeks, repeated/recent courses, long-term exposure, long-acting agents, prior failed tapers, frailty/pregnancy/comorbidity, and current symptoms.
- Keep excluded scenarios and suspected adrenal crisis outside automatic taper generation, with clear escalation guidance.

### 2. Guideline-aligned schedule engine
- Convert supported agents to prednisone/prednisolone-equivalent doses.
- Generate phase-based example schedules: relatively rapid reductions at high doses, slower reductions from 10 to 5 mg/day, and individualized reductions near the 4–6 mg/day physiologic range.
- Allow the chosen pace and target to modify intervals without presenting the result as an automatic prescription.
- For courses under 3–4 weeks, explain that an HPA-protection taper is usually unnecessary while preserving disease-relapse caveats.
- Prompt consideration of conversion from dexamethasone or betamethasone to a shorter-acting agent before the final taper and biochemical assessment.

### 3. Clinical response branches
- Separate likely disease flare, glucocorticoid withdrawal syndrome, and possible adrenal insufficiency using selectable symptoms and contextual guidance.
- Hold or revise the pathway when disease control is lost.
- Flag high-risk scenarios for endocrine/specialist review, including persistent symptoms near physiologic dose, complex conversion, long-term high-dose exposure, recurrent failed tapers, pregnancy/frailty/comorbidity, and need for dynamic testing.

### 4. HPA-axis assessment and emergency safety
- Show morning cortisol testing only near physiologic dose when discontinuation is clinically possible.
- Retain the latest requested interpretation: below 3 µg/dL suggests adrenal insufficiency, above 15 µg/dL makes it unlikely, and 3–15 µg/dL is indeterminate with ACTH stimulation considered; show nmol/L equivalents and local assay caveats.
- Include agent-specific withholding cautions rather than a universal withholding rule.
- Include sick-day advice, steroid-card/medical-alert prompts, inability-to-take-oral-medication guidance, and adrenal-crisis red flags with urgent treatment language.

### 5. Full report and exports
- Build a structured report containing inputs, eligibility decision, equivalent dose, generated schedule, selected symptoms, HPA interpretation, safety advice, escalation flags, and documentation checklist.
- Add the osteoporosis-style **Copy full report** control with clipboard fallback and a temporary “paste into notes / EHR” confirmation.
- Keep plain-text download and print/PDF actions synchronized to the same complete report so all exports contain identical clinical content.

### 6. Verification
- Extract the schedule and classification rules into testable logic.
- Add Vitest coverage for short-course stopping, disease-control gating, each dose band, pace modifiers, long-acting-agent prompts, cortisol boundaries, flare/withdrawal/adrenal branches, and escalation flags.
- Verify the live tool at mobile and desktop sizes, including report copying and no overlapping controls.

## Technical details
- Keep the work within the existing Steroid app and its current design system.
- Use accessible design-system inputs, checkboxes, buttons, alerts, and collapsible clinical sections.
- Preserve educational/non-prescriptive wording and cite the 2024 ESE/Endocrine Society joint guideline in the tool.
