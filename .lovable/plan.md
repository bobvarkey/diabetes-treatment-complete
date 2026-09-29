# Add Cortisol Unit Toggles to Adrenal Evaluation

## Goal
Let clinicians enter and review cortisol values in either µg/dL or nmol/L throughout the interactive adrenal evaluation.

## Changes
- Add an accessible µg/dL / nmol/L selector to the Cushing screening and adrenal-insufficiency evaluators.
- Apply the selected unit to DST cortisol, late-night salivary cortisol, morning cortisol, and ACTH-stimulation peak cortisol fields.
- Convert existing entered values when the unit changes, so the clinical value and result classification stay unchanged.
- Convert all displayed thresholds, assay cutoffs, result labels, and helper text to the selected unit.
- Apply the same unit choice to urinary free cortisol as µg/24 h or nmol/24 h, including its laboratory upper-limit input.
- Keep ACTH, electrolytes, glucose, blood pressure, and medication doses in their existing units.

## Verification
- Add focused tests for cortisol conversion and unit-aware cutoffs.
- Check the adrenal evaluation in desktop and mobile layouts and confirm classifications do not change when toggling units.
- Confirm the preview build remains healthy.

## Technical details
- Use 1 µg/dL cortisol = 27.59 nmol/L and round converted display values sensibly.
- Keep all decision comparisons normalized internally to nmol/L.
