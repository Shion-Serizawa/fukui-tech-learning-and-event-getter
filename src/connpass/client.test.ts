import { afterEach, describe, expect, it, vi } from "vitest";
import { NOW, fakeConnpassDeps, jsonResponse, parseLogLine } from "../../test/fakes.ts";
import { FIXTURE_OWNER_NAME, connpassEvent, connpassPage } from "./fixtures/events.ts";
import {
  CONNPASS_EVENTS_ENDPOINT,
  REQUEST_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
  USER_AGENT,
  fetchHokurikuEvents,
} from "./index.ts";

const empty = (): Response => jsonResponse(connpassPage([]));
const threeEmpty = (): Response[] => [empty(), empty(), empty()];

const fullPage = (n: number, start: number, available: number): Response =>
  jsonResponse(
    connpassPage(
      Array.from({ length: n }, () => connpassEvent()),
      { start, available },
    ),
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe("COL-02: 県ごとに別のリクエスト", () => {
  it("fukui → ishikawa → toyama の順に1県ずつ問い合わせ、県を付けて返す", async () => {
    const deps = fakeConnpassDeps(
      [
        jsonResponse(connpassPage([connpassEvent({ id: 1 })])),
        jsonResponse(connpassPage([connpassEvent({ id: 2 })])),
        jsonResponse(connpassPage([connpassEvent({ id: 3 })])),
      ],
      NOW,
    );
    const result = await fetchHokurikuEvents(deps, NOW);
    expect(deps.requests.map((r) => r.url.searchParams.getAll("prefecture"))).toEqual([
      ["fukui"],
      ["ishikawa"],
      ["toyama"],
    ]);
    expect(result.ok && result.events.map((e) => [e.sourceEventId, e.prefecture])).toEqual([
      ["1", "fukui"],
      ["2", "ishikawa"],
      ["3", "toyama"],
    ]);
  });
});

describe("COL-03 / COL-06: 送り先とパラメータ", () => {
  it("connpass API v2 のエンドポイントに、API キーをヘッダで付けて送る", async () => {
    const deps = fakeConnpassDeps(threeEmpty(), NOW);
    await fetchHokurikuEvents(deps, NOW);
    for (const { url, init } of deps.requests) {
      expect(`${url.origin}${url.pathname}`).toBe(CONNPASS_EVENTS_ENDPOINT);
      expect(url.searchParams.get("ym")).toBe("202610,202611,202612,202701,202702,202703,202704");
      expect(url.searchParams.get("count")).toBe("100");
      expect(url.searchParams.get("start")).toBe("1");
      expect(url.searchParams.has("api_key")).toBe(false);
      expect(new Headers(init.headers).get("X-API-Key")).toBe("test-connpass-api-key");
      expect(new Headers(init.headers).get("User-Agent")).toBe(USER_AGENT);
      expect(init.method).toBe("GET");
    }
  });
});

describe("COL-04: ページング", () => {
  it("100件ずつ start を進め、返却が100件未満になったら止める", async () => {
    const deps = fakeConnpassDeps(
      [fullPage(100, 1, 250), fullPage(100, 101, 250), fullPage(50, 201, 250), empty(), empty()],
      NOW,
    );
    const result = await fetchHokurikuEvents(deps, NOW);
    expect(deps.requests.slice(0, 3).map((r) => r.url.searchParams.get("start"))).toEqual(["1", "101", "201"]);
    expect(result.ok && result.events).toHaveLength(250);
  });

  it("results_available に達したらちょうど100件でも止める", async () => {
    const full = jsonResponse(
      connpassPage(
        Array.from({ length: 100 }, () => connpassEvent()),
        { available: 100 },
      ),
    );
    const deps = fakeConnpassDeps([full, empty(), empty()], NOW);
    expect((await fetchHokurikuEvents(deps, NOW)).ok).toBe(true);
    expect(deps.requests).toHaveLength(3);
  });

  it("1県で10ページを超えるなら too_many_pages で失敗する", async () => {
    const pages = Array.from({ length: 10 }, (_, i) =>
      jsonResponse(
        connpassPage(
          Array.from({ length: 100 }, () => connpassEvent()),
          { start: i * 100 + 1, available: 5000 },
        ),
      ),
    );
    const deps = fakeConnpassDeps(pages, NOW);
    expect(await fetchHokurikuEvents(deps, NOW)).toEqual({ ok: false, kind: "too_many_pages", fetchedCount: 1000 });
    expect(deps.requests).toHaveLength(10);
  });

  it("送った start と results_start が違えば invalid_response", async () => {
    const deps = fakeConnpassDeps([jsonResponse(connpassPage([], { start: 2 }))], NOW);
    expect(await fetchHokurikuEvents(deps, NOW)).toMatchObject({ ok: false, kind: "invalid_response" });
  });
});

describe("COL-05: レート制限を守る", () => {
  it("2回目以降のリクエストの前に毎回 1100ms 待つ（最初は待たない）", async () => {
    const deps = fakeConnpassDeps(threeEmpty(), NOW);
    await fetchHokurikuEvents(deps, NOW);
    expect(REQUEST_INTERVAL_MS).toBeGreaterThanOrEqual(1000);
    expect(deps.sleeps).toEqual([REQUEST_INTERVAL_MS, REQUEST_INTERVAL_MS]);
  });
});

describe("COL-07: 失敗の分類", () => {
  it("429 は rate_limited で、その回のうちに再試行しない", async () => {
    const deps = fakeConnpassDeps([new Response("slow down", { status: 429 })], NOW);
    expect(await fetchHokurikuEvents(deps, NOW)).toEqual({ ok: false, kind: "rate_limited", fetchedCount: 0 });
    expect(deps.requests).toHaveLength(1);
  });

  it("2県目で 500 なら http_error。1県目の取得件数は fetchedCount に残る", async () => {
    const deps = fakeConnpassDeps(
      [jsonResponse(connpassPage([connpassEvent()])), new Response("oops", { status: 500 })],
      NOW,
    );
    expect(await fetchHokurikuEvents(deps, NOW)).toEqual({ ok: false, kind: "http_error", fetchedCount: 1 });
  });

  it("通信の例外は network_error", async () => {
    const deps = fakeConnpassDeps([new TypeError("network down")], NOW);
    expect(await fetchHokurikuEvents(deps, NOW)).toMatchObject({ ok: false, kind: "network_error" });
  });

  it("JSON でない本文は invalid_response", async () => {
    const deps = fakeConnpassDeps([new Response("<html>maintenance</html>", { status: 200 })], NOW);
    expect(await fetchHokurikuEvents(deps, NOW)).toMatchObject({ ok: false, kind: "invalid_response" });
  });

  it("必須フィールドが欠けたイベントを含むページは invalid_response", async () => {
    const broken = connpassEvent();
    delete broken["url"];
    const deps = fakeConnpassDeps([jsonResponse(connpassPage([broken]))], NOW);
    expect(await fetchHokurikuEvents(deps, NOW)).toMatchObject({ ok: false, kind: "invalid_response" });
  });
});

describe("COL-14: 1リクエスト10秒で打ち切る", () => {
  it("打ち切りの信号を毎回渡し、打ち切られたら network_error", async () => {
    const deps = fakeConnpassDeps([new DOMException("timed out", "TimeoutError")], NOW);
    expect(await fetchHokurikuEvents(deps, NOW)).toMatchObject({ ok: false, kind: "network_error" });
    expect(deps.timeouts).toEqual([REQUEST_TIMEOUT_MS]);
    expect(deps.requests[0]?.init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("COL-10: ログには本文・タイトル・主催者名・API キーを出さない", () => {
  it("出力されたログ行は許可した項目だけでできている", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line: string) => lines.push(line));
    vi.spyOn(console, "error").mockImplementation((line: string) => lines.push(line));
    const deps = fakeConnpassDeps(
      [jsonResponse(connpassPage([connpassEvent({ title: "秘密のタイトル" })])), new Response("x", { status: 503 })],
      NOW,
    );
    await fetchHokurikuEvents(deps, NOW);

    expect(lines.length).toBeGreaterThan(0);
    const allowed = new Set([
      "level",
      "event",
      "status",
      "eventId",
      "count",
      "durationMs",
      "prefecture",
      "page",
      "kind",
    ]);
    for (const line of lines) {
      for (const key of Object.keys(parseLogLine(line))) expect(allowed).toContain(key);
      expect(line).not.toContain("秘密のタイトル");
      expect(line).not.toContain(FIXTURE_OWNER_NAME);
      expect(line).not.toContain("test-connpass-api-key");
    }
  });
});
