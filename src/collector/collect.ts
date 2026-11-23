import type { CollectionRun, HokurikuEvent } from "../domain/event.ts";
import { type ConnpassDeps, fetchHokurikuEvents } from "../connpass/index.ts";
import { commitSuccessfulRun, recordFailedRun } from "../db/write.ts";
import { logError, logInfo } from "../log.ts";

export interface CollectDeps extends ConnpassDeps {
  readonly db: D1Database;
}

/** COL-12: 同じイベントが複数の県で返ったら、先に処理した県（fukui → ishikawa → toyama）を採る。 */
export function dedupeEvents(events: readonly HokurikuEvent[]): HokurikuEvent[] {
  const seen = new Set<string>();
  const out: HokurikuEvent[] = [];
  for (const e of events) {
    if (seen.has(e.sourceEventId)) continue;
    seen.add(e.sourceEventId);
    out.push(e);
  }
  return out;
}

async function recordFailure(
  deps: CollectDeps,
  run: Extract<CollectionRun, { status: "failure" }>,
): Promise<CollectionRun> {
  logError("collect.failed", {
    kind: run.failureKind,
    count: run.fetchedCount,
    durationMs: run.finishedAt - run.startedAt,
  });
  try {
    await recordFailedRun(deps.db, run);
  } catch {
    logError("collect.record_failed", { kind: "storage_error" });
  }
  return run;
}

/**
 * 収集回を1回実行する（COL-02〜COL-09）。now はその回の開始時刻で、first_seen_at / last_seen_at になる。
 * 例外は投げない。結果は collection_runs に記録し、戻り値でも返す。
 */
export async function runCollection(deps: CollectDeps, now: number): Promise<CollectionRun> {
  const fetched = await fetchHokurikuEvents(deps, now);
  if (!fetched.ok) {
    return recordFailure(deps, {
      status: "failure",
      startedAt: now,
      finishedAt: deps.clock(),
      fetchedCount: fetched.fetchedCount,
      failureKind: fetched.kind,
    });
  }

  const events = dedupeEvents(fetched.events);
  const finishedAt = deps.clock();
  try {
    await commitSuccessfulRun(deps.db, { startedAt: now, finishedAt, events });
  } catch {
    return recordFailure(deps, {
      status: "failure",
      startedAt: now,
      finishedAt: deps.clock(),
      fetchedCount: events.length,
      failureKind: "storage_error",
    });
  }
  logInfo("collect.succeeded", { count: events.length, durationMs: finishedAt - now });
  return { status: "success", startedAt: now, finishedAt, fetchedCount: events.length };
}
