import type { FailureKind, HokurikuEvent, Prefecture } from "../domain/event.ts";
import type { Fetcher, TimeoutSignal } from "../domain/io.ts";
import { monthsToQuery } from "../domain/time.ts";
import { logError, logInfo } from "../log.ts";
import { parseEventsPage } from "./parse.ts";

/** COL-06: 送り先はここだけ。 */
export const CONNPASS_EVENTS_ENDPOINT = "https://connpass.com/api/v2/events/";
/**
 * COL-06: connpass は User-Agent のないリクエストに 403 を返す（2026-11-24 に確認）。
 * Workers の fetch は User-Agent を付けないので、明示する。連絡先として公開ページの URL を入れる。
 */
export const USER_AGENT = "hokuriku-it-events/1.0 (+https://hokuriku-it-events.pages.dev)";
/** COL-04 */
export const PAGE_SIZE = 100;
/** COL-04: 1日100回の制限（C-04）があるので低く保つ。 */
export const MAX_PAGES_PER_PREFECTURE = 3;
/** COL-05: 公式の制限は12秒に1回（C-04）。余裕を持たせる。 */
export const REQUEST_INTERVAL_MS = 13_000;
/** COL-14 */
export const REQUEST_TIMEOUT_MS = 10_000;

export interface ConnpassDeps {
  readonly fetch: Fetcher;
  readonly apiKey: string;
  readonly sleep: (ms: number) => Promise<void>;
  readonly clock: () => number;
  /** COL-14。テストでは偽の信号を渡す。 */
  readonly timeoutSignal: TimeoutSignal;
}

export type PrefectureResult =
  | { readonly ok: true; readonly events: readonly HokurikuEvent[]; readonly fetchedCount: number }
  | { readonly ok: false; readonly kind: FailureKind; readonly fetchedCount: number };

/** 1回の収集の間だけ使う。リクエストの間隔（COL-05）をこの中で管理する。 */
export interface ConnpassSession {
  fetchPrefecture(prefecture: Prefecture): Promise<PrefectureResult>;
}

type PageOutcome =
  | { readonly ok: true; readonly events: readonly HokurikuEvent[]; readonly rawCount: number; readonly done: boolean }
  | { readonly ok: false; readonly kind: FailureKind };

function buildUrl(prefecture: Prefecture, months: readonly string[], start: number): string {
  const params = new URLSearchParams({
    prefecture,
    ym: months.join(","),
    count: String(PAGE_SIZE),
    start: String(start),
    order: "2",
  });
  return `${CONNPASS_EVENTS_ENDPOINT}?${params.toString()}`;
}

async function requestPage(
  deps: ConnpassDeps,
  prefecture: Prefecture,
  months: readonly string[],
  start: number,
  page: number,
): Promise<PageOutcome> {
  const began = deps.clock();
  let res: Response;
  try {
    res = await deps.fetch(buildUrl(prefecture, months, start), {
      method: "GET",
      headers: { "X-API-Key": deps.apiKey, Accept: "application/json", "User-Agent": USER_AGENT },
      signal: deps.timeoutSignal(REQUEST_TIMEOUT_MS),
    });
  } catch {
    logError("connpass.request_failed", { prefecture, page, kind: "network_error", durationMs: deps.clock() - began });
    return { ok: false, kind: "network_error" };
  }

  const status = res.status;
  if (!res.ok) {
    await res.body?.cancel();
    const kind: FailureKind = status === 429 ? "rate_limited" : "http_error";
    logError("connpass.request_failed", { prefecture, page, status, kind, durationMs: deps.clock() - began });
    return { ok: false, kind };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    logError("connpass.request_failed", { prefecture, page, status, kind: "invalid_response" });
    return { ok: false, kind: "invalid_response" };
  }

  const parsed = parseEventsPage(body, prefecture);
  if (parsed === null || parsed.resultsStart !== start) {
    logError("connpass.request_failed", { prefecture, page, status, kind: "invalid_response" });
    return { ok: false, kind: "invalid_response" };
  }

  logInfo("connpass.request", {
    prefecture,
    page,
    status,
    count: parsed.rawCount,
    durationMs: deps.clock() - began,
  });
  const done = parsed.rawCount < PAGE_SIZE || start + parsed.rawCount > parsed.resultsAvailable;
  return { ok: true, events: parsed.events, rawCount: parsed.rawCount, done };
}

/**
 * COL-03〜COL-07, COL-14: 1回の収集のためのセッションを開く。
 * 県ごとに全ページを取得する。失敗したらその県の取得をそこで止め、種別を返す（再試行しない）。
 * 2回目以降のリクエストの前には毎回 REQUEST_INTERVAL_MS 待つ（最初のリクエストの前は待たない）。
 */
export function openConnpassSession(deps: ConnpassDeps, now: number): ConnpassSession {
  const months = monthsToQuery(now);
  let hasRequested = false;
  const pace = async (): Promise<void> => {
    if (hasRequested) await deps.sleep(REQUEST_INTERVAL_MS);
    hasRequested = true;
  };

  return {
    async fetchPrefecture(prefecture) {
      const events: HokurikuEvent[] = [];
      let fetchedCount = 0;
      let start = 1;
      for (let page = 1; ; page++) {
        if (page > MAX_PAGES_PER_PREFECTURE) {
          logError("connpass.too_many_pages", { prefecture, page, kind: "too_many_pages" });
          return { ok: false, kind: "too_many_pages", fetchedCount };
        }
        await pace();
        const outcome = await requestPage(deps, prefecture, months, start, page);
        if (!outcome.ok) return { ok: false, kind: outcome.kind, fetchedCount };
        events.push(...outcome.events);
        fetchedCount += outcome.rawCount;
        if (outcome.done) return { ok: true, events, fetchedCount };
        start += outcome.rawCount;
      }
    },
  };
}
