import { describe, expect, it } from "vitest";
import type { StoredEvent } from "./event.ts";
import { FEED_LIMIT, RECENTLY_ENDED_MS, buildListing, selectFeedEvents } from "./listing.ts";

const NOW = Date.parse("2026-11-23T12:00:00+09:00");
const HOUR = 60 * 60 * 1000;

function ev(id: string, partial: Partial<StoredEvent> = {}): StoredEvent {
  return {
    source: "connpass",
    sourceEventId: id,
    title: `event ${id}`,
    url: `https://connpass.com/event/${id}/`,
    startedAt: NOW + HOUR,
    endedAt: NOW + 2 * HOUR,
    place: null,
    address: null,
    capacity: null,
    accepted: 0,
    hashTag: null,
    prefecture: "fukui",
    firstSeenAt: NOW - HOUR,
    lastSeenAt: NOW,
    ...partial,
  };
}

const ids = (events: readonly StoredEvent[]): string[] => events.map((e) => e.sourceEventId);

describe("WEB-01: 表示対象の期間", () => {
  it("開催中（開始済み・未終了）はこれからに入る", () => {
    const listing = buildListing([ev("1", { startedAt: NOW - HOUR, endedAt: NOW + HOUR })], NOW);
    expect(ids(listing.fukui)).toEqual(["1"]);
  });

  it("ended_at がちょうど now なら終了の節に入る", () => {
    const listing = buildListing([ev("1", { startedAt: NOW - HOUR, endedAt: NOW })], NOW);
    expect(ids(listing.fukui)).toEqual([]);
    expect(ids(listing.ended)).toEqual(["1"]);
  });

  it("終了からちょうど14日のものは出さない。14日未満なら出す", () => {
    const listing = buildListing(
      [
        ev("old", { startedAt: NOW - RECENTLY_ENDED_MS - HOUR, endedAt: NOW - RECENTLY_ENDED_MS }),
        ev("recent", { startedAt: NOW - RECENTLY_ENDED_MS - HOUR, endedAt: NOW - RECENTLY_ENDED_MS + 1 }),
      ],
      NOW,
    );
    expect(ids(listing.ended)).toEqual(["recent"]);
  });
});

describe("WEB-02: 節と並び順", () => {
  it("福井と石川・富山に分け、これからは開始の昇順、同時刻は ID の昇順", () => {
    const listing = buildListing(
      [
        ev("30", { startedAt: NOW + 3 * HOUR, endedAt: NOW + 4 * HOUR }),
        ev("10", { startedAt: NOW + HOUR, endedAt: NOW + 4 * HOUR }),
        ev("9", { startedAt: NOW + HOUR, endedAt: NOW + 4 * HOUR }),
        ev("20", { prefecture: "toyama", startedAt: NOW + 2 * HOUR, endedAt: NOW + 4 * HOUR }),
        ev("21", { prefecture: "ishikawa", startedAt: NOW + HOUR, endedAt: NOW + 4 * HOUR }),
      ],
      NOW,
    );
    expect(ids(listing.fukui)).toEqual(["9", "10", "30"]);
    expect(ids(listing.ishikawaToyama)).toEqual(["21", "20"]);
  });

  it("終了の節は開始の降順（直近が上）で、県を混ぜる", () => {
    const listing = buildListing(
      [
        ev("a", { startedAt: NOW - 5 * HOUR, endedAt: NOW - 4 * HOUR }),
        ev("b", { prefecture: "ishikawa", startedAt: NOW - 3 * HOUR, endedAt: NOW - 2 * HOUR }),
      ],
      NOW,
    );
    expect(ids(listing.ended)).toEqual(["b", "a"]);
  });
});

describe("RSS-04: RSS に載せるイベント", () => {
  it("これから開催されるものを、初めて保存した時刻の新しい順に並べる", () => {
    const selected = selectFeedEvents(
      [
        ev("old", { firstSeenAt: NOW - 3 * HOUR }),
        ev("new", { firstSeenAt: NOW - HOUR, prefecture: "toyama" }),
        ev("ended", { firstSeenAt: NOW, startedAt: NOW - 2 * HOUR, endedAt: NOW - HOUR }),
      ],
      NOW,
    );
    expect(ids(selected)).toEqual(["new", "old"]);
  });

  it("最大100件", () => {
    const many = Array.from({ length: FEED_LIMIT + 1 }, (_, i) => ev(String(i), { firstSeenAt: NOW - i }));
    const selected = selectFeedEvents(many, NOW);
    expect(selected).toHaveLength(FEED_LIMIT);
    expect(selected[0]?.sourceEventId).toBe("0");
  });
});
