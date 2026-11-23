export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** 日本時間は UTC+9 固定（夏時間なし）。 */
const JST_OFFSET_MS = 9 * HOUR_MS;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

interface JstParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly weekday: number;
}

function jstParts(epochMs: number): JstParts {
  const d = new Date(epochMs + JST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
  };
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

function datePart(p: JstParts): string {
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)} (${WEEKDAYS[p.weekday] ?? ""})`;
}

function timePart(p: JstParts): string {
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** WEB-04: `YYYY-MM-DD (曜) HH:MM - HH:MM`。終了日が違えば終了側にも日付を付ける。 */
export function formatEventPeriod(startedAt: number, endedAt: number): string {
  const s = jstParts(startedAt);
  const e = jstParts(endedAt);
  const sameDay = s.year === e.year && s.month === e.month && s.day === e.day;
  const end = sameDay ? timePart(e) : `${datePart(e)} ${timePart(e)}`;
  return `${datePart(s)} ${timePart(s)} - ${end}`;
}

/** WEB-10: `YYYY-MM-DD HH:MM`（JST）。 */
export function formatJstMinute(epochMs: number): string {
  const p = jstParts(epochMs);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)} ${timePart(p)}`;
}

/** COL-03: now の前月から5か月後までの7か月分（JST の暦月）を `YYYYMM` で返す。 */
export function monthsToQuery(now: number): string[] {
  const p = jstParts(now);
  const months: string[] = [];
  for (let offset = -1; offset <= 5; offset++) {
    const index = p.year * 12 + (p.month - 1) + offset;
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    months.push(`${year}${pad2(month)}`);
  }
  return months;
}

/** RSS の pubDate / lastBuildDate（RFC 822 形式, GMT）。 */
export function formatRfc822(epochMs: number): string {
  return new Date(epochMs).toUTCString();
}
