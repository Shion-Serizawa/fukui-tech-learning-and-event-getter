import { PREFECTURES, type Prefecture, type StoredEvent } from "../domain/event.ts";

/** D1 の events の行。snake_case はこのファイルと SQL の中にだけ置く。 */
export interface EventRow {
  readonly source: string;
  readonly source_event_id: string;
  readonly title: string;
  readonly url: string;
  readonly started_at: number;
  readonly ended_at: number;
  readonly place: string | null;
  readonly address: string | null;
  readonly capacity: number | null;
  readonly accepted: number;
  readonly hash_tag: string | null;
  readonly prefecture: string;
  readonly first_seen_at: number;
  readonly last_seen_at: number;
}

export const EVENT_COLUMNS =
  "source, source_event_id, title, url, started_at, ended_at, place, address, capacity, accepted, hash_tag, prefecture, first_seen_at, last_seen_at";

function toPrefecture(value: string): Prefecture | undefined {
  return PREFECTURES.find((p) => p === value);
}

/** CHECK 制約で守られている値を、型の上でも確かめてから渡す。合わない行は捨てる。 */
export function toStoredEvent(row: EventRow): StoredEvent | undefined {
  const prefecture = toPrefecture(row.prefecture);
  if (prefecture === undefined || row.source !== "connpass") return undefined;
  return {
    source: "connpass",
    sourceEventId: row.source_event_id,
    title: row.title,
    url: row.url,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    place: row.place,
    address: row.address,
    capacity: row.capacity,
    accepted: row.accepted,
    hashTag: row.hash_tag,
    prefecture,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  };
}

/** D1 の結果の1行から値を取り出す。型は呼び出し側で確かめる。 */
export function readField(row: unknown, key: string): unknown {
  if (typeof row !== "object" || row === null) return undefined;
  const value: unknown = Reflect.get(row, key);
  return value;
}

export function readNumber(row: unknown, key: string): number | null {
  const value = readField(row, key);
  return typeof value === "number" ? value : null;
}
