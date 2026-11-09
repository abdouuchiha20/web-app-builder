import { OpenCode } from "@opencode/client";
import { Service } from "@opencode/client/service";

const endpoint = await Service.ensure();
const client = OpenCode.make({
  baseUrl: endpoint.url,
  headers: Service.headers(endpoint),
});

const { data } = await client.model.list({ types: ["chat"] });

const rows = data
  .filter((model) => model.capabilities?.tools)
  .filter((model) => (model.limit?.output ?? 0) >= 32768)
  .map((model) => ({
    key: `${model.providerID}/${model.id}`,
    name: model.name,
    out: model.limit?.output,
    ctx: model.limit?.context,
    free: /free/i.test(model.name) || model.cost?.every?.((c) => !c.input && !c.output),
  }));

rows.sort((a, b) => (b.free === true) - (a.free === true) || (b.out ?? 0) - (a.out ?? 0));

console.log(JSON.stringify(rows.slice(0, 30), null, 2));
