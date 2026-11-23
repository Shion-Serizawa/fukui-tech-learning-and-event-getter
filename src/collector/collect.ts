import { PREFECTURES, type CollectionRun, type FailureKind, type HokurikuEvent } from "../domain/event.ts";
import { type ConnpassDeps, openConnpassSession } from "../connpass/index.ts";
import { commitPrefecture, recordRun } from "../db/write.ts";
import { logError, logInfo } from "../log.ts";

export interface CollectDeps extends ConnpassDeps {
  readonly db: D1Database;
}

/** COL-12: すでにこの回で保存したイベントは、後の県の保存から除く（先に処理した県を採る）。 */
function excludeSeen(events: readonly HokurikuEvent[], seen: Set<string>): HokurikuEvent[] {
  const out: HokurikuEvent[] = [];
  for (const e of events) {
    if (seen.has(e.sourceEventId)) continue;
    seen.add(e.sourceEventId);
    out.push(e);
  }
  return out;
}

/**
 * 収集回を1回実行する（COL-02〜COL-09, COL-12）。now はその回の開始時刻で、
 * first_seen_at / last_seen_at / prefecture_syncs.synced_at になる。
 * 県ごとに取得して保存し（COL-08）、失敗したらその回はそこで止める（COL-07。残りの県は次の回）。
 * 例外は投げない。結果は collection_runs に記録し、戻り値でも返す。
 */
export async function runCollection(deps: CollectDeps, now: number): Promise<CollectionRun> {
  const session = openConnpassSession(deps, now);
  const seen = new Set<string>();
  let fetchedCount = 0;
  let failure: FailureKind | null = null;

  for (const prefecture of PREFECTURES) {
    const result = await session.fetchPrefecture(prefecture);
    fetchedCount += result.fetchedCount;
    if (!result.ok) {
      failure = result.kind;
      break;
    }
    const events = excludeSeen(result.events, seen);
    try {
      await commitPrefecture(deps.db, { prefecture, syncedAt: now, events });
    } catch {
      failure = "storage_error";
      break;
    }
    logInfo("collect.prefecture_saved", { prefecture, count: events.length });
  }

  const finishedAt = deps.clock();
  const run: CollectionRun =
    failure === null
      ? { status: "success", startedAt: now, finishedAt, fetchedCount }
      : { status: "failure", startedAt: now, finishedAt, fetchedCount, failureKind: failure };

  if (run.status === "success") {
    logInfo("collect.succeeded", { count: fetchedCount, durationMs: finishedAt - now });
  } else {
    logError("collect.failed", { kind: run.failureKind, count: fetchedCount, durationMs: finishedAt - now });
  }
  try {
    await recordRun(deps.db, run);
  } catch {
    logError("collect.record_failed", { kind: "storage_error" });
  }
  return run;
}
