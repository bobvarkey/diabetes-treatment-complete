import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { postSystemOne } from "@/lib/jev/postSystemOne";
import type { JevQuestion } from "@/lib/jev/types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/jev-systemone")({
  server: {
    handlers: {
      GET: async () => {
        const key =
          typeof process.env.TYPESAFE_API_KEY === "string"
            ? process.env.TYPESAFE_API_KEY.trim()
            : "";
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
        const result = await postSystemOne({
          state: body.state,
          questions: body.questions,
          getApiKey: () => process.env.TYPESAFE_API_KEY,
        });
        return json(result, 200);
      },
    },
  },
});
