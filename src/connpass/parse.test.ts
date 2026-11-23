import { describe, expect, it } from "vitest";
import { FIXTURE_OWNER_NAME, connpassEvent, connpassPage } from "./fixtures/events.ts";
import { connpassUrl, parseEventsPage } from "./parse.ts";

describe("COL-11: レスポンスの実行時検証", () => {
  it("正しい形なら、使うフィールドだけをプロジェクトの型に変換する", () => {
    const raw = connpassEvent({ id: 7 });
    const page = parseEventsPage(connpassPage([raw]), "fukui");
    expect(page?.events).toEqual([
      {
        source: "connpass",
        sourceEventId: "7",
        title: "福井 IT 勉強会 #7",
        url: "https://fukui-dev.connpass.com/event/7/",
        startedAt: Date.parse("2026-12-05T13:00:00+09:00"),
        endedAt: Date.parse("2026-12-05T17:00:00+09:00"),
        place: "福井市 ○○センター",
        address: "福井県福井市大手3丁目",
        capacity: 40,
        accepted: 25,
        hashTag: "fukuidev",
        prefecture: "fukui",
      },
    ]);
  });

  const requiredFields = ["id", "title", "event_url", "started_at", "ended_at", "accepted"];
  for (const field of requiredFields) {
    it(`必須フィールド ${field} が欠けたら null（その回は invalid_response）`, () => {
      const raw = connpassEvent();
      delete raw[field];
      expect(parseEventsPage(connpassPage([raw]), "fukui")).toBeNull();
    });
  }

  const wrongTypes: Record<string, unknown> = {
    id: "7",
    title: "",
    started_at: "2026-12-05 13:00",
    ended_at: 1764900000,
    accepted: -1,
    limit: "40",
    place: 3,
    hash_tag: ["x"],
    open_status: 1,
  };
  for (const [field, value] of Object.entries(wrongTypes)) {
    it(`${field} の型や値が想定外（${JSON.stringify(value)}）なら null`, () => {
      expect(parseEventsPage(connpassPage([connpassEvent({ [field]: value })]), "fukui")).toBeNull();
    });
  }

  it("終了が開始より前なら null", () => {
    const raw = connpassEvent({ started_at: "2026-12-05T13:00:00+09:00", ended_at: "2026-12-05T12:59:00+09:00" });
    expect(parseEventsPage(connpassPage([raw]), "fukui")).toBeNull();
  });

  it("トップレベルの形が違えば null", () => {
    expect(parseEventsPage(null, "fukui")).toBeNull();
    expect(parseEventsPage([], "fukui")).toBeNull();
    expect(parseEventsPage({ ...connpassPage([]), events: {} }, "fukui")).toBeNull();
    expect(parseEventsPage({ events: [] }, "fukui")).toBeNull();
  });

  it("任意フィールドは空文字・null・欠落を null にそろえ、定員 0 は定員なし、ハッシュタグの # を取る", () => {
    const raw = connpassEvent({ place: "  ", address: null, limit: 0, hash_tag: "#kanazawa " });
    delete raw["open_status"];
    const event = parseEventsPage(connpassPage([raw]), "ishikawa")?.events[0];
    expect(event).toMatchObject({
      place: null,
      address: null,
      capacity: null,
      hashTag: "kanazawa",
      prefecture: "ishikawa",
    });
  });
});

describe("COL-11 / WEB-17: 主催者名は変換で捨てられる（C-14）", () => {
  it("変換後のどこにも主催者名が現れない", () => {
    const page = parseEventsPage(connpassPage([connpassEvent()]), "fukui");
    expect(JSON.stringify(page)).not.toContain(FIXTURE_OWNER_NAME);
  });
});

describe("COL-13: 中止のイベントは保存対象から外す", () => {
  it("cancelled は events に入らないが、ページングの件数には数える", () => {
    const page = parseEventsPage(connpassPage([connpassEvent({ open_status: "cancelled" }), connpassEvent()]), "fukui");
    expect(page?.events).toHaveLength(1);
    expect(page?.rawCount).toBe(2);
  });

  it("中止のイベントは他のフィールドが壊れていても回全体を失敗させない", () => {
    const page = parseEventsPage(connpassPage([connpassEvent({ open_status: "cancelled", title: null })]), "fukui");
    expect(page?.events).toEqual([]);
  });
});

describe("COL-11: リンクに使う URL は connpass の https だけ（XSS 対策）", () => {
  it.each(["https://connpass.com/event/1/", "https://fukui-dev.connpass.com/event/1/"])("通す: %s", (url) => {
    expect(connpassUrl(url)).toBe(url);
  });

  it.each([
    "javascript:alert(1)",
    "http://connpass.com/event/1/",
    "https://connpass.com.evil.example/event/1/",
    "https://evilconnpass.com/event/1/",
    "https://user:pass@connpass.com/event/1/",
    "https://connpass.com:8443/event/1/",
    "//connpass.com/event/1/",
    "not a url",
  ])("拒否: %s", (url) => {
    expect(connpassUrl(url)).toBeUndefined();
  });
});
