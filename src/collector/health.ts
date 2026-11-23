import {
  isStale,
  recoveredMessage,
  recoveredNotificationKey,
  staleMessage,
  staleNotificationKey,
} from "../domain/health.ts";
import { hasNotification, readHealthFacts, recordNotification } from "../db/write.ts";
import { logError } from "../log.ts";
import { type DiscordDeps, postToDiscord } from "../notify/discord.ts";

export interface HealthDeps extends DiscordDeps {
  readonly db: D1Database;
}

/**
 * HLT-01〜HLT-04: 収集回の後に呼ぶ。停止中に入ったら停止通知を1通、復旧したら復旧通知を1通送る。
 * 送れたときだけ送信済みとして記録する（送れなければ次の回で再送される）。例外は投げない。
 */
export async function checkHealthAndNotify(deps: HealthDeps, now: number): Promise<void> {
  try {
    const facts = await readHealthFacts(deps.db);

    if (isStale(facts.lastSuccessFinishedAt, now)) {
      const key = staleNotificationKey(facts.lastSuccessFinishedAt);
      if (await hasNotification(deps.db, key)) return;
      if (await postToDiscord(deps, staleMessage(facts.lastSuccessFinishedAt, facts.lastFailureKind))) {
        await recordNotification(deps.db, key, now);
      }
      return;
    }

    if (facts.lastSuccessFinishedAt === null || facts.unrecoveredStaleKeys.length === 0) return;
    if (await postToDiscord(deps, recoveredMessage(facts.lastSuccessFinishedAt))) {
      for (const key of facts.unrecoveredStaleKeys) {
        await recordNotification(deps.db, recoveredNotificationKey(key), now);
      }
    }
  } catch {
    logError("health.check_failed", { kind: "storage_error" });
  }
}
