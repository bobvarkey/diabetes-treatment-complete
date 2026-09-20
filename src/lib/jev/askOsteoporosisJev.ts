import { createServerFn } from "@tanstack/react-start";
import type { JevCallResult, JevQuestion } from "./types";

export type OsteoporosisJevPayload = {
  state: unknown;
  questions: Record<string, JevQuestion>;
};

/**
 * Client-callable stubs. Handlers dynamically import `*.server.ts` so the
 * browser bundle never pulls in TYPESAFE_API_KEY.
 */
export const getJevAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { readTypesafeApiKey } = await import("./readTypesafeApiKey.server");
  const key = readTypesafeApiKey();
  if (!key) {
    return { available: false as const, reason: "missing_key" as const, reviewFlag: true as const };
  }
  return { available: true as const };
});

export const askOsteoporosisJev = createServerFn({ method: "POST" })
  .validator((data: OsteoporosisJevPayload) => data)
  .handler(async ({ data }) => {
    const { postSystemOneWithServerKey } = await import("./postSystemOne.server");
    return postSystemOneWithServerKey({
      state: data.state,
      questions: data.questions,
    });
  });

async function fetchJevSystemOne(
  payload: OsteoporosisJevPayload,
  signal?: AbortSignal,
): Promise<JevCallResult> {
  try {
    const res = await fetch("/api/jev-systemone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) {
      return { available: false, reason: "http_error", reviewFlag: true };
    }
    return (await res.json()) as JevCallResult;
  } catch {
    return { available: false, reason: "network", reviewFlag: true };
  }
}

/** Prefer the server function; fall back to the API route (tests / missing compiler). */
export async function defaultAskOsteoporosisJev(
  payload: OsteoporosisJevPayload,
  signal?: AbortSignal,
): Promise<JevCallResult> {
  if (signal?.aborted) {
    return { available: false, reason: "network", reviewFlag: true };
  }
  try {
    return await askOsteoporosisJev({ data: payload, signal });
  } catch {
    if (signal?.aborted) {
      return { available: false, reason: "network", reviewFlag: true };
    }
    return fetchJevSystemOne(payload, signal);
  }
}

export async function probeJevAvailability(): Promise<{
  available: boolean;
  reason?: string;
}> {
  try {
    return await getJevAvailability();
  } catch {
    try {
      const res = await fetch("/api/jev-systemone", { method: "GET" });
      const body = (await res.json()) as { available?: boolean; reason?: string };
      return { available: !!body.available, reason: body.reason };
    } catch {
      return { available: false, reason: "network" };
    }
  }
}
