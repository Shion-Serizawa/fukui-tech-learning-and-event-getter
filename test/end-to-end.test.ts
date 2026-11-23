import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { runCollection } from "../src/collector/collect.ts";
import { FIXTURE_OWNER_NAME, connpassEvent, connpassPage } from "../src/connpass/fixtures/events.ts";
import { respondFeed } from "../web/functions/feed.xml.ts";
import { respondPage } from "../web/functions/index.ts";
import { HOUR, NOW, fakeConnpassDeps, jsonResponse } from "./fakes.ts";
import { resetDatabase } from "./reset-db.ts";

beforeEach(async () => {
  await resetDatabase(env.DB);
});

// 恒久的な回帰テスト（C-14）。主催者名を含むレスポンスを、収集 → 保存 → 一覧・RSS まで通す。
describe("WEB-17: 主催者名はどこにも現れない", () => {
  it("D1 の行・公開ページ・RSS のいずれにも出ない", async () => {
    const script = [
      jsonResponse(connpassPage([connpassEvent({ id: 1 })])),
      jsonResponse(connpassPage([connpassEvent({ id: 2 })])),
      jsonResponse(connpassPage([connpassEvent({ id: 3 })])),
    ];
    const run = await runCollection({ ...fakeConnpassDeps(script, NOW), db: env.DB }, NOW);
    expect(run.status).toBe("success");

    const rows = await env.DB.prepare("SELECT * FROM events").all();
    const page = await (await respondPage(env.DB, NOW + HOUR)).text();
    const feed = await (await respondFeed(env.DB, NOW + HOUR, "https://example.com")).text();

    expect(rows.results).toHaveLength(3);
    expect(page).toContain("福井 IT 勉強会 #1");
    expect(feed).toContain("福井 IT 勉強会 #3");
    for (const output of [JSON.stringify(rows.results), page, feed]) {
      expect(output).not.toContain(FIXTURE_OWNER_NAME);
    }
  });
});
