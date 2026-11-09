import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

import {
  SITES_ROOT,
  isSafeSiteId,
  readProjectHtml,
  readProjectMeta,
  writeProjectMeta,
} from "@/lib/engine/projects";

const GENERATION_TIMEOUT_MS = 10 * 60 * 1000;
const POLL_MS = 2000;
const TICK_MS = 5000;

export type BuildStepId = "brief" | "build" | "preview";
export type BuildMode = "create" | "refine";

export type GenerateEvent =
  | { type: "step"; id: BuildStepId; status: "pending" | "active" | "done"; detail?: string }
  | { type: "tick"; elapsedMs: number }
  | {
      type: "result";
      mode: BuildMode;
      siteId: string;
      html: string;
      title: string;
      elapsedMs: number;
    }
  | { type: "error"; message: string };

export interface GenerateResult {
  mode: BuildMode;
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

function refinePrompt(change: string): string {
  return [
    "You are editing an existing website. The complete site is in `index.html` in the current working directory.",
    "",
    "CHANGE REQUEST",
    '"""',
    change,
    '"""',
    "",
    "RULES — follow this exactly:",
    "1. Read `index.html` first, then apply the smallest set of edits that satisfies the request.",
    "2. Keep everything else intact: the copy, palette, layout and motion that were not mentioned.",
    "3. A value usually appears more than once: a visible list, a footer summary, and a JavaScript object that powers it. After editing, search the file for the old text or the old value and update EVERY copy, so the page never contradicts itself.",
    "4. If the page has a shop, cart or prices, keep prices and product names consistent everywhere they appear.",
    "5. Keep it ONE self-contained file: inline CSS in <style>, inline JavaScript in <script>, no build step, no local assets. Google Fonts and `https://picsum.photos/seed/<word>/1600/1000` only.",
    "6. Keep it responsive at 390px, 768px and 1440px, with visible focus states and alt text.",
    "7. No questions, no explanations, no shell commands, no package installs.",
    "8. When the edits are complete, reply with exactly: DONE",
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

function friendlyError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("free usage limit") ||
    lower.includes("freeusage") ||
    lower.includes("429") ||
    lower.includes("rate limit")
  ) {
    return (
      "The free OpenCode model quota is used up for now. " +
      "Wait for it to reset (the error said about 5 hours), or add your own provider key in OpenCode config. " +
      "Your project and its files are untouched."
    );
  }

  if (lower.includes("aborted") || lower.includes("cancelled")) {
    return "The build was cancelled.";
  }

  return message;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1]?.replace(/\s+/g, " ").trim();
  return title || "Untitled site";
}

async function cancelSession(client: Client, sessionID: string) {
  try {
    await client.session.interrupt({ sessionID });
  } catch {
    // Best effort — the session may already be idle.
  }
}

interface GenerateInput {
  brief: string;
  siteId?: string;
}

