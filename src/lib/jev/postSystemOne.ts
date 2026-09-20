import {
  JEV_MODEL,
  JEV_SYSTEMONE_URL,
  type JevCallResult,
  type JevQuestion,
  type JevSystemOneResponse,
} from "./types";
import { parseJevAnswers } from "./gates";

function readApiKey(getApiKey?: () => string | undefined): string | undefined {
  const raw = getApiKey
    ? getApiKey()
    : typeof process !== "undefined"
      ? process.env.TYPESAFE_API_KEY
      : undefined;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Never log Authorization headers or the API key. */
export function safeJevError(status?: number, code?: string): { status?: number; code?: string } {
  return { status, code };
}

export async function postSystemOne(opts: {
  state: unknown;
  questions: Record<string, JevQuestion>;
  fetchImpl?: typeof fetch;
  getApiKey?: () => string | undefined;
  signal?: AbortSignal;
}): Promise<JevCallResult> {
  const apiKey = readApiKey(opts.getApiKey);
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
      }),
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
