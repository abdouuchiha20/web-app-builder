import path from "node:path";
import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

const endpoint = await Service.ensure();
const client = OpenCode.make({
  baseUrl: endpoint.url,
  headers: Service.headers(endpoint),
});

const directory = path.join(process.cwd(), ".atelier", "sites", "probe");
const agents = await client.agent.list({ location: { directory } });
console.log(agents.data.map((agent) => agent.id).join("\n"));
