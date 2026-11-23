import type { StoredEvent } from "./event.ts";
import { DAY_MS } from "./time.ts";

/** WEB-01: 終了後この期間は「終了したイベント」に出す。 */
export const RECENTLY_ENDED_MS = 14 * DAY_MS;
/** RSS-04 */
export const FEED_LIMIT = 100;

export interface Listing {
  readonly fukui: readonly StoredEvent[];
  readonly ishikawaToyama: readonly StoredEvent[];
  readonly ended: readonly StoredEvent[];
}

const byIdAsc = (a: StoredEvent, b: StoredEvent): number =>
  a.sourceEventId.localeCompare(b.sourceEventId, "en", { numeric: true });

const byStartAsc = (a: StoredEvent, b: StoredEvent): number => a.startedAt - b.startedAt || byIdAsc(a, b);
const byStartDesc = (a: StoredEvent, b: StoredEvent): number => b.startedAt - a.startedAt || byIdAsc(a, b);

export function isUpcoming(event: StoredEvent, now: number): boolean {
  return event.endedAt > now;
}

export function isRecentlyEnded(event: StoredEvent, now: number): boolean {
  return event.endedAt <= now && event.endedAt > now - RECENTLY_ENDED_MS;
}

/** WEB-01, WEB-02: 表示対象の振り分けと並び順。入力は STO-05 で絞り込み済みのイベント。 */
export function buildListing(events: readonly StoredEvent[], now: number): Listing {
  const upcoming = events.filter((e) => isUpcoming(e, now)).toSorted(byStartAsc);
  return {
    fukui: upcoming.filter((e) => e.prefecture === "fukui"),
    ishikawaToyama: upcoming.filter((e) => e.prefecture !== "fukui"),
    ended: events.filter((e) => isRecentlyEnded(e, now)).toSorted(byStartDesc),
  };
}

/** RSS-04: これから開催されるもの（3県すべて）を、初めて保存した順の新しい順に最大100件。 */
export function selectFeedEvents(events: readonly StoredEvent[], now: number): StoredEvent[] {
  return events
    .filter((e) => isUpcoming(e, now))
    .toSorted((a, b) => b.firstSeenAt - a.firstSeenAt || byIdAsc(a, b))
    .slice(0, FEED_LIMIT);
}
