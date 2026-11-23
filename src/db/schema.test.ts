import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

async function columns(table: string): Promise<string[]> {
  const { results } = await env.DB.prepare(`SELECT name FROM pragma_table_info(?) ORDER BY cid`)
    .bind(table)
    .all<{ name: string }>();
  return results.map((r) => r.name);
}

describe("D1 スキーマ（恒久的な回帰テスト）", () => {
  it("STO-07: events の列は許可した列だけで、主催者に関する列を持たない（C-14）", async () => {
    expect(await columns("events")).toEqual([
      "source",
      "source_event_id",
      "title",
      "url",
      "started_at",
      "ended_at",
      "place",
      "address",
      "capacity",
      "accepted",
      "hash_tag",
      "prefecture",
      "first_seen_at",
      "last_seen_at",
    ]);
    for (const table of ["events", "collection_runs", "notifications"]) {
      expect((await columns(table)).filter((c) => c.includes("owner"))).toEqual([]);
    }
  });

  it("STO-08: 北陸3県以外の prefecture は保存できない", async () => {
    const insert = env.DB.prepare(
      `INSERT INTO events (source, source_event_id, title, url, started_at, ended_at, accepted, prefecture, first_seen_at, last_seen_at)
       VALUES ('connpass', '1', 't', 'https://connpass.com/event/1/', 0, 0, 0, ?, 0, 0)`,
    );
    await expect(insert.bind("tokyo").run()).rejects.toThrow(/CHECK constraint failed/);
    await expect(insert.bind("fukui").run()).resolves.toBeDefined();
  });

  it("STO-08: 失敗した収集回には失敗の種別が必ず付き、成功した回には付かない", async () => {
    const insert = env.DB.prepare(
      `INSERT INTO collection_runs (started_at, finished_at, status, failure_kind, fetched_count) VALUES (0, 1, ?, ?, 0)`,
    );
    await expect(insert.bind("failure", null).run()).rejects.toThrow(/CHECK constraint failed/);
    await expect(insert.bind("success", "http_error").run()).rejects.toThrow(/CHECK constraint failed/);
    await expect(insert.bind("failure", "rate_limited").run()).resolves.toBeDefined();
  });
});
