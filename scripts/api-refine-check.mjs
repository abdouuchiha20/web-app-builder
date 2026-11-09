// Proves refine edits the same site in place instead of rebuilding it.
// Usage: node scripts/api-refine-check.mjs <siteId> "<change request>"

const base = process.env.ATELIER_URL ?? "http://localhost:3002";
const siteId = process.argv[2];
const change = process.argv[3] ?? "Make the main headline shorter and warmer.";

if (!siteId) {
  console.error("Pass a siteId from /api/projects.");
  process.exit(1);
}

const before = await (await fetch(`${base}/api/projects/${siteId}`)).json();
const beforeHtml = before.project?.html ?? "";
const beforeTitle = before.project?.title ?? "";
const headline = beforeHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  ?.replace(/<[^>]+>/g, "")
  .replace(/\s+/g, " ")
  .trim();

console.log("BEFORE:", JSON.stringify({
  siteId,
  title: beforeTitle,
  bytes: beforeHtml.length,
  builds: before.project?.builds,
  headline,
}));

const started = Date.now();
const response = await fetch(`${base}/api/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: change, siteId }),
});

console.log("STATUS:", response.status);

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
let result = null;

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.trim()) continue;

    const event = JSON.parse(line);

    if (event.type === "result") {
      result = event;
    } else if (event.type === "error") {
      console.log("ERROR:", event.message);
    } else if (event.type === "debug") {
      console.log("DEBUG:\n" + event.text);
    } else {
      console.log("EVENT:", JSON.stringify(event));
    }
  }
}

const after = await (await fetch(`${base}/api/projects/${siteId}`)).json();
const afterHtml = after.project?.html ?? "";

console.log("RESULT:", JSON.stringify({
  mode: result?.mode,
  sameSiteId: result?.siteId === siteId,
  title: result?.title,
  elapsedMs: result?.elapsedMs,
}));

console.log("AFTER:", JSON.stringify({
  title: after.project?.title,
  bytes: afterHtml.length,
  builds: after.project?.builds,
  headline: afterHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim(),
  sameHtml: afterHtml === beforeHtml,
  headlinePreserved: Boolean(headline) && afterHtml.includes(headline),
}));

console.log("TOTAL_MS:", Date.now() - started);
