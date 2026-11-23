import { at, tester } from "../rule-tester.ts";
import { noRawMarkup } from "./no-raw-markup.ts";

tester.run("no-raw-markup", noRawMarkup, {
  valid: [
    { code: "const m = html`<h3>${title}</h3>`;", filename: at("src/web/render.ts") },
    { code: "const m = xml`<item><title>${title}</title></item>`;", filename: at("src/feed/rss.ts") },
    { code: "const s = `${a} < ${b}`;", filename: at("src/web/render.ts") },
    { code: "expect(out).toContain('<h2>福井</h2>');", filename: at("src/web/render.test.ts") },
    { code: "const s = `<b>${x}</b>`;", filename: at("src/domain/format.ts") },
  ],
  invalid: [
    { code: "const s = `<h3>${title}</h3>`;", filename: at("src/web/render.ts"), errors: [{ messageId: "forbidden" }] },
    {
      code: "const s = '<title>' + title + '</title>';",
      filename: at("src/feed/rss.ts"),
      errors: [{ messageId: "forbidden" }, { messageId: "forbidden" }],
    },
    {
      code: "return new Response(`<!doctype html>${body}`);",
      filename: at("web/functions/index.ts"),
      errors: [{ messageId: "forbidden" }],
    },
  ],
});
