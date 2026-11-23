import type { StoredEvent } from "../domain/event.ts";
import { RECENTLY_ENDED_MS } from "../domain/listing.ts";
import { EVENT_COLUMNS, type EventRow, readField, readNumber, toStoredEvent } from "./rows.ts";

/**
 * 読み取り専用のクエリ。公開面（Pages）が import してよいのはこのファイルだけ
 * （lint: hokuriku/import-boundaries）。
 */

export interface Snapshot {
  /** STO-05: その県を最後に取得できた時点で見えていたイベントのうち、終了から14日以内のもの。 */
  readonly events: readonly StoredEvent[];
  /** WEB-10: 最新の成功回の終了時刻。成功回がなければ null。 */
  readonly lastSuccessFinishedAt: number | null;
}

const LATEST_SUCCESS = `SELECT started_at, finished_at FROM collection_runs
  WHERE status = 'success' ORDER BY finished_at DESC, id DESC LIMIT 1`;

/** 一覧と RSS の材料を1回のバッチで読む（読み取りの一貫性と、クエリ数の節約のため）。 */
export async function readSnapshot(db: D1Database, now: number): Promise<Snapshot> {
  const [latest, events] = await db.batch([
    db.prepare(LATEST_SUCCESS),
    db
      .prepare(
        `SELECT ${EVENT_COLUMNS} FROM events
         WHERE last_seen_at = (SELECT p.synced_at FROM prefecture_syncs AS p WHERE p.prefecture = events.prefecture)
           AND ended_at > ?1`,
      )
      .bind(now - RECENTLY_ENDED_MS),
  ]);
  const rows = (events?.results ?? []).filter(isEventRow);
  return {
    events: rows.map(toStoredEvent).filter((e): e is StoredEvent => e !== undefined),
    lastSuccessFinishedAt: readNumber(latest?.results[0], "finished_at"),
  };
}

const isText = (v: unknown): boolean => typeof v === "string";
const isTextOrNull = (v: unknown): boolean => v === null || typeof v === "string";
const isNum = (v: unknown): boolean => typeof v === "number";
const isNumOrNull = (v: unknown): boolean => v === null || typeof v === "number";

const ROW_SHAPE: Readonly<Record<keyof EventRow, (v: unknown) => boolean>> = {
  source: isText,
  source_event_id: isText,
  title: isText,
  url: isText,
  started_at: isNum,
  ended_at: isNum,
  place: isTextOrNull,
  address: isTextOrNull,
  capacity: isNumOrNull,
  accepted: isNum,
  hash_tag: isTextOrNull,
  prefecture: isText,
  first_seen_at: isNum,
  last_seen_at: isNum,
};

function isEventRow(value: unknown): value is EventRow {
  return Object.entries(ROW_SHAPE).every(([key, check]) => check(readField(value, key)));
}
