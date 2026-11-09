import path from "node:path";
import { readdir } from "node:fs/promises";
import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

const endpoint = await Service.ensure();
const client = OpenCode.make({
  baseUrl: endpoint.url,
  headers: Service.headers(endpoint),
});

const root = path.join(process.cwd(), ".atelier", "sites");
const dirs = (await readdir(root, { withFileTypes: true }).catch(() => []))
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(root, entry.name));

console.log("SITES:", dirs);

for (const directory of dirs) {
  console.log("FILES:", directory, await readdir(directory));
}

const sessions = await client.session.list();
const targets = sessions.data.filter((session) =>
  (session.location?.directory ?? "").includes(".atelier"),
);

console.log("TARGET SESSIONS:", targets.length);

for (const session of targets) {
  console.log("=== SESSION", session.id, session.location?.directory);

  const messages = await client.message.list({ sessionID: session.id, order: "asc" });
  console.log("MESSAGES:", messages.data.length);

  for (const message of messages.data) {
    if (message.type === "assistant") {
      console.log(
        "ASSISTANT finish:",
        message.finish,
        "agent:",
        message.agent,
        "model:",
        JSON.stringify(message.model),
        "error:",
        JSON.stringify(message.error),
      );
      for (const part of message.content) {
        if (part.type === "text") console.log("  TEXT:", JSON.stringify(part.text.slice(0, 400)));
        else if (part.type === "tool")
          console.log("  TOOL:", part.name, JSON.stringify(part.state).slice(0, 500));
        else console.log("  PART:", part.type);
      }
    } else if (message.type === "user") {
      console.log("USER:", JSON.stringify(message.payload?.text?.slice(0, 120)));
    } else {
      console.log("OTHER:", message.type, JSON.stringify(message).slice(0, 160));
    }
  }
}
