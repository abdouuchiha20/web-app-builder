import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

const endpoint = await Service.ensure();
const client = OpenCode.make({
  baseUrl: endpoint.url,
  headers: Service.headers(endpoint),
});

const sessions = await client.session.list();
const targets = sessions.data
  .filter((session) => (session.location?.directory ?? "").includes(".atelier"))
  .sort((a, b) => (b.time?.updated ?? 0) - (a.time?.updated ?? 0));

const session = targets[0];
console.log("SESSION:", session.id, session.location?.directory);
console.log("UPDATED:", new Date(session.time.updated).toISOString());

const messages = await client.message.list({ sessionID: session.id, order: "asc", limit: 200 });
console.log("COUNT:", messages.data.length);

for (const message of messages.data) {
  if (message.type === "assistant") {
    const texts = message.content.filter((part) => part.type === "text").map((part) => part.text);
    const tools = message.content.filter((part) => part.type === "tool").map((part) => part.name);
    const reasoning = message.content
      .filter((part) => part.type === "reasoning")
      .reduce((sum, part) => sum + part.text.length, 0);

    console.log(
      `assistant finish=${message.finish ?? "-"} reasoningChars=${reasoning} tools=[${tools.join(",")}] text=${JSON.stringify(texts.join(" ").slice(0, 160))}`,
    );
  } else if (message.type === "idle") {
    console.log("idle:", message.outcome, JSON.stringify(message.error ?? null));
  } else {
    console.log(message.type);
  }
}
