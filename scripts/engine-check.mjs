import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

const endpoint = await Service.ensure();
console.log("ENDPOINT:", endpoint.url);

const client = OpenCode.make({
  baseUrl: endpoint.url,
  headers: Service.headers(endpoint),
});

const info = await client.server.info();
console.log("SERVER INFO:", JSON.stringify(info).slice(0, 800));
