import "@tanstack/react-start/server-only";
import { postSystemOne } from "./postSystemOne";
import { readTypesafeApiKey } from "./readTypesafeApiKey.server";
import type { JevCallResult, JevQuestion } from "./types";

/** Server-only Jev call using TYPESAFE_API_KEY from the runtime env. */
export function postSystemOneWithServerKey(opts: {
  state: unknown;
  questions: Record<string, JevQuestion>;
  signal?: AbortSignal;
}): Promise<JevCallResult> {
  return postSystemOne({
    state: opts.state,
    questions: opts.questions,
    signal: opts.signal,
    getApiKey: readTypesafeApiKey,
  });
}

export { readTypesafeApiKey };
