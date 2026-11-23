import { describe, expect, it } from "vitest";
import {
  STALE_AFTER_MS,
  isStale,
  recoveredMessage,
  recoveredNotificationKey,
  staleMessage,
  staleNotificationKey,
} from "./health.ts";

const NOW = Date.parse("2026-11-23T12:00:00+09:00");

describe("HLT-01: 停止中の判定", () => {
  it("最新の成功からちょうど3時間なら停止中ではない", () => {
    expect(isStale(NOW - STALE_AFTER_MS, NOW)).toBe(false);
  });

  it("3時間を1ミリ秒でも超えたら停止中", () => {
    expect(isStale(NOW - STALE_AFTER_MS - 1, NOW)).toBe(true);
  });

  it("成功回が一度もなければ停止中", () => {
    expect(isStale(null, NOW)).toBe(true);
  });
});

describe("HLT-02: 1回の停止を表すキー", () => {
  it("最新の成功回が同じなら同じキー、復旧のキーと対応する", () => {
    expect(staleNotificationKey(123)).toBe("stale:123");
    expect(staleNotificationKey(null)).toBe("stale:never");
    expect(recoveredNotificationKey("stale:123")).toBe("recovered:123");
  });
});

describe("HLT-06: 通知の本文は日時と失敗の種別だけ", () => {
  it("停止通知", () => {
    expect(staleMessage(Date.parse("2026-11-23T06:17:05+09:00"), "rate_limited")).toBe(
      "⚠️ 北陸ITイベント: 収集が停止しています。\n最終成功: 2026-11-23 06:17（JST）\n直近の失敗の種別: rate_limited",
    );
    expect(staleMessage(null, null)).toContain("最終成功: まだありません");
  });

  it("復旧通知", () => {
    expect(recoveredMessage(Date.parse("2026-11-23T09:17:00+09:00"))).toBe(
      "✅ 北陸ITイベント: 収集が復旧しました。\n最終成功: 2026-11-23 09:17（JST）",
    );
  });
});
