import type { ConnpassDeps } from "../src/connpass/index.ts";
import type { Fetcher } from "../src/domain/io.ts";

export interface RecordedRequest {
  readonly url: URL;
  readonly init: RequestInit;
}

export type Scripted = Response | Error | ((request: RecordedRequest) => Response | Promise<Response>);

/** 決められた順に応答する偽の fetch。台本にないリクエストが来たら例外にする。 */
export function scriptedFetch(script: readonly Scripted[]): { fetch: Fetcher; requests: RecordedRequest[] } {
  const queue = [...script];
  const requests: RecordedRequest[] = [];
  const fetch: Fetcher = async (input, init) => {
    const request = { url: new URL(input), init };
    requests.push(request);
    const next = queue.shift();
    if (next === undefined) throw new Error(`台本にないリクエスト: ${input}`);
    if (next instanceof Error) throw next;
    if (typeof next === "function") return next(request);
    return next;
  };
  return { fetch, requests };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** 固定の開始時刻から、呼ばれるたびに 1ms 進む時計。 */
export function steppingClock(start: number): () => number {
  let t = start;
  return () => t++;
}

export interface FakeConnpassDeps extends ConnpassDeps {
  readonly sleeps: number[];
  readonly timeouts: number[];
  readonly requests: RecordedRequest[];
}

export function fakeConnpassDeps(script: readonly Scripted[], now: number): FakeConnpassDeps {
  const { fetch, requests } = scriptedFetch(script);
  const sleeps: number[] = [];
  const timeouts: number[] = [];
  return {
    fetch,
    requests,
    sleeps,
    timeouts,
    apiKey: "test-connpass-api-key",
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    clock: steppingClock(now),
    timeoutSignal: (ms) => {
      timeouts.push(ms);
      return new AbortController().signal;
    },
  };
}

/** 2026-11-23 12:00 JST */
export const NOW = Date.parse("2026-11-23T12:00:00+09:00");
export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

/** 送ったリクエストの本文（文字列で送ったもの）を取り出す。 */
export function bodyText(request: RecordedRequest | undefined): string {
  const body = request?.init.body;
  return typeof body === "string" ? body : "";
}

/** ログ1行（JSON）を読む。 */
export function parseLogLine(line: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(line);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    throw new Error(`ログ行が JSON オブジェクトでない: ${line}`);
  return Object.fromEntries(Object.entries(parsed));
}
