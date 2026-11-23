import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commitSuccessfulRun } from "../src/db/write.ts";
import type { HokurikuEvent } from "../src/domain/event.ts";
import { SECURITY_HEADERS } from "../src/web/security-headers.ts";
import { respondFeed } from "../web/functions/feed.xml.ts";
import { HOUR, NOW } from "./fakes.ts";
import { hEvent } from "./events.ts";
import { resetDatabase } from "./reset-db.ts";

const SITE = "https://hokuriku-it-events.pages.dev";

async function feedAfter(runs: readonly { at: number; events: readonly HokurikuEvent[] }[], now = NOW) {
  for (const run of runs) {
    await commitSuccessfulRun(env.DB, { startedAt: run.at, finishedAt: run.at + 1000, events: run.events });
  }
  return respondFeed(env.DB, now, SITE);
}

const guid = (s: string | undefined) => s?.match(/<guid[^>]*>([^<]*)<\/guid>/)?.[1];
const pubDate = (s: string | undefined) => s?.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1];
const items = (xml: string): string[] => [...xml.matchAll(/<item>.*?<\/item>/gs)].map((m) => m[0]);

beforeEach(async () => {
  await resetDatabase(env.DB);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RSS-01 / RSS-03: 配信", () => {
  it("/feed.xml は 200 で RSS 2.0 を返す", async () => {
    const res = await feedAfter([{ at: NOW - HOUR, events: [hEvent("1")] }]);
    const xml = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>')).toBe(true);
    expect(xml.trimEnd().endsWith("</channel></rss>")).toBe(true);
  });
});

describe("RSS-04 / RSS-05: 項目", () => {
  it("これから開催されるものを初めて保存した新しい順に。各要素を期待どおりに出す", async () => {
    const start = Date.parse("2026-12-05T13:00:00+09:00");
    const xml = await (
      await feedAfter([
        { at: NOW - 2 * HOUR, events: [hEvent("1", { title: "古い" })] },
        {
          at: NOW - HOUR,
          events: [
            hEvent("1", { title: "古い" }),
            hEvent("2", { title: "新しい", prefecture: "ishikawa", startedAt: start, endedAt: start + 4 * HOUR }),
            hEvent("3", { title: "終了", startedAt: NOW - 3 * HOUR, endedAt: NOW - HOUR }),
          ],
        },
      ])
    ).text();

    const [first, second, ...rest] = items(xml);
    expect(rest).toEqual([]);
    expect(first).toBe(
      "<item><title>[石川] 新しい</title><link>https://connpass.com/event/2/</link>" +
        '<guid isPermaLink="false">connpass:2</guid><pubDate>Mon, 23 Nov 2026 02:00:00 GMT</pubDate>' +
        "<description>2026-12-05 (土) 13:00 - 17:00 / 福井市 ○○センター / 25 / 40 人</description></item>",
    );
    expect(second).toContain("<title>[福井] 古い</title>");
  });
});

describe("RSS-06: guid は更新されても変わらない", () => {
  it("タイトルと日時が変わっても同じ guid・同じ pubDate", async () => {
    const before = items(
      await (await feedAfter([{ at: NOW - 2 * HOUR, events: [hEvent("9", { title: "A" })] }])).text(),
    );
    const after = items(
      await (
        await feedAfter([{ at: NOW - HOUR, events: [hEvent("9", { title: "B", startedAt: NOW + 2 * HOUR })] }])
      ).text(),
    );
    expect(guid(after[0])).toBe(guid(before[0]));
    expect(pubDate(after[0])).toBe(pubDate(before[0]));
    expect(after[0]).toContain("B</title>");
  });
});

describe("RSS-07: XML として壊れない", () => {
  it("& < ]]> と制御文字を含むタイトルをエスケープする", async () => {
    const xml = await (
      await feedAfter([{ at: NOW - HOUR, events: [hEvent("1", { title: "A & B <C> ]]> \u0000D" })] }])
    ).text();
    expect(xml).toContain("<title>[福井] A &amp; B &lt;C&gt; ]]&gt; D</title>");
    expect(xml).not.toContain("\u0000");
  });
});

describe("RSS-08: channel", () => {
  it("タイトル・公開ページへのリンク・lastBuildDate", async () => {
    const xml = await (await feedAfter([])).text();
    expect(xml).toContain(
      `<channel><title>北陸ITイベント</title><link>${SITE}</link><description>福井・石川・富山で開催されるオフラインのIT勉強会</description><language>ja</language><lastBuildDate>Mon, 23 Nov 2026 03:00:00 GMT</lastBuildDate>`,
    );
  });
});

describe("RSS-09: D1 が読めないとき", () => {
  it("空のフィードではなく 503 を返す", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await env.DB.exec("DROP TABLE events");
    const res = await respondFeed(env.DB, NOW, SITE);
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("<rss");
  });
});

describe("WEB-15: RSS の応答にもセキュリティヘッダを付ける", () => {
  it("通常時とエラー時", async () => {
    const ok = await respondFeed(env.DB, NOW, SITE);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await env.DB.exec("DROP TABLE events");
    const failed = await respondFeed(env.DB, NOW, SITE);
    for (const res of [ok, failed]) {
      for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(res.headers.get(name)).toBe(value);
    }
  });
});
