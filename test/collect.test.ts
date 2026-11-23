import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCollection } from "../src/collector/collect.ts";
import { connpassEvent, connpassPage } from "../src/connpass/fixtures/events.ts";
import { readSnapshot } from "../src/db/read.ts";
import { DAY, HOUR, NOW, type Scripted, fakeConnpassDeps, jsonResponse, parseLogLine } from "./fakes.ts";
import { resetDatabase } from "./reset-db.ts";

const iso = (ms: number): string => new Date(ms).toISOString();
const endedAt = (daysAgo: number) => ({
  started_at: iso(NOW - daysAgo * DAY - HOUR),
  ended_at: iso(NOW - daysAgo * DAY),
});
const page = (...events: Record<string, unknown>[]): Response => jsonResponse(connpassPage(events));

async function collect(now: number, script: readonly Scripted[]) {
  return runCollection({ ...fakeConnpassDeps(script, now), db: env.DB }, now);
}

async function allRows<T>(sql: string): Promise<T[]> {
  return (await env.DB.prepare(sql).all<T>()).results;
}

beforeEach(async () => {
  await resetDatabase(env.DB);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("COL-08 / COL-07: 県ごとに保存し、失敗したらその回はそこで止める", () => {
  it("2県目で失敗しても1県目の分は保存し、3県目は取りに行かない", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const deps = {
      ...fakeConnpassDeps([page(connpassEvent({ id: 1 })), new Response("x", { status: 429 })], NOW),
      db: env.DB,
    };
    const run = await runCollection(deps, NOW);

    expect(run).toMatchObject({ status: "failure", failureKind: "rate_limited", fetchedCount: 1 });
    expect(deps.requests.map((r) => r.url.searchParams.get("prefecture"))).toEqual(["fukui", "ishikawa"]);
    expect(await allRows("SELECT source_event_id, prefecture FROM events")).toEqual([
      { source_event_id: "1", prefecture: "fukui" },
    ]);
    expect(await allRows("SELECT prefecture, synced_at FROM prefecture_syncs")).toEqual([
      { prefecture: "fukui", synced_at: NOW },
    ]);
    const snapshot = await readSnapshot(env.DB, NOW);
    expect(snapshot.events.map((e) => e.sourceEventId)).toEqual(["1"]);
    expect(snapshot.lastSuccessFinishedAt).toBeNull();
  });

  it("3県とも保存できた回だけを成功として記録する", async () => {
    const run = await collect(NOW, [page(connpassEvent()), page(), page(connpassEvent())]);
    expect(run.status).toBe("success");
    expect(await allRows("SELECT prefecture FROM prefecture_syncs ORDER BY prefecture")).toEqual([
      { prefecture: "fukui" },
      { prefecture: "ishikawa" },
      { prefecture: "toyama" },
    ]);
  });

  it("D1 への書き込みに失敗したら storage_error として記録し、残りの県は取りに行かない", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await env.DB.exec("DROP TABLE events");
    const deps = { ...fakeConnpassDeps([page(connpassEvent()), page(), page()], NOW), db: env.DB };
    const run = await runCollection(deps, NOW);
    expect(run).toMatchObject({ status: "failure", failureKind: "storage_error" });
    expect(deps.requests).toHaveLength(1);
    expect(await allRows("SELECT status, failure_kind FROM collection_runs")).toEqual([
      { status: "failure", failure_kind: "storage_error" },
    ]);
  });
});

describe("COL-09 / HLT-07: 収集回の記録", () => {
  it("成功回を1行記録する", async () => {
    await collect(NOW, [page(connpassEvent(), connpassEvent()), page(), page(connpassEvent())]);
    expect(await allRows("SELECT started_at, status, failure_kind, fetched_count FROM collection_runs")).toEqual([
      { started_at: NOW, status: "success", failure_kind: null, fetched_count: 3 },
    ]);
  });

  it("失敗回を種別つきで1行記録し、エラーログを出す", async () => {
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((line: string) => errors.push(line));
    await collect(NOW, [new Response("slow", { status: 429 })]);
    expect(await allRows("SELECT status, failure_kind FROM collection_runs")).toEqual([
      { status: "failure", failure_kind: "rate_limited" },
    ]);
    expect(errors.map((l) => parseLogLine(l)["event"])).toContain("collect.failed");
  });
});

describe("COL-12: 複数の県で返ったイベント", () => {
  it("先に処理した県（福井）として1行だけ保存する", async () => {
    await collect(NOW, [page(connpassEvent({ id: 5 })), page(connpassEvent({ id: 5 })), page()]);
    expect(await allRows("SELECT source_event_id, prefecture FROM events")).toEqual([
      { source_event_id: "5", prefecture: "fukui" },
    ]);
  });
});

