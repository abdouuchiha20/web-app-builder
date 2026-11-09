import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

const endpoint = await Service.ensure();
const client = OpenCode.make({
  baseUrl: endpoint.url,
  headers: Service.headers(endpoint),
});

const agents = await client.agent.list({ location: { directory: process.cwd() } });
for (const agent of agents.data) {
  console.log(
    JSON.stringify({
      id: agent.id,
      mode: agent.mode,
      model: agent.model,
      steps: agent.steps,
      permissions: agent.permissions,
    }),
  );
}

const models = await client.model.list({ types: ["chat"] });
console.log("MODELS:", models.data.length);
console.log("DEFAULT:", JSON.stringify(await client.model.default()));
