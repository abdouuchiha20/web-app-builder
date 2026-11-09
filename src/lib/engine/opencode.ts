import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

const SITES_ROOT = path.join(process.cwd(), ".atelier", "sites");
const GENERATION_TIMEOUT_MS = 10 * 60 * 1000;
const POLL_MS = 2000;
const TICK_MS = 5000;

export type BuildStepId = "brief" | "build" | "preview";

export type GenerateEvent =
  | { type: "step"; id: BuildStepId; status: "pending" | "active" | "done"; detail?: string }
  | { type: "tick"; elapsedMs: number }
  | {
      type: "result";
      siteId: string;
      html: string;
      title: string;
      elapsedMs: number;
    }
  | { type: "error"; message: string };

export interface GenerateResult {
  siteId: string;
  html: string;
  title: string;
  elapsedMs: number;
}

type Client = ReturnType<typeof OpenCode.make>;

let enginePromise: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const endpoint = await Service.ensure();
      return OpenCode.make({
        baseUrl: endpoint.url,
        headers: Service.headers(endpoint),
      });
    })().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }

  return enginePromise;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");

  return slug || "site";
}

function buildPrompt(brief: string): string {
  return [
    "Build a complete, production-quality website from the brief below.",
    "",
    "BRIEF",
    '"""',
    brief,
    '"""',
    "",
    "DELIVERABLE — follow this exactly:",
    "1. Write ONE file named `index.html` in the current working directory. Do not create any other files.",
    "2. It must be a complete standalone document: <!DOCTYPE html>, <head>, <body>. Inline all CSS inside <style> and all JavaScript inside <script>. No frameworks, no build step, no local asset files.",
    "3. External resources only through public CDNs: Google Fonts for typography. For photography use `https://picsum.photos/seed/<word>/1600/1000` and nothing else. Never verify asset URLs.",
    "4. Real content only: write specific headlines, product names, prices and copy for this brief. Never lorem ipsum, never placeholder text.",
    "5. Design bar: a distinctive art direction — deliberate type scale, restrained palette, generous whitespace, strong visual hierarchy. Real motion: scroll reveals, hover states, subtle transitions. It must look designed, not templated.",
    "6. It must work at 390px, 768px and 1440px. Semantic HTML, visible focus states, aria labels where needed.",
    "7. No questions, no explanations, no shell commands, no package installs, no dev server.",
    "8. Write the file first. When index.html is complete, reply with exactly: DONE",
  ].join("\n");
}

async function fileExists(target: string): Promise<boolean> {
  try {
    const info = await stat(target);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function readSiteHtml(directory: string): Promise<string | null> {
  const indexPath = path.join(directory, "index.html");

  if (await fileExists(indexPath)) {
    const html = await readFile(indexPath, "utf8").catch(() => "");
    if (html.trim()) return html;
  }

  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return null;
  }

  const htmlFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"),
  );

  for (const file of htmlFiles) {
    const html = await readFile(path.join(directory, file.name), "utf8").catch(() => "");
    if (html.trim()) return html;
  }

  return null;
}

function extractHtmlFromText(text: string): string | null {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?<!DOCTYPE[\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const doctype = text.toLowerCase().indexOf("<!doctype html");
  if (doctype >= 0) return text.slice(doctype).trim();

  const htmlTag = text.toLowerCase().indexOf("<html");
  if (htmlTag >= 0) return text.slice(htmlTag).trim();

  return null;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1]?.replace(/\s+/g, " ").trim();
  return title || "Generated site";
}

async function cancelSession(client: Client, sessionID: string) {
  try {
    await client.session.interrupt({ sessionID });
  } catch {
    // Best effort — the session may already be idle.
  }
}

export async function generateSite(
  brief: string,
  onEvent: (event: GenerateEvent) => void,
  signal?: AbortSignal,
): Promise<GenerateResult> {
  const started = Date.now();
  const siteId = `${slugify(brief)}-${randomUUID().slice(0, 8)}`;
  const directory = path.join(SITES_ROOT, siteId);

  await mkdir(directory, { recursive: true });

  onEvent({
    type: "step",
    id: "brief",
    status: "done",
    detail: "Brief received. Building a complete first version.",
  });
  onEvent({
    type: "step",
    id: "build",
    status: "active",
    detail: "Choosing direction, then writing the page as one self-contained file.",
  });

  const client = await getClient();
  const session = await client.session.create({
    location: { directory },
    agent: "atelier-builder",
    title: brief.slice(0, 80),
  });

  const promptMessage = await client.session.prompt({
    sessionID: session.id,
    text: buildPrompt(brief),
  });

  const promptTime = promptMessage.time?.created ?? Date.now();
  const deadline = started + GENERATION_TIMEOUT_MS;

  let fileSeen = false;
  let lastTick = 0;
  let idle: { outcome: "succeeded" | "failed" | "interrupted"; error?: { message?: string } } | null =
    null;

  try {
    while (Date.now() < deadline) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      if (!fileSeen) {
        const html = await readSiteHtml(directory);
        if (html) {
          fileSeen = true;
          onEvent({
            type: "step",
            id: "build",
            status: "done",
            detail: "The page is written. Finishing up.",
          });
        }
      }

      const messages = await client.message.list({
        sessionID: session.id,
        order: "desc",
        limit: 40,
      });

      const idleMessage = messages.data.find(
        (message) => message.type === "idle" && message.time.created >= promptTime,
      );

      if (idleMessage && idleMessage.type === "idle") {
        idle = {
          outcome: idleMessage.outcome,
          error: idleMessage.error,
        };
        break;
      }

      if (Date.now() - lastTick >= TICK_MS) {
        lastTick = Date.now();
        onEvent({ type: "tick", elapsedMs: Date.now() - started });
      }

      await sleep(POLL_MS);
    }

    if (!idle) {
      throw new Error("The build took longer than 10 minutes and was stopped.");
    }

    let html = await readSiteHtml(directory);

    if (!html) {
      const messages = await client.message.list({
        sessionID: session.id,
        order: "asc",
        limit: 200,
      });

      const assistantText = messages.data
        .flatMap((message) =>
          message.type === "assistant"
            ? message.content
                .filter((part) => part.type === "text")
                .map((part) => part.text)
            : [],
        )
        .join("\n");

      html = extractHtmlFromText(assistantText);
    }

    if (!html) {
      const reason =
        idle.outcome === "failed"
          ? idle.error?.message
            ? `The model stopped with an error: ${idle.error.message}`
            : "The model stopped with an error before writing the page."
          : "The model finished without producing an index.html file.";

      throw new Error(`${reason} Try again, or make the brief more specific.`);
    }

    const elapsedMs = Date.now() - started;

    onEvent({
      type: "step",
      id: "build",
      status: "done",
      detail: "The page is written in one self-contained file.",
    });
    onEvent({
      type: "step",
      id: "preview",
      status: "done",
      detail: "Preview is live on the right.",
    });

    return {
      siteId,
      html,
      title: extractTitle(html),
      elapsedMs,
    };
  } catch (error) {
    await cancelSession(client, session.id);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The build was cancelled.");
    }

    throw error;
  }
}
