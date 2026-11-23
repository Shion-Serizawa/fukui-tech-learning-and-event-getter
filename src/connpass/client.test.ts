import { afterEach, describe, expect, it, vi } from "vitest";
import { NOW, fakeConnpassDeps, jsonResponse, parseLogLine } from "../../test/fakes.ts";
import { FIXTURE_OWNER_NAME, connpassEvent, connpassPage } from "./fixtures/events.ts";
import {
  CONNPASS_EVENTS_ENDPOINT,
  REQUEST_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
  USER_AGENT,
  openConnpassSession,
} from "./index.ts";

const empty = (): Response => jsonResponse(connpassPage([]));

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
  it("問い合わせた県を1つだけ prefecture に入れ、返ったイベントにその県を付ける", async () => {
    const deps = fakeConnpassDeps(
      [jsonResponse(connpassPage([connpassEvent({ id: 1 })])), jsonResponse(connpassPage([connpassEvent({ id: 2 })]))],
      NOW,
    );
    const session = openConnpassSession(deps, NOW);
    const fukui = await session.fetchPrefecture("fukui");
    const toyama = await session.fetchPrefecture("toyama");

    expect(deps.requests.map((r) => r.url.searchParams.getAll("prefecture"))).toEqual([["fukui"], ["toyama"]]);
    expect(fukui.ok && fukui.events.map((e) => [e.sourceEventId, e.prefecture])).toEqual([["1", "fukui"]]);
    expect(toyama.ok && toyama.events.map((e) => [e.sourceEventId, e.prefecture])).toEqual([["2", "toyama"]]);
  });
});

describe("COL-03 / COL-06: 送り先とパラメータ", () => {
  it("connpass API v2 のエンドポイントに、API キーと User-Agent をヘッダで付けて送る", async () => {
    const deps = fakeConnpassDeps([empty()], NOW);
    await openConnpassSession(deps, NOW).fetchPrefecture("ishikawa");
    const [request] = deps.requests;
    if (request === undefined) throw new Error("リクエストが送られていない");
    const { url, init } = request;
    expect(`${url.origin}${url.pathname}`).toBe(CONNPASS_EVENTS_ENDPOINT);
    expect(url.searchParams.get("ym")).toBe("202610,202611,202612,202701,202702,202703,202704");
    expect(url.searchParams.get("count")).toBe("100");
    expect(url.searchParams.get("start")).toBe("1");
    expect(url.searchParams.has("api_key")).toBe(false);
    expect(new Headers(init.headers).get("X-API-Key")).toBe("test-connpass-api-key");
    expect(new Headers(init.headers).get("User-Agent")).toBe(USER_AGENT);
    expect(init.method).toBe("GET");
  });
});

describe("COL-04: ページング", () => {
  it("100件ずつ start を進め、返却が100件未満になったら止める", async () => {
    const deps = fakeConnpassDeps([fullPage(100, 1, 250), fullPage(100, 101, 250), fullPage(50, 201, 250)], NOW);
    const result = await openConnpassSession(deps, NOW).fetchPrefecture("fukui");
    expect(deps.requests.map((r) => r.url.searchParams.get("start"))).toEqual(["1", "101", "201"]);
    expect(result).toMatchObject({ ok: true, fetchedCount: 250 });
    expect(result.ok && result.events).toHaveLength(250);
  });

  it("results_available に達したらちょうど100件でも止める", async () => {
    const deps = fakeConnpassDeps([fullPage(100, 1, 100)], NOW);
    expect((await openConnpassSession(deps, NOW).fetchPrefecture("fukui")).ok).toBe(true);
    expect(deps.requests).toHaveLength(1);
  });

  it("1県で3ページを超えるなら too_many_pages で失敗し、4ページ目は取りに行かない", async () => {
    const deps = fakeConnpassDeps([fullPage(100, 1, 5000), fullPage(100, 101, 5000), fullPage(100, 201, 5000)], NOW);
    expect(await openConnpassSession(deps, NOW).fetchPrefecture("fukui")).toEqual({
      ok: false,
      kind: "too_many_pages",
      fetchedCount: 300,
    });
    expect(deps.requests).toHaveLength(3);
  });

  it("送った start と results_start が違えば invalid_response", async () => {
    const deps = fakeConnpassDeps([jsonResponse(connpassPage([], { start: 2 }))], NOW);
    expect(await openConnpassSession(deps, NOW).fetchPrefecture("fukui")).toMatchObject({
      ok: false,
      kind: "invalid_response",
    });
  });
});

