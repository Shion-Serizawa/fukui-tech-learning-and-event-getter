// connpass 層の公開入口。外の層はこのファイルだけを import できる（lint: hokuriku/import-boundaries）。
export {
  CONNPASS_EVENTS_ENDPOINT,
  REQUEST_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
  USER_AGENT,
  openConnpassSession,
  type ConnpassDeps,
  type ConnpassSession,
  type PrefectureResult,
} from "./client.ts";
