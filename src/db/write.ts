import { FAILURE_KINDS, type CollectionRun, type FailureKind, type HokurikuEvent } from "../domain/event.ts";
import { DAY_MS } from "../domain/time.ts";
import { readField, readNumber } from "./rows.ts";

/** STO-06 */
export const RETENTION_MS = 30 * DAY_MS;

/**
 * イベント一式を JSON の1パラメータで渡し、1文で upsert する（STO-01〜STO-04）。
 * 無料枠では1回の起動あたりの D1 クエリ数に上限があるため、行ごとに文を発行しない（C-09）。
 * first_seen_at は新規挿入のときだけ入り、更新では変えない。
 */
const UPSERT_EVENTS = `
INSERT INTO events (source, source_event_id, title, url, started_at, ended_at, place, address,
                    capacity, accepted, hash_tag, prefecture, first_seen_at, last_seen_at)
SELECT 'connpass',
       json_extract(value, '$.sourceEventId'),
       json_extract(value, '$.title'),
       json_extract(value, '$.url'),
       json_extract(value, '$.startedAt'),
       json_extract(value, '$.endedAt'),
       json_extract(value, '$.place'),
       json_extract(value, '$.address'),
       json_extract(value, '$.capacity'),
       json_extract(value, '$.accepted'),
       json_extract(value, '$.hashTag'),
       json_extract(value, '$.prefecture'),
       ?2,
       ?2
FROM json_each(?1) WHERE true
ON CONFLICT (source, source_event_id) DO UPDATE SET
  title = excluded.title,
  url = excluded.url,
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  place = excluded.place,
  address = excluded.address,
  capacity = excluded.capacity,
  accepted = excluded.accepted,
  hash_tag = excluded.hash_tag,
  prefecture = excluded.prefecture,
  last_seen_at = excluded.last_seen_at`;

const INSERT_RUN = `INSERT INTO collection_runs (started_at, finished_at, status, failure_kind, fetched_count)
  VALUES (?1, ?2, ?3, ?4, ?5)`;

/** 保存する項目を明示列挙する（allowlist）。HokurikuEvent 以外の値が紛れても D1 には届かない。 */
function toJsonRow(e: HokurikuEvent): Record<string, string | number | null> {
  return {
    sourceEventId: e.sourceEventId,
    title: e.title,
    url: e.url,
    startedAt: e.startedAt,
    endedAt: e.endedAt,
    place: e.place,
    address: e.address,
    capacity: e.capacity,
    accepted: e.accepted,
    hashTag: e.hashTag,
    prefecture: e.prefecture,
  };
}

/**
 * COL-08, COL-09, STO-06: 成功回の反映を1つのバッチで行う（全か無か）。
 * startedAt がその回の now であり、first_seen_at / last_seen_at になる。
 */
export async function commitSuccessfulRun(
  db: D1Database,
  run: { readonly startedAt: number; readonly finishedAt: number; readonly events: readonly HokurikuEvent[] },
): Promise<void> {
  const cutoff = run.startedAt - RETENTION_MS;
  await db.batch([
    db.prepare(UPSERT_EVENTS).bind(JSON.stringify(run.events.map(toJsonRow)), run.startedAt),
    db.prepare(INSERT_RUN).bind(run.startedAt, run.finishedAt, "success", null, run.events.length),
    db.prepare("DELETE FROM events WHERE ended_at < ?1").bind(cutoff),
    db.prepare("DELETE FROM collection_runs WHERE finished_at < ?1").bind(cutoff),
    // 復旧通知をまだ送っていない停止の記録は残す。消すと30日を超える停止のあとに復旧通知が出ない（HLT-03）。
    db
      .prepare(
        `DELETE FROM notifications AS n WHERE n.sent_at < ?1
           AND NOT (n.key LIKE 'stale:%'
                    AND NOT EXISTS (SELECT 1 FROM notifications AS r WHERE r.key = 'recovered:' || substr(n.key, 7)))`,
      )
      .bind(cutoff),
  ]);
}

/** COL-09: 失敗回の記録。events には触れない（COL-08）。 */
export async function recordFailedRun(
  db: D1Database,
  run: Extract<CollectionRun, { status: "failure" }>,
): Promise<void> {
  await db.prepare(INSERT_RUN).bind(run.startedAt, run.finishedAt, "failure", run.failureKind, run.fetchedCount).run();
}

export interface HealthFacts {
  readonly lastSuccessFinishedAt: number | null;
  readonly lastFailureKind: FailureKind | null;
  /** 停止通知を送ったが、まだ復旧通知を送っていないキー（HLT-03）。 */
  readonly unrecoveredStaleKeys: readonly string[];
}

function toFailureKind(value: unknown): FailureKind | null {
  return FAILURE_KINDS.find((k) => k === value) ?? null;
}

export async function readHealthFacts(db: D1Database): Promise<HealthFacts> {
  const [success, failure, unrecovered] = await db.batch([
    db.prepare(
      "SELECT finished_at FROM collection_runs WHERE status = 'success' ORDER BY finished_at DESC, id DESC LIMIT 1",
    ),
    db.prepare(
      "SELECT failure_kind FROM collection_runs WHERE status = 'failure' ORDER BY finished_at DESC, id DESC LIMIT 1",
    ),
    db.prepare(
      `SELECT key FROM notifications AS s
       WHERE s.key LIKE 'stale:%'
         AND NOT EXISTS (SELECT 1 FROM notifications AS r WHERE r.key = 'recovered:' || substr(s.key, 7))
       ORDER BY s.sent_at`,
    ),
  ]);
  return {
    lastSuccessFinishedAt: readNumber(success?.results[0], "finished_at"),
    lastFailureKind: toFailureKind(readField(failure?.results[0], "failure_kind")),
    unrecoveredStaleKeys: (unrecovered?.results ?? [])
      .map((r) => readField(r, "key"))
      .filter((k): k is string => typeof k === "string"),
  };
}

export async function hasNotification(db: D1Database, key: string): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS found FROM notifications WHERE key = ?1").bind(key).first();
  return row !== null;
}

/** HLT-04: 送信に成功してから呼ぶ。 */
export async function recordNotification(db: D1Database, key: string, sentAt: number): Promise<void> {
  await db.prepare("INSERT OR IGNORE INTO notifications (key, sent_at) VALUES (?1, ?2)").bind(key, sentAt).run();
}
