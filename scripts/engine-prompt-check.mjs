import { mkdir } from "node:fs/promises";
import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

const endpoint = await Service.ensure();
const client = OpenCode.make({
  baseUrl: endpoint.url,
  headers: Service.headers(endpoint),
});

const dir = "C:\\Users\\abdou\\projects\\web-app-builder\\workspace\\engine-test";
await mkdir(dir, { recursive: true });

const started = Date.now();
const session = await client.session.create({ location: { directory: dir } });
console.log("SESSION:", session.id);

await client.session.prompt({
  sessionID: session.id,
  text: "Reply with exactly: ENGINE OK",
});

await client.experimental.session.wait({ sessionID: session.id });
console.log("WAITED_MS:", Date.now() - started);

const list = await client.message.list({ sessionID: session.id, order: "asc" });
console.log("MESSAGES:", list.data.length);

for (const message of list.data) {
  if (message.type === "assistant") {
    const text = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
    console.log("ASSISTANT_FINISH:", message.finish);
    console.log("ASSISTANT_TEXT:", JSON.stringify(text));
  }
}
