# Endocrine Rx

Clinical reference for diabetes, bone, and endocrine care. Imported from [bobvarkey/diabetes-treatment-complete](https://github.com/bobvarkey/diabetes-treatment-complete).

The app is a TanStack Start + Vite bedside tool covering ADA-style diabetes diagnosis and treatment, insulin and GLP-1 dosing, DKA/HHS, foot-ulcer grading, osteoporosis, GIOP, osteomalacia, and steroid tapers.

## Run locally

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 43123
```

Open http://127.0.0.1:43123.

Optional: copy `.env.example` to `.env` and set `TYPESAFE_API_KEY` if you use the TypeSafe Jev integration. The rest of the app runs without it.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm test` — Vitest
- `npm run lint` — ESLint
