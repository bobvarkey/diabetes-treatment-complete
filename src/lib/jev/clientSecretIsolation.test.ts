import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

function isServerOnlySource(file: string): boolean {
  const rel = relative(SRC, file).replaceAll("\\", "/");
  return rel.endsWith(".server.ts") || rel.startsWith("routes/api/");
}

describe("TYPESAFE_API_KEY stays off the client", () => {
  const files = walk(SRC);

  it("never uses a VITE_ prefix for the TypeSafe secret", () => {
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, relative(SRC, file)).not.toMatch(/VITE_TYPESAFE/);
    }
  });

  it("client modules do not read process.env.TYPESAFE_API_KEY", () => {
    for (const file of files) {
      if (isServerOnlySource(file)) continue;
      const text = readFileSync(file, "utf8");
      expect(text, relative(SRC, file)).not.toMatch(/process\.env\.TYPESAFE_API_KEY/);
      expect(text, relative(SRC, file)).not.toMatch(/globalThis\.TYPESAFE_API_KEY/);
    }
  });

  it("the HTTP helper requires an injected getApiKey instead of env", () => {
    const text = readFileSync(join(SRC, "lib/jev/postSystemOne.ts"), "utf8");
    expect(text).toMatch(/getApiKey:/);
    expect(text).not.toMatch(/process\.env/);
  });
});
