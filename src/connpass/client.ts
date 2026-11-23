import { PREFECTURES, type FailureKind, type HokurikuEvent, type Prefecture } from "../domain/event.ts";
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
export const MAX_PAGES_PER_PREFECTURE = 10;
/** COL-05: 1秒1リクエスト（C-04）に余裕を持たせる。 */
export const REQUEST_INTERVAL_MS = 1100;
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

export type FetchResult =
  | { readonly ok: true; readonly events: readonly HokurikuEvent[] }
  | { readonly ok: false; readonly kind: FailureKind; readonly fetchedCount: number };

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
 * COL-02〜COL-07, COL-14: 北陸3県のイベントを県ごと・ページごとに取得する。
 * 1つでも失敗したらその時点で止め、失敗の種別を返す（429 でも再試行しない）。
 */
export async function fetchHokurikuEvents(deps: ConnpassDeps, now: number): Promise<FetchResult> {
  const months = monthsToQuery(now);
  const events: HokurikuEvent[] = [];
  let fetchedCount = 0;
  let isFirstRequest = true;

  for (const prefecture of PREFECTURES) {
    let start = 1;
    for (let page = 1; ; page++) {
      if (page > MAX_PAGES_PER_PREFECTURE) {
        logError("connpass.too_many_pages", { prefecture, page, kind: "too_many_pages" });
        return { ok: false, kind: "too_many_pages", fetchedCount };
      }
      if (!isFirstRequest) await deps.sleep(REQUEST_INTERVAL_MS);
      isFirstRequest = false;

      const outcome = await requestPage(deps, prefecture, months, start, page);
      if (!outcome.ok) return { ok: false, kind: outcome.kind, fetchedCount };
      events.push(...outcome.events);
      fetchedCount += outcome.rawCount;
      if (outcome.done) break;
      start += outcome.rawCount;
    }
  }
  return { ok: true, events };
}
