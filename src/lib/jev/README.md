# TypeSafe Jev (server-only)

Jev classifies **ambiguous** osteoporosis special-scenario / final-category routing. Core risk reclassify stays deterministic in the browser.

## Secret: `TYPESAFE_API_KEY`

The browser **must never** see this value. Do **not** name it `VITE_TYPESAFE_API_KEY` — Vite only injects `VITE_*` into the client bundle.

Set the **same** secret in every host that runs the TanStack Start server:

| Host                                              | Where to set it                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Local                                             | `.env` or `.dev.vars` (gitignored). Copy `.env.example`.                               |
| Lovable                                           | Project **Secrets / environment variables** — name `TYPESAFE_API_KEY` (never `VITE_`). |
| Cloudflare / Nitro (this app’s production target) | Worker secret / env binding with the same name.                                        |

The server reads `process.env.TYPESAFE_API_KEY` (and a Cloudflare-style `globalThis` binding if present). The value is never logged.

If the key is missing, the live osteoporosis form still auto-reclassifies; the UI shows **Jev unavailable**.

## Endpoints

- TanStack Start **server functions**: `getJevAvailability` (GET) and `askOsteoporosisJev` (POST) in `askOsteoporosisJev.ts`. The live form calls these; handlers import `*.server.ts` only on the server.
- HTTP fallback: `GET`/`POST` `/api/jev-systemone` (server route handlers only).

Both POST to `https://api.typesafe.ai/v1/systemone` with model `jev-latest`.

## Confidence gates

- ≥0.75: act; closed `final_category` **REPLACE**
- 0.50–0.74: show label + probabilities and ask the clinician
- &lt;0.50 or failure: keep the deterministic result with a review flag
