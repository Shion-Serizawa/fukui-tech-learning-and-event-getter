import { at, tester } from "../rule-tester.ts";
import { noAmbientClock } from "./no-ambient-clock.ts";

tester.run("no-ambient-clock", noAmbientClock, {
  valid: [
    { code: "const now = Date.now();", filename: at("src/worker.ts") },
    { code: "const now = new Date();", filename: at("web/functions/index.ts") },
    { code: "const d = new Date(now);", filename: at("src/domain/window.ts") },
    { code: "const t = Date.parse(s);", filename: at("src/connpass/parse.ts") },
  ],
  invalid: [
    { code: "const now = Date.now();", filename: at("src/domain/window.ts"), errors: [{ messageId: "forbidden" }] },
    { code: "const now = new Date();", filename: at("src/feed/rss.ts"), errors: [{ messageId: "forbidden" }] },
    { code: "const s = Date();", filename: at("src/web/render.ts"), errors: [{ messageId: "forbidden" }] },
    {
      code: "const t = performance.now();",
      filename: at("src/collector/collect.ts"),
      errors: [{ messageId: "forbidden" }],
    },
    {
      code: "const now = Date.now();",
      filename: at("src/domain/window.test.ts"),
      errors: [{ messageId: "forbidden" }],
    },
  ],
});
