# Replace the Osteoporosis app with the four-gate pathway

## Goal
Use the uploaded OsteoCare four-gate workflow as the complete Osteoporosis screen while preserving the current app’s clinical content, entered session data, specialist guidance, images, calculators, protocols, and copy/export tools.

## Implementation
1. **Bring in the new pathway safely**
   - Add the uploaded `OsteoState`, validation, fail-closed three-valued risk logic, medication safety gates, CrCl rules, stale-report token, and four-gate controls as isolated Osteoporosis modules.
   - Adapt the visual treatment to the existing Endocrine Rx design system and reusable buttons; do not overwrite the site shell, navigation, global theme, or unrelated sections.

2. **Preserve and map existing clinical data**
   - Extend the new pathway state to retain the current detailed fracture history, site-specific DXA values, FRAX metadata/probabilities, secondary-cause qualifiers, CKD qualifier, Clinical Frailty Scale, falls history, treatment dates/duration, L1 HU, red flags, and manually confirmed VHR criteria.
   - Migrate the existing session-stored Osteoporosis intake into the new state where fields correspond, without deleting the old stored record.
   - Keep “unknown” distinct from “no”; do not infer negatives or invent FRAX multipliers.

3. **Merge the current clinical tools into the new whole-app layout**
   - Use the uploaded gates and result as the primary screen.
   - Retain the current secondary-causes checklist and qualifiers in the clinical-risk gate.
   - Retain the current DEXA scanner, FRAX navigation, GIOP guidance, fracture treatment/prevention plans, denosumab transition, teriparatide sequencing, zoledronate infusion protocol, dosing quickcards, teaching images, algorithm reference, sources, and safety notes in organized collapsible sections below the pathway.

4. **Unify results and export**
   - Keep the uploaded risk certainty, lower-bound result, contradictions, missing information, immediate actions, safety alerts, and medication eligibility.
   - Include preserved detailed treatment, switching, monitoring, and follow-up content in the copyable report.
   - Preserve copy, download, and print behavior, and ensure an input change marks an older copied report stale.

5. **Verify**
   - Add focused Vitest coverage for migration mapping, fail-closed risk branches, medication/CrCl gates, secondary causes, and report output.
   - Run the relevant test suite and type check.
   - Exercise the central workflow in the live preview on desktop and mobile, including session preservation and report copying.
