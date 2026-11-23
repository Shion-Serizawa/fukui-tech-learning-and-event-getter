import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commitSuccessfulRun } from "../src/db/write.ts";
import type { HokurikuEvent } from "../src/domain/event.ts";
import { SECURITY_HEADERS } from "../src/web/security-headers.ts";
import { EMPTY_MESSAGE, ERROR_MESSAGE, FUKUI_EMPTY_MESSAGE } from "../src/web/render.ts";
import { respondPage } from "../web/functions/index.ts";
import { DAY, HOUR, NOW } from "./fakes.ts";
import { hEvent } from "./events.ts";
import { resetDatabase } from "./reset-db.ts";

const FINISHED = NOW - 10 * 60 * 1000;

async function pageWith(events: readonly HokurikuEvent[], now = NOW): Promise<{ status: number; html: string }> {
  await commitSuccessfulRun(env.DB, { startedAt: FINISHED - 5000, finishedAt: FINISHED, events });
  const res = await respondPage(env.DB, now);
  return { status: res.status, html: await res.text() };
}

const h3Titles = (html: string): string[] =>
  [...html.matchAll(/<h3><a [^>]*>([^<]*)<\/a><\/h3>/g)].map((m) => m[1] ?? "");
const h2s = (html: string): string[] => [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1] ?? "");

const ended = (id: string, partial: Partial<HokurikuEvent> = {}): HokurikuEvent =>
  hEvent(id, { startedAt: NOW - 3 * HOUR, endedAt: NOW - HOUR, ...partial });

