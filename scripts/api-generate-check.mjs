const base = process.env.ATELIER_URL ?? "http://localhost:3002";
const started = Date.now();

const response = await fetch(`${base}/api/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt:
      "Build a landing page for a specialty coffee roaster in Casablanca called Brûlerie 48. " +
      "One hero with the headline, three coffees with prices, a short story section, and a footer with opening hours.",
  }),
});

console.log("STATUS:", response.status);

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
let html = null;

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
      html = event.html;
      console.log("RESULT:", JSON.stringify({
        siteId: event.siteId,
        title: event.title,
        elapsedMs: event.elapsedMs,
        htmlBytes: event.html.length,
      }));
    } else if (event.type === "error") {
      console.log("ERROR:", event.message);
    } else {
      console.log("EVENT:", JSON.stringify(event));
    }
  }
}

console.log("TOTAL_MS:", Date.now() - started);
console.log("HTML_HEAD:", html ? JSON.stringify(html.slice(0, 200)) : "none");
