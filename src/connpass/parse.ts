import type { HokurikuEvent, Prefecture } from "../domain/event.ts";

/**
 * connpass のレスポンスからこのプロジェクトの型への唯一の変換点（R-03）。
 * 値は unknown として受け、使うフィールドだけを明示列挙して検証する（allowlist）。
 * 想定と違う形なら null を返し、呼び出し側はその収集回を invalid_response で失敗させる（COL-11）。
 * 主催者に関するフィールドは読まない（C-14）。
 */

export interface ParsedPage {
  readonly resultsReturned: number;
  readonly resultsAvailable: number;
  readonly resultsStart: number;
  /** 中止（cancelled）を除いたイベント（COL-13）。 */
  readonly events: readonly HokurikuEvent[];
  /** 中止を含め、レスポンスに入っていたイベントの数。ページングの判定に使う。 */
  readonly rawCount: number;
}

type Json = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeInt(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

/** 任意の文字列。存在しない・null・空白のみは null。文字列以外の型は undefined（検証失敗）。 */
function optionalText(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function instant(value: unknown): number | undefined {
  if (typeof value !== "string" || !ISO_WITH_ZONE.test(value)) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

/** https で、ホストが connpass.com かそのサブドメインの URL だけを通す。javascript: 等を画面に出さないため。 */
export function connpassUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  const hostOk = url.hostname === "connpass.com" || url.hostname.endsWith(".connpass.com");
  if (url.protocol !== "https:" || !hostOk || url.username !== "" || url.password !== "" || url.port !== "") {
    return undefined;
  }
  return url.href;
}

type ParsedEvent = { readonly cancelled: true } | { readonly cancelled: false; readonly event: HokurikuEvent };

function parseEvent(raw: unknown, prefecture: Prefecture): ParsedEvent | undefined {
  if (!isRecord(raw)) return undefined;

  const openStatus = optionalText(raw["open_status"]);
  if (openStatus === undefined) return undefined;
  if (openStatus === "cancelled") return { cancelled: true };

  const id = nonNegativeInt(raw["id"]);
  const title = optionalText(raw["title"]);
  const url = connpassUrl(raw["event_url"]);
  const startedAt = instant(raw["started_at"]);
  const endedAt = instant(raw["ended_at"]);
  const accepted = nonNegativeInt(raw["accepted"]);
  const place = optionalText(raw["place"]);
  const address = optionalText(raw["address"]);
  const hashTag = optionalText(raw["hash_tag"]);
  const rawLimit = raw["limit"];
  const limit = rawLimit === undefined || rawLimit === null ? null : nonNegativeInt(rawLimit);

  if (
    id === undefined ||
    title === undefined ||
    title === null ||
    url === undefined ||
    startedAt === undefined ||
    endedAt === undefined ||
    endedAt < startedAt ||
    accepted === undefined ||
    place === undefined ||
    address === undefined ||
    hashTag === undefined ||
    limit === undefined
  ) {
    return undefined;
  }

  const tag = hashTag?.replace(/^#+/, "").trim() ?? "";
  return {
    cancelled: false,
    event: {
      source: "connpass",
      sourceEventId: String(id),
      title,
      url,
      startedAt,
      endedAt,
      place,
      address,
      capacity: limit === 0 ? null : limit,
      accepted,
      hashTag: tag === "" ? null : tag,
      prefecture,
    },
  };
}

export function parseEventsPage(body: unknown, prefecture: Prefecture): ParsedPage | null {
  if (!isRecord(body)) return null;
  const resultsReturned = nonNegativeInt(body["results_returned"]);
  const resultsAvailable = nonNegativeInt(body["results_available"]);
  const resultsStart = nonNegativeInt(body["results_start"]);
  const rawEvents = body["events"];
  if (
    resultsReturned === undefined ||
    resultsAvailable === undefined ||
    resultsStart === undefined ||
    !Array.isArray(rawEvents)
  ) {
    return null;
  }

  const events: HokurikuEvent[] = [];
  for (const raw of rawEvents) {
    const parsed = parseEvent(raw, prefecture);
    if (parsed === undefined) return null;
    if (!parsed.cancelled) events.push(parsed.event);
  }
  return { resultsReturned, resultsAvailable, resultsStart, events, rawCount: rawEvents.length };
}
