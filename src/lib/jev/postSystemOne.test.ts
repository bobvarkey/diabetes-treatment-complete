import { describe, expect, it, vi } from "vitest";
import { postSystemOne, safeJevError } from "./postSystemOne";
import { JEV_MODEL, JEV_SYSTEMONE_URL } from "./types";

describe("postSystemOne", () => {
  it("degrades when TYPESAFE_API_KEY is missing and never calls the network", async () => {
    const fetchImpl = vi.fn();
    const result = await postSystemOne({
      state: { hello: "world" },
      questions: { x: { type: "noul", instructions: "yes?" } },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getApiKey: () => undefined,
    });
    expect(result).toEqual({ available: false, reason: "missing_key", reviewFlag: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs compact state to TypeSafe System One with jev-latest", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: "jev-1.13.0",
        answers: {
          final_category: { choice: "high", confidence: 0.9, probabilities: { high: 0.9 } },
        },
      }),
    });
    const result = await postSystemOne({
      state: { baselineCategory: "high" },
      questions: {
        final_category: {
          type: "choice",
          instructions: "route",
          criteria: { high: "high", very_high: "vh" },
        },
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getApiKey: () => "test-key-not-for-logging",
    });
    expect(result.available).toBe(true);
    if (result.available) {
      expect(result.answers.final_category).toMatchObject({ choice: "high", confidence: 0.9 });
    }
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(JEV_SYSTEMONE_URL);
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe(JEV_MODEL);
    expect(body.state).toEqual({ baselineCategory: "high" });
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key-not-for-logging");
  });

  it("returns http_error without including the API key in the result", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "nope" }) });
    const result = await postSystemOne({
      state: {},
      questions: { x: { type: "noul", instructions: "yes?" } },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getApiKey: () => "super-secret-key",
    });
    expect(result).toEqual({ available: false, reason: "http_error", reviewFlag: true });
    expect(JSON.stringify(result)).not.toMatch(/super-secret-key/);
    expect(JSON.stringify(safeJevError(401, "unauthorized"))).not.toMatch(/secret/i);
  });
});
