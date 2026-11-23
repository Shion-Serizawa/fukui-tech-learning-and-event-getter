import { describe, expect, it } from "vitest";
import { formatEventPeriod, formatJstMinute, formatRfc822, monthsToQuery } from "./time.ts";

const jst = (s: string): number => Date.parse(`${s}+09:00`);

describe("WEB-04: 開催日時の表記（JST）", () => {
  it("同じ日なら終了は時刻だけ", () => {
    expect(formatEventPeriod(jst("2026-10-03T13:00:00"), jst("2026-10-03T17:00:00"))).toBe(
      "2026-10-03 (土) 13:00 - 17:00",
    );
  });

  it("日をまたぐなら終了にも日付を付ける", () => {
    expect(formatEventPeriod(jst("2026-10-03T13:00:00"), jst("2026-10-04T10:30:00"))).toBe(
      "2026-10-03 (土) 13:00 - 2026-10-04 (日) 10:30",
    );
  });

  it("UTC では前日でも JST の日付で表す", () => {
    expect(formatEventPeriod(Date.parse("2026-10-02T15:30:00Z"), Date.parse("2026-10-02T16:00:00Z"))).toBe(
      "2026-10-03 (土) 00:30 - 01:00",
    );
  });
});

describe("WEB-10: 最終収集日時の表記", () => {
  it("YYYY-MM-DD HH:MM（JST）", () => {
    expect(formatJstMinute(Date.parse("2026-09-19T21:05:59Z"))).toBe("2026-09-20 06:05");
  });
});

describe("COL-03: 取得する月（前月から5か月後まで）", () => {
  it("11月なら 10月〜翌4月", () => {
    expect(monthsToQuery(jst("2026-11-23T12:00:00"))).toEqual([
      "202610",
      "202611",
      "202612",
      "202701",
      "202702",
      "202703",
      "202704",
    ]);
  });

  it("1月なら前年12月から", () => {
    expect(monthsToQuery(jst("2027-01-01T00:00:00"))[0]).toBe("202612");
  });

  it("月の境界は JST で判定する（UTC では前月末でも JST で翌月1日）", () => {
    expect(monthsToQuery(Date.parse("2026-11-30T15:00:00Z"))[1]).toBe("202612");
  });
});

describe("RSS-05: pubDate の表記", () => {
  it("RFC 822（GMT）", () => {
    expect(formatRfc822(Date.parse("2026-11-23T03:00:00Z"))).toBe("Mon, 23 Nov 2026 03:00:00 GMT");
  });
});
