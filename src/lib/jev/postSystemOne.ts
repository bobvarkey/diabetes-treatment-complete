import {
  JEV_MODEL,
  JEV_SYSTEMONE_URL,
  type JevCallResult,
  type JevQuestion,
  type JevSystemOneRequest,
  type JevSystemOneResponse,
} from "./types";
import { parseJevAnswers } from "./gates";

/** Never log Authorization headers or the API key. */
export function safeJevError(status?: number, code?: string): { status?: number; code?: string } {
  return { status, code };
}

/**
 * POST to TypeSafe System One. The caller must supply getApiKey — this module
 * does not read the TypeSafe secret from the environment, so it is safe to
 * unit-test without leaking secrets.
 */
export async function postSystemOne(opts: {
  state: unknown;
  questions: Record<string, JevQuestion>;
  getApiKey: () => string | undefined;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}): Promise<JevCallResult> {
  const raw = opts.getApiKey();
  const apiKey = typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
  if (!apiKey) {
    return { available: false, reason: "missing_key", reviewFlag: true };
  }

  const fetchImpl = opts.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(JEV_SYSTEMONE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: JEV_MODEL,
        state: opts.state,
        questions: opts.questions,
      } satisfies JevSystemOneRequest),
      signal: opts.signal,
    });
  } catch {
    return { available: false, reason: "network", reviewFlag: true };
  }

  if (!response.ok) {
    return { available: false, reason: "http_error", reviewFlag: true };
  }

  let body: JevSystemOneResponse;
  try {
    body = (await response.json()) as JevSystemOneResponse;
  } catch {
    return { available: false, reason: "invalid_response", reviewFlag: true };
  }

  const answers = parseJevAnswers(body);
  if (!answers) {
    return { available: false, reason: "invalid_response", reviewFlag: true };
  }

  const model = typeof body.model === "string" ? body.model : undefined;
  return { available: true, model, answers };
}
