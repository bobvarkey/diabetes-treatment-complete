import { afterEach, describe, expect, it, vi } from "vitest";
import { readTypesafeApiKey } from "./readTypesafeApiKey.server";

describe("readTypesafeApiKey", () => {
  const original = process.env.TYPESAFE_API_KEY;

  afterEach(() => {
    if (original === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = original;
    delete (globalThis as { TYPESAFE_API_KEY?: unknown }).TYPESAFE_API_KEY;
    vi.restoreAllMocks();
  });

  it("returns undefined when the secret is missing", () => {
    delete process.env.TYPESAFE_API_KEY;
    expect(readTypesafeApiKey()).toBeUndefined();
  });

  it("trims a process.env value and never logs it", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    process.env.TYPESAFE_API_KEY = "  test-key-not-for-logging  ";
    expect(readTypesafeApiKey()).toBe("test-key-not-for-logging");
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/test-key-not-for-logging/);
    expect(JSON.stringify(error.mock.calls)).not.toMatch(/test-key-not-for-logging/);
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/test-key-not-for-logging/);
    expect(JSON.stringify(info.mock.calls)).not.toMatch(/test-key-not-for-logging/);
  });
});