describe("COL-13: 中止のイベント", () => {
  it("保存しない", async () => {
    await collect(NOW, [
      page(connpassEvent({ id: 1, open_status: "cancelled" }), connpassEvent({ id: 2 })),
      page(),
      page(),
    ]);
    expect(await allRows("SELECT source_event_id FROM events")).toEqual([{ source_event_id: "2" }]);
  });
});

describe("STO-01 / STO-02 / STO-03 / STO-04: 一意性と更新", () => {
  it("同じイベントは1行のまま、内容と last_seen_at は更新し、first_seen_at は保つ", async () => {
    await collect(NOW, [page(connpassEvent({ id: 1, title: "旧タイトル" })), page(), page()]);
    const later = NOW + HOUR;
    await collect(later, [
      page(connpassEvent({ id: 1, title: "新タイトル" }), connpassEvent({ id: 2 })),
      page(),
      page(),
    ]);

    expect(
      await allRows("SELECT source_event_id, title, first_seen_at, last_seen_at FROM events ORDER BY source_event_id"),
    ).toEqual([
      { source_event_id: "1", title: "新タイトル", first_seen_at: NOW, last_seen_at: later },
      { source_event_id: "2", title: "福井 IT 勉強会 #2", first_seen_at: later, last_seen_at: later },
    ]);
  });
});

describe("STO-05: その県を最後に取得できた時点で見えていたイベントだけを出す", () => {
  it("ある県の取得に失敗した回のあとは、その県は前回取得できたときの内容を出す", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await collect(NOW, [
      page(connpassEvent({ id: 1 })),
      page(connpassEvent({ id: 2 }), connpassEvent({ id: 3 })),
      page(),
    ]);
    const later = NOW + 3 * HOUR;
    await collect(later, [page(connpassEvent({ id: 4 })), new Response("x", { status: 429 })]);

    const snapshot = await readSnapshot(env.DB, later);
    expect(snapshot.events.map((e) => e.sourceEventId).toSorted()).toEqual(["2", "3", "4"]);
  });

  it("取得できなくなったイベントは行を残すが、一覧の材料に含めない", async () => {
    await collect(NOW, [page(connpassEvent({ id: 1 }), connpassEvent({ id: 2 })), page(), page()]);
    const later = NOW + HOUR;
    await collect(later, [page(connpassEvent({ id: 1 })), page(), page()]);

    const snapshot = await readSnapshot(env.DB, later);
    expect(snapshot.events.map((e) => e.sourceEventId)).toEqual(["1"]);
    expect(await allRows("SELECT COUNT(*) AS n FROM events")).toEqual([{ n: 2 }]);
  });

  it("失敗回は最新の成功回を変えない（前回の成功の内容が出続ける）", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await collect(NOW, [page(connpassEvent({ id: 1 })), page(), page()]);
    await collect(NOW + HOUR, [new Response("x", { status: 500 })]);
    const snapshot = await readSnapshot(env.DB, NOW + HOUR);
    expect(snapshot.events.map((e) => e.sourceEventId)).toEqual(["1"]);
    expect(snapshot.lastSuccessFinishedAt).toBeGreaterThanOrEqual(NOW);
    expect(snapshot.lastSuccessFinishedAt).toBeLessThan(NOW + HOUR);
  });
});

describe("STO-06: 古いデータの掃除", () => {
  it("終了から30日を超えたイベントと、30日より古い収集回・通知の記録を消す", async () => {
    await env.DB.prepare(
      `INSERT INTO notifications (key, sent_at) VALUES
         ('stale:old', ?1), ('recovered:old', ?1), ('stale:unrecovered', ?1), ('stale:new', ?2)`,
    )
      .bind(NOW - 31 * DAY, NOW - 29 * DAY)
      .run();
    await env.DB.prepare(
      "INSERT INTO collection_runs (started_at, finished_at, status, failure_kind, fetched_count) VALUES (?1, ?1, 'failure', 'http_error', 0)",
    )
      .bind(NOW - 31 * DAY)
      .run();

    await collect(NOW, [
      page(connpassEvent({ id: 31, ...endedAt(31) }), connpassEvent({ id: 29, ...endedAt(29) })),
      page(),
      page(),
    ]);

    expect(await allRows("SELECT source_event_id FROM events")).toEqual([{ source_event_id: "29" }]);
    expect(await allRows("SELECT status FROM collection_runs")).toEqual([{ status: "success" }]);
    // 復旧済みの古い記録は消し、復旧通知をまだ送っていない停止の記録は残す（HLT-03）
    expect(await allRows("SELECT key FROM notifications ORDER BY key")).toEqual([
      { key: "stale:new" },
      { key: "stale:unrecovered" },
    ]);
  });
});
