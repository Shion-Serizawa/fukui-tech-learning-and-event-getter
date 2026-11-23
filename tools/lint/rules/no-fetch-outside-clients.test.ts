import { at, tester } from "../rule-tester.ts";
import { noFetchOutsideClients } from "./no-fetch-outside-clients.ts";

tester.run("no-fetch-outside-clients", noFetchOutsideClients, {
  valid: [
    { code: "await fetch(url);", filename: at("src/connpass/client.ts") },
    { code: "await fetch(webhookUrl, init);", filename: at("src/notify/discord.ts") },
    { code: "await env.ASSETS.fetch(request);", filename: at("web/functions/index.ts") },
    { code: "await exports.default.fetch(request);", filename: at("test/rss.test.ts") },
  ],
  invalid: [
    { code: "await fetch(url);", filename: at("src/collector/collect.ts"), errors: [{ messageId: "forbidden" }] },
    { code: "await globalThis.fetch(url);", filename: at("src/web/render.ts"), errors: [{ messageId: "forbidden" }] },
    { code: "await fetch(url);", filename: at("web/functions/index.ts"), errors: [{ messageId: "forbidden" }] },
    { code: "await fetch(url);", filename: at("src/notify/format.ts"), errors: [{ messageId: "forbidden" }] },
  ],
});
