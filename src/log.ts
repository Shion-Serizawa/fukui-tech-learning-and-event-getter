/**
 * ログ出力の唯一の入口。出してよい項目を型と実行時の両方で許可リストに限る。
 * connpass のレスポンス本文や主催者名をログへ書き出す経路を構造として作らない（C-14, C-05）。
 */
export interface LogFields {
  readonly status?: number;
  readonly eventId?: string;
  readonly count?: number;
  readonly durationMs?: number;
  readonly prefecture?: "fukui" | "ishikawa" | "toyama";
  readonly page?: number;
  readonly kind?: string;
}

const ALLOWED_KEYS = ["status", "eventId", "count", "durationMs", "prefecture", "page", "kind"] as const;

export type LogEvent = `${string}.${string}`;

export function pickLogFields(fields: LogFields): LogFields {
  const picked: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (fields[key] !== undefined) picked[key] = fields[key];
  }
  return picked;
}

export function logInfo(event: LogEvent, fields: LogFields = {}): void {
  console.log(JSON.stringify({ level: "info", event, ...pickLogFields(fields) }));
}

export function logError(event: LogEvent, fields: LogFields = {}): void {
  console.error(JSON.stringify({ level: "error", event, ...pickLogFields(fields) }));
}
