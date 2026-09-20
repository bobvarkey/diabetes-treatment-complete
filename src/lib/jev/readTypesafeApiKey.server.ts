/**
 * Server-only TypeSafe secret access.
 *
 * Set `TYPESAFE_API_KEY` in the hosting environment (Lovable project secrets,
 * Cloudflare/Nitro env, or `.env` / `.dev.vars` locally). Do **not** prefix it
 * with `VITE_` — Vite would embed it in the browser bundle.
 *
 * Never log the value. This file is import-protected (`.server.ts`).
 */
import "@tanstack/react-start/server-only";

function trimKey(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Reads TYPESAFE_API_KEY from the server runtime only.
 * Nitro/Cloudflare typically surface Worker bindings as process.env.
 */
export function readTypesafeApiKey(): string | undefined {
  const fromProcess = trimKey(
    typeof process !== "undefined" ? process.env.TYPESAFE_API_KEY : undefined,
  );
  if (fromProcess) return fromProcess;

  const globalEnv = globalThis as { TYPESAFE_API_KEY?: unknown };
  return trimKey(globalEnv.TYPESAFE_API_KEY);
}
