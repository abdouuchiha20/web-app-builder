import { generateSite, type GenerateEvent } from "@/lib/engine/opencode";

export const maxDuration = 600;

interface GenerateBody {
  prompt?: unknown;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  const text = String(error);
  if (text.includes("fetch failed") || text.includes("ECONNREFUSED")) {
    return "Could not reach the local OpenCode engine. Make sure OpenCode is running, then try again.";
  }

  return text || "The build failed for an unknown reason.";
}

export async function POST(request: Request) {
  let body: GenerateBody;

  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return Response.json({ error: "A prompt is required." }, { status: 400 });
  }

  if (prompt.length > 8000) {
    return Response.json(
      { error: "That brief is too long. Keep it under 8,000 characters." },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const abortController = new AbortController();

  request.signal.addEventListener("abort", () => abortController.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;

      const send = (event: GenerateEvent) => {
        if (!open) return;

        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };

      try {
        const result = await generateSite(prompt, send, abortController.signal);
        send({ type: "result", ...result });
      } catch (error) {
        send({ type: "error", message: errorMessage(error) });
      } finally {
        open = false;

        try {
          controller.close();
        } catch {
          // The client may have disconnected already.
        }
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