export async function generateSite(
  input: GenerateInput,
  onEvent: (event: GenerateEvent) => void,
  signal?: AbortSignal,
): Promise<GenerateResult> {
  const { brief } = input;
  const started = Date.now();
  const mode: BuildMode = input.siteId ? "refine" : "create";

  let siteId: string;
  let directory: string;
  let previousHtml: string | null = null;

  if (mode === "refine") {
    siteId = input.siteId as string;

    if (!isSafeSiteId(siteId)) {
      throw new Error("That project id is not valid.");
    }

    previousHtml = await readProjectHtml(siteId);

    if (!previousHtml) {
      throw new Error(
        "That project could not be found. It may have been deleted from .atelier/sites.",
      );
    }

    directory = path.join(SITES_ROOT, siteId);
  } else {
    siteId = `${slugify(brief)}-${randomUUID().slice(0, 8)}`;
    directory = path.join(SITES_ROOT, siteId);
    await mkdir(directory, { recursive: true });
  }

  onEvent({
    type: "step",
    id: "brief",
    status: "done",
    detail:
      mode === "refine"
        ? "Change received. Reading the current page."
        : "Brief received. Building a complete first version.",
  });
  onEvent({
    type: "step",
    id: "build",
    status: "active",
    detail:
      mode === "refine"
        ? "Applying your change to the existing page."
        : "Choosing direction, then writing the page as one self-contained file.",
  });

  const client = await getClient();
  const session = await client.session.create({
    location: { directory },
    agent: "atelier-builder",
    title: brief.slice(0, 80),
  });

  const prompts: string[] = [mode === "refine" ? refinePrompt(brief) : buildPrompt(brief)];

  let html: string | null = null;
  let idleOutcome: "succeeded" | "failed" | "interrupted" = "succeeded";
  let idleError: { message?: string } | undefined;

  for (let attempt = 0; attempt < prompts.length; attempt += 1) {
    const attemptStarted = Date.now();
    let promptMessage;
    try {
      promptMessage = await client.session.prompt({
        sessionID: session.id,
        text: prompts[attempt],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(friendlyError(message));
    }

    const actualPromptTime = promptMessage.time?.created ?? attemptStarted;
    const deadline = Date.now() + GENERATION_TIMEOUT_MS;

    let fileSeen = false;
    let lastTick = 0;
    let idle: {
      outcome: "succeeded" | "failed" | "interrupted";
      error?: { message?: string };
    } | null = null;

    try {
      while (Date.now() < deadline) {
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        if (!fileSeen) {
          const candidate = await readSiteHtml(directory);

          if (candidate && candidate !== previousHtml) {
            fileSeen = true;
            onEvent({
              type: "step",
              id: "build",
              status: "done",
              detail:
                mode === "refine"
                  ? "The change is applied. Finishing up."
                  : "The page is written. Finishing up.",
            });
          }
        }

        const messages = await client.message.list({
          sessionID: session.id,
          order: "desc",
          limit: 40,
        });

        const idleMessage = messages.data.find(
          (message) => message.type === "idle" && message.time.created >= actualPromptTime,
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
    } catch (error) {
      await cancelSession(client, session.id);

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("The build was cancelled.");
      }

      throw error;
    }

    if (!idle) {
      throw new Error("The build took longer than 10 minutes and was stopped.");
    }

    idleOutcome = idle.outcome;
    idleError = idle.error;

    html = await readSiteHtml(directory);

    if (!html) {
      const messages = await client.message.list({
        sessionID: session.id,
        order: "asc",
        limit: 200,
      });

      const assistantText = messages.data
        .flatMap((message) =>
          message.type === "assistant"
            ? message.content.filter((part) => part.type === "text").map((part) => part.text)
            : [],
        )
        .join("\n");

      html = extractHtmlFromText(assistantText);
    }

    const unchanged = mode === "refine" && !!previousHtml && html === previousHtml;

    if (unchanged && attempt === 0) {
      prompts.push(
        [
          "You replied DONE but `index.html` is byte-for-byte identical to before. No edits were applied.",
          "Re-read `index.html`, find the exact text or value the change request refers to, and edit it now.",
          "Do not reply DONE until the file has actually changed.",
          "",
          "CHANGE REQUEST (repeat):",
          '"""',
          brief,
          '"""',
        ].join("\n"),
      );
      html = null;
      continue;
    }

    break;
  }

  if (!html) {
    const reason =
      idleOutcome === "failed"
        ? idleError?.message
          ? `The model stopped with an error: ${friendlyError(idleError.message)}`
          : "The model stopped with an error before writing the page."
        : mode === "refine"
          ? "The model finished twice without changing index.html. Make the request more specific, or name the exact element to change."
          : "The model finished without producing an index.html file.";

    throw new Error(`${reason} Try again, or make the brief more specific.`);
  }

  const elapsedMs = Date.now() - started;
  const title = extractTitle(html);

  onEvent({
    type: "step",
    id: "build",
    status: "done",
    detail:
      mode === "refine"
        ? "The change is applied to the same file."
        : "The page is written in one self-contained file.",
  });
  onEvent({
    type: "step",
    id: "preview",
    status: "done",
    detail: mode === "refine" ? "The preview now shows the new version." : "Preview is live on the right.",
  });

  const existingMeta = await readProjectMeta(siteId);
  const priorBuilds = existingMeta?.builds ?? (previousHtml ? 1 : 0);

  await writeProjectMeta({
    id: siteId,
    title,
    brief: existingMeta?.brief || (mode === "create" ? brief : ""),
    createdAt: existingMeta?.createdAt ?? started,
    updatedAt: Date.now(),
    builds: priorBuilds + 1,
  });

  return {
    mode,
    siteId,
    html,
    title,
    elapsedMs,
  };
}