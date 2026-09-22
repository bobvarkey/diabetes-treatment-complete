# Add diabetic foot ulcer and neuropathy guidance

## What will change
- Expand **Diabetic Complications** with two new tabs: **Foot Ulcer** and **Neuropathy**.
- Add a clear Wagner grade 0–5 ulcer-grading reference, paired with the uploaded Wagner infographic.
- Add the uploaded WIfI wound–ischemia–infection classification image as a second ulcer-assessment reference.
- Add an IWGDF neuropathic-foot risk algorithm covering Risk 0–3, the exact LOPS/PAD/deformity/ulcer/amputation/ESRD criteria, and screening intervals from yearly to every 1–3 months.
- Present both uploaded images as tap-to-zoom clinical figures with descriptive text and captions, using the app’s existing image viewer.
- Update the Complications navigation label/search terms so foot ulcers, neuropathy, Wagner, WIfI, IWGDF, LOPS, and PAD are discoverable.

## Interaction and layout
- Keep the current triage and emergency tabs unchanged.
- Make the expanded tab list wrap cleanly on phones and remain keyboard accessible.
- Use concise risk-band cards/table rows so the screening schedule is quickly scannable and included in the existing copy/print export.

## Technical details
- Store both uploaded images through the project asset system and import their asset pointers.
- Add the new content within the existing complications module rather than creating a separate navigation destination.
- Verify TypeScript, relevant tests, preview build health, tab interaction, image zoom, and mobile/desktop layout.
