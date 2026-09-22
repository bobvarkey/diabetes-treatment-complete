import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import type { JevQuestion } from "@/lib/jev/types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/**
 * Server-only Jev proxy. The browser never receives TYPESAFE_API_KEY.
 * Hosting (Lovable secrets, Cloudflare/Nitro) must set that env var — not VITE_*.
 * Handlers dynamically import `*.server.ts` so the client route tree cannot pull in the key.
 */
export const Route = createFileRoute("/api/jev-systemone")({
  server: {
    handlers: {
      GET: async () => {
        const { readTypesafeApiKey } = await import("@/lib/jev/readTypesafeApiKey.server");
        const key = readTypesafeApiKey();
        if (!key) {
          return json({ available: false, reason: "missing_key", reviewFlag: true });
        }
        return json({ available: true });
      },
      POST: async ({ request }) => {
        let body: { state?: unknown; questions?: Record<string, JevQuestion> };
        try {
          body = (await request.json()) as {
            state?: unknown;
            questions?: Record<string, JevQuestion>;
          };
        } catch {
          return json({ available: false, reason: "invalid_response", reviewFlag: true }, 400);
        }
        if (!body.questions || typeof body.questions !== "object") {
          return json({ available: false, reason: "invalid_response", reviewFlag: true }, 400);
        }
        const { postSystemOneWithServerKey } = await import("@/lib/jev/postSystemOne.server");
        const result = await postSystemOneWithServerKey({
          state: body.state,
          questions: body.questions,
        });
        return json(result, 200);
      },
    },
  },
});