beforeEach(async () => {
  await resetDatabase(env.DB);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("WEB-01 / WEB-02: 節と並び順", () => {
  it("福井 → 石川・富山 → 終了の順で、それぞれ期待した並びになる", async () => {
    const { status, html } = await pageWith([
      hEvent("f2", { title: "福井B", startedAt: NOW + 2 * DAY, endedAt: NOW + 2 * DAY + HOUR }),
      hEvent("f1", { title: "福井A", startedAt: NOW + DAY, endedAt: NOW + DAY + HOUR }),
      hEvent("t1", { title: "富山A", prefecture: "toyama" }),
      ended("e1", { title: "終了A", startedAt: NOW - 3 * DAY, endedAt: NOW - 3 * DAY + HOUR }),
      ended("e2", { title: "終了B" }),
      ended("old", { title: "古い", startedAt: NOW - 15 * DAY, endedAt: NOW - 15 * DAY + HOUR }),
    ]);
    expect(status).toBe(200);
    expect(h2s(html)).toEqual(["福井", "石川・富山", "終了したイベント"]);
    expect(h3Titles(html)).toEqual(["福井A", "福井B", "富山A", "終了B", "終了A"]);
  });
});

describe("WEB-03 / WEB-05 / WEB-06 / WEB-07: イベントカード", () => {
  it("タイトルは connpass へのリンク。場所・県名バッジ・参加者数・ハッシュタグを出す", async () => {
    const { html } = await pageWith([hEvent("1", { title: "勉強会", url: "https://connpass.com/event/1/" })]);
    expect(html).toContain('<h3><a href="https://connpass.com/event/1/">勉強会</a></h3>');
    expect(html).toContain("福井市 ○○センター");
    expect(html).toContain('<span class="tag tag--pref">福井</span>');
    expect(html).toContain("25 / 40 人");
    expect(html).toContain("<span>#fukuidev</span>");
  });

  it("場所が空なら住所、両方空なら場所の行を出さない", async () => {
    const { html } = await pageWith([
      hEvent("1", { place: null, address: "金沢市広坂", prefecture: "ishikawa" }),
      hEvent("2", { place: null, address: null }),
    ]);
    expect(html).toContain('<p class="event__where">金沢市広坂</p>');
    expect(html.match(/event__where/g)).toHaveLength(1);
  });

  it("定員がなければ参加者数だけ。ハッシュタグがなければ出さない", async () => {
    const { html } = await pageWith([hEvent("1", { capacity: null, accepted: 8, hashTag: null })]);
    expect(html).toContain("<span>8 人</span>");
    expect(html).not.toContain("#");
  });
});

describe("WEB-04: 日時の表記", () => {
  it("JST の `YYYY-MM-DD (曜) HH:MM - HH:MM`", async () => {
    const start = Date.parse("2026-12-05T13:00:00+09:00");
    const { html } = await pageWith([hEvent("1", { startedAt: start, endedAt: start + 4 * HOUR })]);
    expect(html).toContain("2026-12-05 (土) 13:00 - 17:00");
  });
});

describe("WEB-08: 空・端の状態", () => {
  it("これからも終了も0件なら空状態の一文だけ（フッターの最終収集日時は出す）", async () => {
    const { html } = await pageWith([]);
    expect(html).toContain(EMPTY_MESSAGE);
    expect(h2s(html)).toEqual([]);
    expect(html).toContain("最終収集: ");
  });

  it("福井が0件でも見出しは残し、一文を置く", async () => {
    const { html } = await pageWith([hEvent("1", { prefecture: "toyama" })]);
    expect(h2s(html)).toEqual(["福井", "石川・富山"]);
    expect(html).toContain(FUKUI_EMPTY_MESSAGE);
  });

  it("石川・富山が0件なら節ごと省く。終了が0件なら節ごと省く", async () => {
    const { html } = await pageWith([hEvent("1")]);
    expect(h2s(html)).toEqual(["福井"]);
  });

  it("これからが0件で終了だけあるなら、終了の節だけ出す（空状態にしない）", async () => {
    const { html } = await pageWith([ended("1")]);
    expect(h2s(html)).toEqual(["終了したイベント"]);
    expect(html).not.toContain(EMPTY_MESSAGE);
    expect(html).not.toContain(FUKUI_EMPTY_MESSAGE);
  });
});

describe("WEB-09: 終了の表示", () => {
  it("終了の節のカードには「終了」の文字が付く", async () => {
    const { html } = await pageWith([ended("1"), hEvent("2")]);
    expect(html.match(/tag--ended">終了</g)).toHaveLength(1);
  });
});

describe("WEB-10: 最終収集日時", () => {
  it("最新の成功回の終了時刻を JST で出す", async () => {
    const { html } = await pageWith([]);
    expect(html).toContain("最終収集: 2026-11-23 11:50");
    expect(html).toContain('<a href="https://connpass.com/">connpass</a>');
  });

  it("成功回が一度もなければ「まだありません」", async () => {
    const html = await (await respondPage(env.DB, NOW)).text();
    expect(html).toContain("最終収集: まだありません");
  });
});

describe("WEB-11: D1 が読めないとき", () => {
  it("503 で「表示できません」だけを出し、空状態や最終収集日時と区別する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await env.DB.exec("DROP TABLE collection_runs");
    const res = await respondPage(env.DB, NOW);
    const html = await res.text();
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(html).toContain(ERROR_MESSAGE);
    expect(html).not.toContain(EMPTY_MESSAGE);
    expect(html).not.toContain("最終収集");
  });
});

describe("WEB-12: RSS への導線", () => {
  it("自動検出の link 要素とフッターのリンクを置く", async () => {
    const { html } = await pageWith([]);
    expect(html).toContain('<link rel="alternate" type="application/rss+xml" title="北陸ITイベント" href="/feed.xml">');
    expect(html).toContain('<a href="/feed.xml">RSS</a>');
  });
});

describe("WEB-13: 文書の構造", () => {
  it("lang=ja、h1 は1つ、header / main / footer がある", async () => {
    const { html } = await pageWith([hEvent("1")]);
    expect(html).toContain('<html lang="ja">');
    expect(html.match(/<h1>/g)).toHaveLength(1);
    for (const tag of ["<header>", "<main>", "<footer>"]) expect(html).toContain(tag);
    expect(html).not.toMatch(/<script|style=/);
  });
});

describe("WEB-16: 第三者由来の文字列はエスケープする", () => {
  it("タイトル・場所・ハッシュタグに含まれる HTML を無害化する", async () => {
    const { html } = await pageWith([
      hEvent("1", {
        title: '<script>alert("x")</script>',
        place: "<img src=x onerror=alert(1)>",
        hashTag: '"><b>',
      }),
    ]);
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("#&quot;&gt;&lt;b&gt;");
  });
});

describe("HLT-08: 公開ページには停止の警告を出さない", () => {
  it("最新の成功から3時間を超えていても警告の文言がない", async () => {
    const { html } = await pageWith([hEvent("1")], NOW + 5 * HOUR);
    expect(html).not.toMatch(/停止|警告/);
  });
});

describe("WEB-15: Functions の応答にもセキュリティヘッダを付ける", () => {
  it("一覧の通常時とエラー時", async () => {
    const ok = await respondPage(env.DB, NOW);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await env.DB.exec("DROP TABLE collection_runs");
    const failed = await respondPage(env.DB, NOW);
    for (const res of [ok, failed]) {
      for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(res.headers.get(name)).toBe(value);
    }
  });
});