describe("COL-05: 12秒に1回の制限を守る", () => {
  it("同じセッションでは、2回目以降のリクエストの前に毎回 13 秒待つ（最初は待たない）", async () => {
    const deps = fakeConnpassDeps([fullPage(100, 1, 150), fullPage(50, 101, 150), empty(), empty()], NOW);
    const session = openConnpassSession(deps, NOW);
    await session.fetchPrefecture("fukui");
    await session.fetchPrefecture("ishikawa");
    await session.fetchPrefecture("toyama");
    expect(REQUEST_INTERVAL_MS).toBeGreaterThanOrEqual(12_000);
    expect(deps.sleeps).toEqual([REQUEST_INTERVAL_MS, REQUEST_INTERVAL_MS, REQUEST_INTERVAL_MS]);
    expect(deps.requests).toHaveLength(4);
  });
});

/** 1県分を取得して、結果と送ったリクエスト数を返す。 */
const fail = async (response: Response | Error) => {
  const deps = fakeConnpassDeps([response], NOW);
  const result = await openConnpassSession(deps, NOW).fetchPrefecture("fukui");
  return { result, requests: deps.requests.length };
};

describe("COL-07: 失敗の分類（再試行しない）", () => {
  it("429 は rate_limited で、その場で再試行しない", async () => {
    expect(await fail(new Response('{"detail": "Too many requests."}', { status: 429 }))).toEqual({
      result: { ok: false, kind: "rate_limited", fetchedCount: 0 },
      requests: 1,
    });
  });

  it("500 は http_error", async () => {
    expect((await fail(new Response("oops", { status: 500 }))).result).toMatchObject({ kind: "http_error" });
  });

  it("通信の例外は network_error", async () => {
    expect((await fail(new TypeError("network down"))).result).toMatchObject({ kind: "network_error" });
  });

  it("JSON でない本文は invalid_response", async () => {
    expect((await fail(new Response("<html>maintenance</html>", { status: 200 }))).result).toMatchObject({
      kind: "invalid_response",
    });
  });

  it("必須フィールドが欠けたイベントを含むページは invalid_response", async () => {
    const broken = connpassEvent();
    delete broken["url"];
    expect((await fail(jsonResponse(connpassPage([broken])))).result).toMatchObject({ kind: "invalid_response" });
  });

  it("2ページ目で失敗したら、1ページ目の件数は fetchedCount に残る", async () => {
    const deps = fakeConnpassDeps([fullPage(100, 1, 150), new Response("x", { status: 503 })], NOW);
    expect(await openConnpassSession(deps, NOW).fetchPrefecture("fukui")).toEqual({
      ok: false,
      kind: "http_error",
      fetchedCount: 100,
    });
  });
});

describe("COL-14: 1リクエスト10秒で打ち切る", () => {
  it("打ち切りの信号を毎回渡し、打ち切られたら network_error", async () => {
    const deps = fakeConnpassDeps([new DOMException("timed out", "TimeoutError")], NOW);
    expect(await openConnpassSession(deps, NOW).fetchPrefecture("fukui")).toMatchObject({
      ok: false,
      kind: "network_error",
    });
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
    const session = openConnpassSession(deps, NOW);
    await session.fetchPrefecture("fukui");
    await session.fetchPrefecture("ishikawa");

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
