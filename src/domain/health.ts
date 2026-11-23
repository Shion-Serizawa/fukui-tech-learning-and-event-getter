import type { FailureKind } from "./event.ts";
import { HOUR_MS, formatJstMinute } from "./time.ts";

/** HLT-01: 最新の成功からこれを超えたら停止中。1時間ごとの収集が3回続けて失敗した状態。 */
export const STALE_AFTER_MS = 3 * HOUR_MS;

export function isStale(lastSuccessFinishedAt: number | null, now: number): boolean {
  return lastSuccessFinishedAt === null || now - lastSuccessFinishedAt > STALE_AFTER_MS;
}

/** HLT-02: 1回の停止を表すキー。停止が続く間は最新の成功回が変わらないので、キーも変わらない。 */
export function staleNotificationKey(lastSuccessFinishedAt: number | null): string {
  return `stale:${lastSuccessFinishedAt === null ? "never" : String(lastSuccessFinishedAt)}`;
}

export function recoveredNotificationKey(staleKey: string): string {
  return `recovered:${staleKey.slice("stale:".length)}`;
}

/** HLT-06: 本文は日時と失敗の種別だけ。イベントの情報は含めない。 */
export function staleMessage(lastSuccessFinishedAt: number | null, lastFailureKind: FailureKind | null): string {
  const last = lastSuccessFinishedAt === null ? "まだありません" : `${formatJstMinute(lastSuccessFinishedAt)}（JST）`;
  const kind = lastFailureKind ?? "不明";
  return `⚠️ 北陸ITイベント: 収集が停止しています。\n最終成功: ${last}\n直近の失敗の種別: ${kind}`;
}

export function recoveredMessage(lastSuccessFinishedAt: number): string {
  return `✅ 北陸ITイベント: 収集が復旧しました。\n最終成功: ${formatJstMinute(lastSuccessFinishedAt)}（JST）`;
}
